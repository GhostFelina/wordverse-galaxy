// Deterministic original gas fields. No external images or measured tomography.
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { gzipSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import orion from '../src/data/nebula-density.json' with { type: 'json' };
const noise = new ImprovedNoise();
const clamp = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const size = 128;
for (const [id, seed] of [
  ['ember-reach', 57],
  ['tidal-shell', 103],
]) {
  const data = new Uint8Array(size ** 3 * 4);
  const n = (x, y, z, f) => noise.noise(x * f + seed, y * f + 12.3, z * f + 8.7);
  for (let z = 0; z < size; z++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const px = (2 * x) / (size - 1) - 1,
          py = (2 * y) / (size - 1) - 1,
          pz = ((2 * z) / (size - 1) - 1) * 3.6;
        const a = n(px, py, pz, 1.7),
          b = n(px + 9, py - 4, pz + 3, 2.4);
        const wx = px + 0.13 * a,
          wy = py + 0.12 * b,
          wz = pz + 0.14 * a;
        const broad = n(wx, wy, wz, 3.5),
          fine = n(wx, wy, wz, 14),
          micro = n(wx, wy, wz, 31);
        const fibers = Math.pow(clamp(1 - Math.abs(fine + micro * 0.22) * 2.4), 2);
        const edge = (1 - smooth(0.72, 1, Math.hypot(px * 0.9, py))) * (1 - smooth(0.8, 1, Math.abs(pz) / 3.6));
        let d, dust, warm;
        if (id === 'ember-reach') {
          // Three unequal twisted columns with illuminated, eroded heads.
          let columns = 0;
          for (let k = 0; k < 3; k++) {
            const cx = (k - 1) * 0.43 + 0.12 * Math.sin(wz * 1.3 + k * 2) + wy * 0.16;
            const r = 0.07 + 0.07 * smooth(-0.6, 0.55, wy) + k * 0.012;
            columns += Math.exp(-Math.pow((wx - cx) / r, 2)) * (1 - smooth(0.28 - k * 0.12, 0.52 - k * 0.1, wy));
          }
          d = (columns * (0.22 + fibers * 1.25) + smooth(-0.25, 0.5, broad) * 0.08) * edge;
          dust = smooth(0.12, 0.7, columns) * 0.83;
          warm = smooth(-0.7, 0.65, wy + a * 0.8);
        } else {
          // Corrugated ellipsoidal wind shell with a genuinely empty cavity.
          const r = Math.hypot(wx * 1.2, wy, wz * 0.23);
          const shell = Math.exp(-Math.pow((r - 0.64 - broad * 0.09) / 0.058, 2));
          const knots = smooth(-0.15, 0.4, n(wx, wy, wz, 7));
          d = (shell * (0.22 + fibers * 1.8) * (0.35 + knots) + smooth(0.72, 0.88, r) * 0.025) * edge;
          dust = smooth(0.15, 0.55, broad) * 0.45;
          warm = smooth(-0.5, 0.6, wy * 0.5 + b);
        }
        const i = (x + size * (y + size * z)) * 4;
        data[i] = Math.round(Math.sqrt(clamp(d / 2.5)) * 255);
        data[i + 2] = Math.round(dust * 255);
        data[i + 3] = Math.round(warm * 255);
      }
  for (let z = 0; z < size; z++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        let depth = 0;
        for (let j = 1; j <= 8 && x + j < size && y + j < size && z + j < size; j++) {
          const v = data[(x + j + size * (y + j + size * (z + j))) * 4] / 255;
          depth += v * v * 2.5;
        }
        data[(x + size * (y + size * z)) * 4 + 1] = Math.round(Math.exp(-depth * 0.35) * 255);
      }
  const compressed = gzipSync(data, { level: 9 });
  const asset = {
    texture: `/assets/nebulae/${id}-v1.wvz`,
    dimensions: [size, size, size],
    channels: 4,
    encoding: 'gzip uint8',
    bytes: data.byteLength,
    compressedBytes: compressed.length,
    sha256: createHash('sha256').update(compressed).digest('hex'),
  };
  await writeFile(new URL(`../public${asset.texture}`, import.meta.url), compressed);
  await writeFile(
    new URL(`../src/data/${id}.json`, import.meta.url),
    JSON.stringify(
      {
        version: 1,
        kind: 'Original artistic gas volume; no observed object or tomography claim.',
        generator: 'scripts/build-nebula-experiences.mjs',
        assets: [asset, orion.assets[1]],
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`${id}: ${compressed.length} compressed bytes`);
}
