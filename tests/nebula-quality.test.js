import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { Group, Vector3 } from 'three';
import { createNebulaQuality } from '../src/nebula-quality.js';
import { createNebulaDensity, sampleNebulaDensity } from '../src/nebula-density.js';
import { createStarTransmission } from '../src/star-nebula-transmission.js';
import volume from '../src/data/nebula-density.json';
const load = async (path) => {
  const raw = readFileSync(new URL('../public' + path, import.meta.url));
  return new Uint8Array(gunzipSync(raw));
};
it('reduces both moving and resting budgets after sustained slow frames and recovers gradually', () => {
  const quality = createNebulaQuality();
  const before = quality.budget(true);
  for (let i = 0; i < 8; i++) quality.sample(60);
  expect(quality.budget(true).scale).toBeLessThan(before.scale);
  expect(quality.budget(false).scale).toBeLessThan(quality.budget(true).scale);
  for (let i = 0; i < 359; i++) quality.sample(16);
  expect(quality.budget(true).tier).toBe(0);
  quality.sample(16);
  expect(quality.budget(true).tier).toBe(1);
  quality.setMode('high');
  for (let i = 0; i < 20; i++) quality.sample(80);
  expect(quality.budget(true).scale).toBe(1);
  quality.setMode('low');
  expect(quality.budget(true).steps).toBe(24);
});
it('ships valid bounded finite density, light, dust and color channels with lossless provenance', async () => {
  for (const asset of volume.assets) {
    const compressed = readFileSync(new URL('../public' + asset.texture, import.meta.url));
    expect(createHash('sha256').update(compressed).digest('hex')).toBe(asset.sha256);
    expect(gunzipSync(compressed).length).toBe(asset.bytes);
  }
  const field = createNebulaDensity({ load });
  await field.promise;
  expect(field.ready).toBe(true);
  expect(field.failed).toBe(false);
  expect(field.density.image.width).toBe(128);
  expect(sampleNebulaDensity(field.density, 1, 0, 0)).toBe(0);
  const values = [];
  for (let z = -0.8; z < 0.9; z += 0.2)
    for (let x = -0.7; x < 0.8; x += 0.15) values.push(sampleNebulaDensity(field.density, x, 0.1, z));
  expect(values.every((v) => Number.isFinite(v) && v >= 0 && v <= 2.5)).toBe(true);
  expect(Math.max(...values)).toBeGreaterThan(0.05);
  expect(values.filter((v) => v < 0.001).length).toBeGreaterThan(5);
  // A sampler created before asynchronous loading observes the loaded field.
  const pending = createNebulaDensity({ load });
  const transmission = createStarTransmission({ group: new Group(), density: pending.density });
  await pending.promise;
  const camera = { position: new Vector3(0.3, -0.2, 2) };
  expect(transmission(new Vector3(0.3, -0.2, -1), camera)).toBeLessThan(1);
  expect(transmission(new Vector3(0.3, -0.2, 1.2), camera)).toBe(1);
  field.dispose();
  pending.dispose();
});
it('fails safely on corrupt density and does not resurrect a disposed texture', async () => {
  const broken = createNebulaDensity({ load: async () => new Uint8Array(2) });
  await broken.promise;
  expect(broken.failed).toBe(true);
  expect(broken.ready).toBe(false);
  broken.dispose();
  const pending = createNebulaDensity({ load });
  pending.dispose();
  await pending.promise;
  expect(pending.ready).toBe(false);
  expect(pending.density.image.width).toBe(1);
});
