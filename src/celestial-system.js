import * as THREE from 'three';
import nebulae from './data/catalog/nebulae-200.json';
let asteroids = [];
let fireballs = [];
import { createCatalogLayer, catalogRecords, overviewZoom } from './catalog-layer.js';
import { mountCelestialUI } from './celestial-ui.js';

export { nebulae, asteroids, fireballs };

import { asteroidPosition } from './asteroid-orbit.js';

function nebulaAtlas() {
  const kinds = ['planetary', 'supernova-remnant', 'reflection', 'hii', 'emission', 'nebula', 'cluster-nebula'];
  const size = 128,
    width = size * 7,
    height = size * 4;
  const rgba = new Uint8Array(width * height * 4);
  for (let variant = 0; variant < 4; variant++)
    for (let kind = 0; kind < 7; kind++) {
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const nx = (x + 0.5 - size / 2) / (size / 2),
            ny = (y + 0.5 - size / 2) / (size / 2);
          const angle = variant * 0.63,
            u = nx * Math.cos(angle) - ny * Math.sin(angle),
            v = nx * Math.sin(angle) + ny * Math.cos(angle);
          const r = Math.hypot(u, v),
            a = Math.atan2(v, u);
          const turbulence =
            0.56 + 0.24 * Math.sin(u * (13 + variant * 3) + Math.sin(v * 17)) + 0.12 * Math.cos(v * 31 + u * 23);
          let gas =
            Math.max(0, 1 - r * r) ** 2 * turbulence * (0.4 + 0.6 * Math.sin(u * 8 - v * 6 + Math.sin(v * 5)) ** 2);
          if (kind === 0)
            gas =
              Math.exp(-(((r - 0.56 - 0.03 * Math.cos(a * (3 + variant))) / 0.11) ** 2)) *
              (0.7 + 0.3 * Math.sin(a * 11) ** 2);
          if (kind === 1)
            gas = Math.max(0, 1 - r * r) ** 2 * (0.12 + 0.88 * Math.sin(a * 17 + r * 34 + Math.sin(a * 7)) ** 12);
          const blue = kind === 2 || (kind === 0 && r < 0.5);
          const color = blue ? [91, 171, 240] : [224, 105 + variant * 13, 114 + variant * 15];
          const index = ((y + variant * size) * width + x + kind * size) * 4;
          rgba.set([...color, Math.round(Math.min(1, Math.max(0, gas)) * 220)], index);
        }
    }
  const map = new THREE.DataTexture(rgba, width, height);
  map.colorSpace = THREE.SRGBColorSpace;
  map.minFilter = map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  return { map, kinds };
}

