// Original, deterministic ionized sheets. Artistic volume, not telescope data.
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { gzipSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import orion from '../src/data/nebula-density.json' with { type: 'json' };

const noise = new ImprovedNoise();
const n = (x, y, z, f) => noise.noise(x * f + 41.8, y * f + 12.3, z * f + 8.7);
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const size = 128;
const data = new Uint8Array(size ** 3 * 4);
for (let z = 0; z < size; z++)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const px = (2 * x) / (size - 1) - 1,
        py = (2 * y) / (size - 1) - 1,
        pz = ((2 * z) / (size - 1) - 1) * 3.6;
      const a = n(px, py, pz, 1.4),
        b = n(px + 9, py - 4, pz + 3, 2.2);
      const wx = px + 0.18 * a,
        wy = py + 0.14 * b,
        wz = pz + 0.19 * a;
      const broad = n(wx, wy, wz, 3.8),
        fine = n(wx, wy, wz, 15),
        micro = n(wx, wy, wz, 32);
      const fold = wx * 0.68 + wy * 0.76 + 0.19 * Math.sin(wz * 1.7 + wx * 2) + 0.13 * broad;
      // Unequal, turbulent sheets, divided by dark space; no photo or spherical lobes.
      const sheet = Math.exp(-(((fold - 0.24) / 0.065) ** 2)) + 0.7 * Math.exp(-(((fold + 0.32) / 0.095) ** 2));
      const fibers = Math.pow(clamp(1 - Math.abs(fine + micro * 0.25) * 2.6), 2);
      const edge = (1 - smooth(0.66, 1, Math.hypot(px * 0.91, py))) * (1 - smooth(0.82, 1, Math.abs(pz) / 3.6));
      const veil = smooth(-0.32, 0.35, broad) * 0.055;
      const density = (sheet * (0.18 + fibers * 1.9) + veil) * edge * (0.7 + 0.3 * smooth(-0.4, 0.4, a));
      const i = (x + size * (y + size * z)) * 4;
      data[i] = Math.round(Math.sqrt(clamp(density / 2.5)) * 255);
      data[i + 2] = Math.round(smooth(-0.1, 0.4, broad) * 0.55 * 255);
      data[i + 3] = Math.round(smooth(-0.55, 0.65, px * 0.5 - py * 0.3 + a * 0.8) * 255);
    }
for (let z = 0; z < size; z++)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let depth = 0;
      for (let j = 1; j <= 8; j++) {
        if (x + j >= size || y + j >= size || z + j >= size) break;
        const v = data[(x + j + size * (y + j + size * (z + j))) * 4] / 255;
        depth += v * v * 2.5;
      }
      data[(x + size * (y + size * z)) * 4 + 1] = Math.round(Math.exp(-depth * 0.3) * 255);
    }
const compressed = gzipSync(data, { level: 9 });
await writeFile(new URL('../public/assets/nebulae/ion-veil-v1.wvz', import.meta.url), compressed);
const manifest = {
  version: 1,
  kind: 'Original artistic ionized sheets; no observed object or tomography claim.',
  generator: 'scripts/build-ion-veil.mjs',
  assets: [
    {
      texture: '/assets/nebulae/ion-veil-v1.wvz',
      dimensions: [size, size, size],
      channels: 4,
      encoding: 'gzip uint8',
      bytes: data.byteLength,
      compressedBytes: compressed.length,
      sha256: createHash('sha256').update(compressed).digest('hex'),
    },
    orion.assets[1],
  ],
};
await writeFile(new URL('../src/data/ion-veil.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Ion Veil: ${compressed.length} compressed bytes`);
