import { expect, it } from 'vitest';
import { Scene, PerspectiveCamera, Texture, Vector3 } from 'three';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import images from '../src/data/nebula-images.json';
import fields from '../src/data/nebula-environments.json';
import { layoutNebulae, nebulaBackPlane, ORION_DEPTH_SCALE } from '../src/nebula-layout.js';
import { createNebulaSystem } from '../src/nebula-system.js';
import { NEBULA_EXPERIENCES, searchNebulae } from '../src/nebula-experiences.js';
import { gunzipSync } from 'node:zlib';

it('ships only Orion with verified optical/infrared assets and observed catalogue provenance', () => {
  expect(images.map((image) => image.id)).toEqual(['orion']);
  expect(fields.map((field) => field.id)).toEqual(['orion']);
  for (const asset of [
    images[0],
    images[0].infrared,
    images[0].gasTexture,
    images[0].highResolution,
    images[0].starlessTexture,
  ]) {
    expect(
      createHash('sha256')
        .update(readFileSync(new URL('../public' + asset.texture, import.meta.url)))
        .digest('hex'),
    ).toBe(asset.sha256);
  }
  expect(fields[0].stars).toHaveLength(96);
  expect(fields[0].trapezium).toHaveLength(4);
  expect(fields[0].stars.every((star) => typeof star.sourceId === 'string')).toBe(true);
});
it('widens the principal gas section to 102 percent and extends the flight behind its entrance', () => {
  for (const aspect of [1440 / 900, 768 / 900, 390 / 900]) {
    const [record] = layoutNebulae(images, 8042026, aspect);
    const camera = new PerspectiveCamera(50, aspect, 0.1, 100000);
    camera.position.z = 160;
    camera.updateMatrixWorld();
    const right = new Vector3(record.position[0] + record.radius, 0, record.principalZ).project(camera);
    const left = new Vector3(record.position[0] - record.radius, 0, record.principalZ).project(camera);
    expect((right.x - left.x) / 2).toBeCloseTo(1.02, 5);
    expect((right.x + left.x) / 2).toBeCloseTo(0.3, 5);
    expect(record.frontZ).toBeLessThan(camera.position.z);
    expect(record.travelLength).toBeGreaterThan(record.radius * 1.15 * 2 * 2.2);
    expect(nebulaBackPlane(record)).toBeLessThan(record.position[2] - record.radius * ORION_DEPTH_SCALE);
  }
});
it('flies through a continuous volume and fixed stars, exits behind, and releases owned resources once', () => {
  const scene = new Scene(),
    camera = new PerspectiveCamera(50, 1440 / 900, 0.1, 100000);
  camera.position.z = 160;
  const textures = [];
  const system = createNebulaSystem(scene, camera, {
    loader: {
      load(_url, ready) {
        const texture = new Texture();
        textures.push(texture);
        ready?.();
        return texture;
      },
    },
  });
  expect(system.loaded).toBe(1);
  expect(system.brightStarCount).toBe(4);
  expect(system.update().visible).toBe(1);
  const points = scene.getObjectByName('orion-gaia-field-sources');
  const positions = Array.from(points.geometry.attributes.position.array);
  const prominence = Array.from(points.geometry.attributes.prominence.array);
  expect(prominence.filter(Boolean)).toHaveLength(4);
  // Featured lights are the existing observed Gaia counterparts, not duplicate stars.
  for (let i = 0; i < prominence.length; i++) {
    const member = fields[0].trapezium.some((m) => m.gaiaSourceId === fields[0].stars[i].sourceId);
    expect(prominence[i]).toBe(Number(member));
    expect(Math.abs(positions[i * 3 + 2])).toBeLessThan(1);
  }
  const [record] = system.records;
  camera.position.fromArray(record.position);
  expect(system.update().inside).toBe('orion');
  expect(scene.getObjectByName('orion-continuous-gas').visible).toBe(true);
  expect(scene.getObjectByName('orion-observed-image')).toBeUndefined();
  camera.position.z = nebulaBackPlane(record);
  expect(system.update().inside).toBe(null);
  expect(Array.from(points.geometry.attributes.position.array)).toEqual(positions);
  let disposed = 0;
  textures.forEach((texture) => texture.addEventListener('dispose', () => disposed++));
  system.dispose();
  system.dispose();
  expect(disposed).toBe(2);
  expect(scene.children).toHaveLength(0);
});

it('ships thirteen distinct 128-cubed alternate volumes with verified payloads and shared fine detail', () => {
  const hashes = [];
  for (const { manifest } of NEBULA_EXPERIENCES.filter((item) => item.manifest)) {
    for (const asset of manifest.assets) {
      const bytes = readFileSync(new URL('../public' + asset.texture, import.meta.url));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(gunzipSync(bytes).byteLength).toBe(asset.bytes);
    }
    expect(manifest.assets[0].dimensions).toEqual([128, 128, 128]);
    hashes.push(manifest.assets[0].sha256);
  }
  expect(new Set(hashes).size).toBe(13);
});

