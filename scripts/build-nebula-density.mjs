// Deterministic artistic volume, baked offline. No telescope tomography claim.
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { gzipSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const noise = new ImprovedNoise();
const clamp = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const n = (x, y, z, f = 1) => noise.noise(x * f + 19.4, y * f + 7.1, z * f + 31.8);
const size = 128,
  data = new Uint8Array(size ** 3 * 4);
const lobes = [
  [-0.34, -0.24, 2.15, 0.52, 0.38, 0.65, 1],
  [0.38, -0.04, 1.35, 0.42, 0.5, 0.63, 1],
  [0.02, 0.26, 0.5, 0.58, 0.42, 0.64, 0.9],
  [-0.38, -0.05, -0.4, 0.45, 0.58, 0.75, 1.1],
  [0.3, -0.3, -1.15, 0.4, 0.46, 0.7, 1.1],
  [-0.25, 0.24, -2, 0.55, 0.45, 0.62, 1],
  [0.4, 0.3, -2.65, 0.44, 0.36, 0.45, 0.7],
  [-0.48, -0.25, -2.9, 0.33, 0.4, 0.4, 0.65],
  [-0.3, 0.35, 2.9, 0.5, 0.3, 0.4, 0.7],
  [0.48, -0.25, 0.05, 0.3, 0.42, 0.6, 0.7],
];
for (let z = 0; z < size; z++)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const px = (2 * x) / (size - 1) - 1,
        py = (2 * y) / (size - 1) - 1,
        pz = ((2 * z) / (size - 1) - 1) * 3.6;
      const a = n(px, py, pz, 1.6),
        b = n(px + 11, py - 7, pz, 1.6),
        c = n(px, py + 13, pz - 5, 1.6);
      const wx = px + a * 0.23,
        wy = py + b * 0.23,
        wz = pz + c * 0.28;
      let envelope = 0;
      for (const [cx, cy, cz, sx, sy, sz, w] of lobes)
        envelope += w * Math.exp(-2 * (((wx - cx) / sx) ** 2 + ((wy - cy) / sy) ** 2 + ((wz - cz) / sz) ** 2));
      const broad = n(wx, wy, wz, 3.1),
        fine = n(wx + b * 0.08, wy + c * 0.08, wz + a * 0.08, 10.5);
      const filament = Math.pow(clamp(1 - Math.abs(fine) * 2.8), 3);
      const branches = smooth(-0.42, 0.3, broad);
      const edge = (1 - smooth(0.76, 1, Math.hypot(px, py))) * (1 - smooth(0.87, 1, Math.abs(pz) / 3.6));
      const cavity = 1 - 0.84 * Math.exp(-2 * ((px / 0.28) ** 2 + ((py - 0.03) / 0.3) ** 2 + ((pz - 0.2) / 0.5) ** 2));
      const density = envelope * branches * (0.12 + filament * 1.65) * edge * cavity;
      const dust = smooth(-0.08, 0.24, n(wx + 7, wy - 3, wz, 6.3)) * (0.4 + 0.6 * (1 - filament));
      const i = (x + size * (y + size * z)) * 4;
      data[i] = Math.round(Math.sqrt(clamp(density / 2.5)) * 255);
      data[i + 2] = Math.round(dust * 255);
      data[i + 3] = Math.round(smooth(-0.7, 0.8, px * 0.6 + py * 0.3 + pz * 0.13 + b * 0.8) * 255);
    }
// Single-scattering light visibility is baked once, not marched per pixel.
for (let z = 0; z < size; z++)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let depth = 0;
      for (let j = 1; j <= 10; j++) {
        const sx = x + j,
          sy = y + j * 2,
          sz = z + j;
        if (sx >= size || sy >= size || sz >= size) break;
        const q = data[(sx + size * (sy + size * sz)) * 4] / 255;
        depth += q * q * 2.5;
      }
      data[(x + size * (y + size * z)) * 4 + 1] = Math.round(Math.exp(-depth * 0.23) * 255);
    }
const detailSize = 64,
  detail = new Uint8Array(detailSize ** 3);
const s = Array.from({ length: detailSize }, (_, i) => Math.sin((i / detailSize) * Math.PI * 2));
const c = Array.from({ length: detailSize }, (_, i) => Math.cos((i / detailSize) * Math.PI * 2));
for (let z = 0; z < detailSize; z++)
  for (let y = 0; y < detailSize; y++)
    for (let x = 0; x < detailSize; x++) {
      const px = s[x] + c[y],
        py = s[y] + c[z],
        pz = s[z] + c[x];
      detail[x + detailSize * (y + detailSize * z)] = Math.round(
        clamp(0.5 + n(px, py, pz, 2.1) * 0.6 + n(px, py, pz, 5.2) * 0.24) * 255,
      );
    }
const root = new URL('../public/assets/nebulae/', import.meta.url);
await mkdir(root, { recursive: true });
const assets = [];
for (const [name, bytes, width, channels] of [
  ['orion-density-v1', data, size, 4],
  ['orion-detail-v1', detail, detailSize, 1],
]) {
  const compressed = gzipSync(bytes, { level: 9 });
  await writeFile(new URL(name + '.wvz', root), compressed);
  assets.push({
    texture: '/assets/nebulae/' + name + '.wvz',
    dimensions: [width, width, width],
    channels,
    encoding: 'gzip uint8',
    bytes: bytes.length,
    compressedBytes: compressed.length,
    sha256: createHash('sha256').update(compressed).digest('hex'),
  });
}
await writeFile(
  new URL('../src/data/nebula-density.json', import.meta.url),
  JSON.stringify(
    {
      version: 1,
      kind: 'Artistic deterministic finite density, self-shadow, dust and color fields. Not observed tomography.',
      generator: 'scripts/build-nebula-density.mjs',
      assets,
    },
    null,
    2,
  ) + '\n',
);
console.log(assets.map((a) => ({ texture: a.texture, bytes: a.compressedBytes })));
