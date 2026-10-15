import * as THREE from 'three';
import { sampleGalaxy } from './catalog-shape.js';

// Artistic galactic atmosphere, not individual catalog stars or observed gas.
export function createFlightField(scene, compact = false) {
  let seed = 70531;
  const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  const root = new THREE.Group();
  root.position.set(31, 0, 0);
  scene.add(root);
  const count = compact ? 1800 : 4200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const palette = [
    [0.63, 0.81, 1],
    [1, 0.66, 0.39],
    [1, 0.86, 0.91],
  ];
  for (let i = 0; i < count; i++) {
    positions.set([(rand() - 0.5) * 240, (rand() - 0.5) * 170, (rand() - 0.5) * 200], i * 3);
    colors.set(palette[i % 3], i * 3);
    sizes[i] = rand() < 0.025 ? 3.5 : 0.3 + rand() * 0.9;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('starSize', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { intensity: { value: 0 } },
    vertexShader: `attribute float starSize; varying vec3 tint;
      void main() { tint = color; vec4 p = modelViewMatrix * vec4(position,1.0);
        gl_PointSize = clamp(starSize * 480.0 / max(4.0,-p.z),1.0,48.0);
        gl_Position = projectionMatrix * p; }`,
    fragmentShader: `uniform float intensity; varying vec3 tint;
      void main() { vec2 q = gl_PointCoord - 0.5; float r = length(q); if (r > 0.5) discard;
        float glow = exp(-r*r*24.0);
        float rays = exp(-abs(q.x)*100.0-abs(q.y)*8.0) + exp(-abs(q.y)*100.0-abs(q.x)*8.0);
        gl_FragColor = vec4(tint, (glow + rays * 0.18) * intensity * 0.7); }`,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  root.add(new THREE.Points(geometry, material));
  const pixels = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const nx = (x - 64) / 64,
        ny = (y - 64) / 64;
      const turbulence = 0.52 + Math.sin(nx * 9 + Math.sin(ny * 8)) * 0.18 + Math.cos(ny * 19 + nx * 13) * 0.1;
      const alpha = Math.max(0, 1 - nx * nx - ny * ny) ** 2 * turbulence;
      pixels.set([255, 255, 255, Math.round(alpha * 150)], (y * 128 + x) * 4);
    }
  const map = new THREE.DataTexture(pixels, 128, 128);
  map.minFilter = THREE.LinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  const clouds = [];
  for (let i = 0; i < (compact ? 9 : 16); i++) {
    const cloud = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map,
        color: [0x427fc9, 0xba477e, 0xcf8153][i % 3],
        opacity: 0,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    cloud.position.set((rand() - 0.5) * 180, (rand() - 0.5) * 100, -75 + rand() * 130);
    cloud.scale.set(48 + rand() * 50, 35 + rand() * 40, 1);
    cloud.material.rotation = rand() * Math.PI;
    root.add(cloud);
    clouds.push(cloud);
  }
  let gas = true;
  function populate(record) {
    seed = record.seed >>> 0;
    const shape = sampleGalaxy(
      { ...record, rotation: record.rotation || 0, inclination: record.inclination || 0.7 },
      count,
    );
    for (let i = 0; i < count; i++) {
      positions.set([shape.positions[i * 3] * 1.4, shape.positions[i * 3 + 1] * 1.4, (rand() - 0.5) * 190], i * 3);
      colors.set(shape.colors.subarray(i * 3, i * 3 + 3), i * 3);
      sizes[i] = rand() < 0.025 ? 3.5 : 0.3 + rand() * 0.9;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.starSize.needsUpdate = true;
    clouds.forEach((cloud, index) => {
      cloud.position.set((rand() - 0.5) * 160, (rand() - 0.5) * 100, -75 + rand() * 130);
      cloud.material.rotation = rand() * Math.PI;
      cloud.material.color.set([0x427fc9, 0xba477e, 0xcf8153][(index + (record.seed % 3)) % 3]);
      cloud.scale.set(42 + rand() * 70, 32 + rand() * 50, 1);
    });
    gas = !['elliptical', 'lenticular'].includes(record.morphology);
  }
  return {
    focus(record) {
      populate(record);
      root.position.fromArray(record.scenePosition);
      gas = !['elliptical', 'lenticular'].includes(record.morphology);
    },
    home(localSeed = 70531, morphology = 'spiral') {
      populate({ seed: localSeed, morphology });
      root.position.set(31, 0, 0);
      gas = true;
    },
    update(camera) {
      const distance = camera.position.z - root.position.z;
      const opacity = 1 - THREE.MathUtils.smoothstep(distance, 65, 220);
      root.visible = opacity > 0.001 && distance > -100;
      material.uniforms.intensity.value = opacity;
      for (const cloud of clouds) cloud.material.opacity = gas ? opacity * 0.62 : 0;
    },
  };
}