it('ships ten credited observational guides with intact local hashes', () => {
  const popular = NEBULA_EXPERIENCES.filter((item) => item.source);
  expect(popular).toHaveLength(10);
  for (const profile of popular) {
    const bytes = readFileSync(new URL('../public' + profile.guide, import.meta.url));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(profile.guideSha256);
    const preview = readFileSync(new URL('../public' + profile.preview, import.meta.url));
    expect(createHash('sha256').update(preview).digest('hex')).toBe(profile.previewSha256);
    expect(profile.preview).not.toBe(profile.guide);
    expect(profile.credit).toBeTruthy();
    expect(profile.source).toMatch(/^https:\/\/esahubble.org\/images\//);
    expect(profile.license).toBe('CC BY 4.0');
  }
  expect(searchNebulae('ngc7293').map((item) => item.id)).toEqual(['helix']);
  expect(searchNebulae('HÉLICE', 'es', { helix: 'Hélice' }).map((item) => item.id)).toEqual(['helix']);
  expect(searchNebulae('ATBAŞI', 'tr', { horsehead: 'Atbaşı' }).map((item) => item.id)).toEqual(['horsehead']);
  expect(searchNebulae('does not exist')).toHaveLength(0);
});

it('bounds the alternate-volume cache and disposes evicted gas and guide textures', async () => {
  const scene = new Scene(),
    camera = new PerspectiveCamera(50, 1.6, 0.1, 100000),
    evicted = [];
  const system = createNebulaSystem(scene, camera, {
    fieldStars: false,
    loader: {
      load: () => new Texture(),
      loadAsync: async () => {
        const texture = new Texture();
        texture.addEventListener('dispose', () => evicted.push('guide'));
        return texture;
      },
    },
    densityFactory() {
      return {
        density: new Texture(),
        detail: new Texture(),
        ready: true,
        promise: Promise.resolve(),
        dispose() {
          evicted.push('volume');
        },
      };
    },
  });
  for (const profile of NEBULA_EXPERIENCES.filter((item) => item.source)) {
    expect(await system.selectExperience(profile.id)).toBe(true);
    expect(system.cachedVolumes).toBeLessThanOrEqual(3);
  }
  expect(evicted.filter((type) => type === 'guide')).toHaveLength(7);
  expect(evicted.filter((type) => type === 'volume')).toHaveLength(7);
  expect(system.experience).toBe('trifid');
  system.dispose();
  expect(evicted.filter((type) => type === 'guide')).toHaveLength(10);
});

it('switches gas and extinction together without changing record geometry', async () => {
  const scene = new Scene(),
    camera = new PerspectiveCamera(50, 1.6, 0.1, 100000);
  const system = createNebulaSystem(scene, camera, { fieldStars: false, loader: { load: () => new Texture() } });
  const geometry = JSON.stringify(system.records);
  const original = system.starMedium.density;
  for (const item of NEBULA_EXPERIENCES.slice(1)) {
    expect(await system.selectExperience(item.id)).toBe(true);
    expect(system.experience).toBe(item.id);
    expect(system.starMedium.density).not.toBe(original);
    expect(scene.getObjectByName('orion-continuous-gas').material.uniforms.densityMap.value).toBe(
      system.starMedium.density,
    );
    expect(JSON.stringify(system.records)).toBe(geometry);
  }
  expect(await system.selectExperience('unknown')).toBe(false);
  await system.selectExperience('orion');
  expect(system.starMedium.density).toBe(original);
  system.dispose();
});

it('cancels a late volume switch on return and retries failed loads without replacing the visible scene', async () => {
  const scene = new Scene(),
    camera = new PerspectiveCamera(50, 1.6, 0.1, 100000);
  const pending = [];
  const system = createNebulaSystem(scene, camera, {
    fieldStars: false,
    loader: { load: () => new Texture() },
    densityFactory(options) {
      const volume = { density: new Texture(), detail: new Texture(), ready: !options, failed: false, dispose() {} };
      volume.promise = options ? new Promise((resolve) => pending.push({ volume, resolve })) : Promise.resolve();
      return volume;
    },
  });
  const late = system.selectExperience('ion-veil');
  await system.selectExperience('orion');
  pending[0].volume.ready = true;
  pending[0].resolve();
  expect(await late).toBe(false);
  expect(system.experience).toBe('orion');
  const failure = system.selectExperience('ember-reach');
  pending[1].volume.failed = true;
  pending[1].resolve();
  expect(await failure).toBe(false);
  expect(system.experience).toBe('orion');
  const retry = system.selectExperience('ember-reach');
  pending[2].volume.ready = true;
  pending[2].resolve();
  expect(await retry).toBe(true);
  system.dispose();
});