function createNebulae(scene) {
  const { map, kinds } = nebulaAtlas();
  const geometry = new THREE.PlaneGeometry(2, 2);
  geometry.setAttribute(
    'tileIndex',
    new THREE.InstancedBufferAttribute(
      new Float32Array(nebulae.flatMap((r) => Array(3).fill(kinds.indexOf(r.kind) + (r.seed % 4) * 7))),
      1,
    ),
  );
  const material = new THREE.ShaderMaterial({
    uniforms: { atlas: { value: map } },
    vertexShader: `attribute float tileIndex; varying vec2 tileUV; varying float alpha;
      void main() { tileUV=(uv+vec2(mod(tileIndex,7.0),floor(tileIndex/7.0)))/vec2(7.0,4.0);
        vec4 p=modelViewMatrix*instanceMatrix*vec4(position,1.0);
        alpha=smoothstep(12.0,60.0,-p.z)*(1.0-smoothstep(1600.0,5000.0,-p.z));
        gl_Position=projectionMatrix*p; }`,
    fragmentShader: `uniform sampler2D atlas; varying vec2 tileUV; varying float alpha;
      void main() { vec4 gas=texture2D(atlas,tileUV); gl_FragColor=vec4(gas.rgb,gas.a*alpha*.34); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, nebulae.length * 3);
  mesh.frustumCulled = false;
  mesh.name = '200-real-nebulae-artistic';
  const transform = new THREE.Object3D();
  nebulae.forEach((r, i) => {
    transform.position.fromArray(r.scenePosition);
    transform.rotation.z = ((r.positionAngleDeg ?? r.seed % 180) * Math.PI) / 180;
    const size = 24 + Math.min(60, Math.sqrt(r.majorArcmin ?? 3) * 6);
    transform.scale.set(
      size,
      size * Math.max(0.4, Math.min(1, (r.minorArcmin ?? r.majorArcmin ?? 1) / (r.majorArcmin ?? 1))),
      1,
    );
    transform.updateMatrix();
    for (let slice = 0; slice < 3; slice++) {
      transform.position.z = r.scenePosition[2] + (slice - 1) * 32;
      transform.rotation.z += slice * 0.13;
      transform.updateMatrix();
      mesh.setMatrixAt(i * 3 + slice, transform.matrix);
    }
  });
  scene.add(mesh);
  return {
    update(camera) {
      mesh.visible = camera.position.z < 5200;
    },
    dispose() {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      map.dispose();
    },
  };
}

function createAsteroids(scene) {
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      rough = 0.85 + 0.17 * Math.sin(x * 13 + y * 17 + z * 23);
    p.setXYZ(i, x * rough, y * rough, z * rough);
  }
  geometry.computeVertexNormals();
  const material = new THREE.ShaderMaterial({
    uniforms: { alpha: { value: 0 } },
    vertexColors: true,
    transparent: true,
    vertexShader: `varying vec3 n; varying vec3 tint; void main() { tint=instanceColor; n=normalize(normalMatrix*mat3(instanceMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float alpha; varying vec3 n; varying vec3 tint; void main() { float light=.22+.78*max(0.0,dot(normalize(n),normalize(vec3(-.5,.7,1.0)))); gl_FragColor=vec4(tint*light,alpha); }`,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, asteroids.length);
  const transform = new THREE.Object3D();
  asteroids.forEach((r, i) => {
    transform.position.fromArray(asteroidPosition(r));
    transform.rotation.set(r.seed * 0.37, r.seed * 0.61, r.seed * 0.23);
    // Exaggerated logarithmic size for readability; never an observed shape.
    const size = 0.4 + Math.log1p(r.diameterKm) * 0.65;
    transform.scale.set(size, size * (0.7 + (r.seed % 11) / 30), size * 0.85);
    transform.updateMatrix();
    mesh.setMatrixAt(i, transform.matrix);
    const brightness = 0.22 + Math.sqrt(r.albedo ?? 0.1) * 0.55;
    mesh.setColorAt(i, new THREE.Color(brightness, brightness * 0.92, brightness * 0.83));
  });
  scene.add(mesh);
  return {
    update(camera) {
      material.uniforms.alpha.value = 1 - THREE.MathUtils.smoothstep(camera.position.z, 400, 1600);
      mesh.visible = material.uniforms.alpha.value > 0.001;
    },
    dispose() {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    },
  };
}

function createMeteorReplay(scene) {
  const root = new THREE.Group();
  root.position.set(950, -650, -600);
  root.visible = false;
  scene.add(root);
  const map = new THREE.TextureLoader().load('/assets/planets/earth.jpg');
  map.colorSpace = THREE.SRGBColorSpace;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 32), new THREE.MeshBasicMaterial({ map }));
  root.add(earth);
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(40.7, 32, 24),
    new THREE.MeshBasicMaterial({
      color: 0x55aaff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  root.add(atmosphere);
  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const material = new THREE.LineBasicMaterial({ color: 0xffd1a0, transparent: true, opacity: 0, depthWrite: false });
  const trail = new THREE.Line(geometry, material);
  root.add(trail);
  const radial = new THREE.Vector3(),
    tangent = new THREE.Vector3();
  let selected = null,
    started = null;
  return {
    position: root.position,
    focus(record) {
      selected = record;
      started = null;
      root.visible = true;
      if (record.latitudeDeg === null || record.longitudeDeg === null) {
        material.opacity = 0;
        return;
      }
      const lat = (record.latitudeDeg * Math.PI) / 180,
        lon = (record.longitudeDeg * Math.PI) / 180;
      radial.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
      tangent.crossVectors(radial, new THREE.Vector3(0, 1, 0)).normalize();
      // Schematic tangential path. Velocity components are preserved in the catalog,
      // but their frame is not assumed to match this visual Earth coordinate frame.
    },
    clear() {
      selected = null;
      root.visible = false;
    },
    update(camera, ms) {
      root.visible = !!selected && camera.position.distanceTo(root.position) < 2500;
      if (!root.visible || selected.latitudeDeg === null || selected.longitudeDeg === null) return;
      if (started === null) started = ms;
      const phase = ((ms - started) % 6000) / 6000;
      const altitude = 40 + ((selected.altitudeKm ?? 40) * 40) / 6371;
      const center = radial
        .clone()
        .multiplyScalar(altitude)
        .addScaledVector(tangent, (phase - 0.5) * 18);
      const positions = geometry.attributes.position;
      positions.setXYZ(0, center.x, center.y, center.z);
      center.addScaledVector(tangent, -5);
      positions.setXYZ(1, center.x, center.y, center.z);
      positions.needsUpdate = true;
      material.opacity = Math.sin(phase * Math.PI) * 0.95;
    },
    dispose() {
      scene.remove(root);
      for (const child of root.children) {
        child.geometry.dispose();
        child.material.dispose();
      }
      map.dispose();
    },
  };
}

export async function mountCelestialSystem({ scene, camera, locale, onNavigate, onHome, beforeOpen, stage = 1 }) {
  if (stage >= 2) {
    const datasets = await Promise.all([
      import('./data/catalog/asteroids-1000.json'),
      import('./data/catalog/fireballs-1000.json'),
    ]);
    asteroids = datasets[0].default;
    fireballs = datasets[1].default;
  }
  const galaxies = stage >= 3 ? createCatalogLayer(scene, { compact: innerWidth < 760 }) : null;
  const gas = createNebulae(scene),
    rocks = stage >= 2 ? createAsteroids(scene) : null,
    replay = stage >= 2 ? createMeteorReplay(scene) : null;
  const ui = mountCelestialUI({
    locale,
    groups: {
      nebulae,
      ...(stage >= 2 ? { asteroids, fireballs } : {}),
      ...(stage >= 3 ? { galaxies: catalogRecords } : {}),
    },
    beforeOpen,
    onFocus(type, record) {
      replay?.clear();
      let position, distance;
      if (type === 'galaxies') {
        galaxies.focus(record);
        position = record.scenePosition;
        distance = 190;
      } else if (type === 'nebulae') {
        position = record.scenePosition;
        distance = 150;
      } else if (type === 'asteroids') {
        position = asteroidPosition(record);
        distance = 35;
      } else {
        replay.focus(record);
        position = replay.position.toArray();
        distance = 135;
      }
      onNavigate(position, distance);
    },
    onOverview() {
      replay?.clear();
      onNavigate([0, 0, 0], overviewZoom(camera.aspect));
    },
    onHome() {
      replay?.clear();
      onHome();
    },
  });
  return {
    counts: {
      galaxies: stage >= 3 ? catalogRecords.length : 0,
      nebulae: nebulae.length,
      asteroids: stage >= 2 ? asteroids.length : 0,
      fireballs: stage >= 2 ? fireballs.length : 0,
    },
    update(ms) {
      gas.update(camera);
      rocks?.update(camera);
      replay?.update(camera, ms);
      return galaxies?.update(camera) ?? 0;
    },
    home() {
      replay?.clear();
      ui.home();
    },
    dispose() {
      galaxies?.dispose();
      gas.dispose();
      rocks?.dispose();
      replay?.dispose();
      ui.dispose();
    },
  };
}
