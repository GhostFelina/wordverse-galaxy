// Reproducible observed guides + original, explicitly artistic depth fields.
import sharp from 'sharp';
import { parseHTML } from 'linkedom';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import orion from '../src/data/nebula-density.json' with { type: 'json' };

const definitions = [
  ['carina', 'NGC 3372', 'heic0707a', 'cloud', [0.035, 0.14, 0.24], [0.72, 0.29, 0.09]],
  ['eagle', 'M16', 'heic1501a', 'pillars', [0.035, 0.22, 0.23], [0.65, 0.29, 0.08]],
  ['horsehead', 'B33', 'heic1307a', 'horse', [0.08, 0.14, 0.28], [0.47, 0.23, 0.16]],
  ['helix', 'NGC 7293', 'opo0432b', 'helix', [0.025, 0.24, 0.31], [0.78, 0.22, 0.065]],
  ['crab', 'M1', 'heic0515a', 'remnant', [0.03, 0.15, 0.29], [0.82, 0.28, 0.09]],
  ['ring', 'M57', 'heic1310a', 'ring', [0.025, 0.22, 0.32], [0.78, 0.24, 0.075]],
  ['rosette', 'NGC 2237', 'heic2505f', 'rosette', [0.07, 0.13, 0.28], [0.72, 0.19, 0.12]],
  ['tarantula', 'NGC 2070', 'heic1206a', 'web', [0.03, 0.18, 0.24], [0.67, 0.25, 0.08]],
  ['lagoon', 'M8', 'heic1808a', 'lagoon', [0.035, 0.17, 0.27], [0.83, 0.28, 0.1]],
  ['trifid', 'M20', 'opo0417c', 'trifid', [0.045, 0.12, 0.35], [0.65, 0.19, 0.15]],
];
const folder = new URL('../public/assets/nebulae/popular/', import.meta.url);
await mkdir(folder, { recursive: true });
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const clamp = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const noise = new ImprovedNoise(),
  size = 128,
  profiles = [];
for (const [index, [id, code, imageId, morphology, cool, warm]] of definitions.entries()) {
  const source = `https://esahubble.org/images/${imageId}/`;
  const { document } = parseHTML(await (await fetch(source)).text());
  const credit = document.querySelector('.credit')?.textContent.trim().replace(/\s+/g, ' ');
  if (!credit) throw new Error(`Missing official credit: ${id}`);
  const remote = [...document.querySelectorAll('a')].find((a) => a.textContent.trim() === 'Screensize JPEG')?.href;
  if (!remote) throw new Error(`Missing screen image: ${id}`);
  let input;
  const cached = new URL(`${id}-source.jpg`, folder);
  try {
    input = await readFile(cached);
  } catch {
    const response = await fetch(remote);
    if (!response.ok) throw new Error(`Download failed: ${id}`);
    input = Buffer.from(await response.arrayBuffer());
    await writeFile(cached, input);
  }
  // Square letterboxing retains the full observational field without distortion.
  const guide = await sharp(input)
    .resize(1536, 1536, { fit: 'contain', background: '#000000' })
    .jpeg({ quality: 90 })
    .toBuffer();
  const sourceMetadata = await sharp(input).metadata();
  const preview = await sharp(guide).resize(512, 512).webp({ quality: 82 }).toBuffer();
  await writeFile(new URL(`${id}-preview.webp`, folder), preview);
  await writeFile(new URL(`${id}-guide.jpg`, folder), guide);
  const photo = await sharp(guide).resize(size, size).removeAlpha().raw().toBuffer();
  const data = new Uint8Array(size ** 3 * 4),
    seed = 193 + index * 47;
  const n = (x, y, z, f) => noise.noise(x * f + seed, y * f + 12.3, z * f + 8.7);
  for (let z = 0; z < size; z++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const px = (2 * x) / (size - 1) - 1,
          py = (2 * y) / (size - 1) - 1,
          pz = ((2 * z) / (size - 1) - 1) * 3.6;
        const a = n(px, py, pz, 1.8),
          b = n(px + 9, py - 4, pz + 3, 2.3);
        const wx = px + a * 0.12,
          wy = py + b * 0.11,
          wz = pz + a * 0.13;
        const broad = n(wx, wy, wz, 3.5),
          fine = n(wx, wy, wz, 13);
        const fiber = Math.pow(clamp(1 - Math.abs(fine) * 2.5), 3);
        const r = Math.hypot(wx * 1.12, wy, wz * 0.24),
          angle = Math.atan2(wy, wx);
        const edge = (1 - smooth(0.78, 1, Math.hypot(px * 0.93, py))) * (1 - smooth(0.8, 1, Math.abs(pz) / 3.6));
        let shape = 0.1 + smooth(-0.25, 0.45, broad) * 0.65,
          dust = smooth(0.05, 0.5, broad) * 0.55;
        if (morphology === 'pillars') {
          shape = 0.03;
          for (let k = 0; k < 3; k++)
            shape +=
              Math.exp(
                -Math.pow((wx - (k - 1) * 0.34 - wy * 0.2 - Math.sin(wz * 1.4 + k) * 0.07) / (0.08 + k * 0.015), 2),
              ) *
              (1 - smooth(0.18 + k * 0.12, 0.4 + k * 0.12, wy));
          dust = smooth(0.15, 0.7, shape) * 0.85;
        } else if (morphology === 'horse') {
          const neck = Math.exp(-Math.pow((wx + 0.18 - wy * 0.18) / 0.15, 2)) * (1 - smooth(0.12, 0.4, wy));
          const head = Math.exp(-Math.pow((wx - 0.02) / 0.29, 2) - Math.pow((wy - 0.25) / 0.17, 2));
          shape = (neck + head) * 1.1 + 0.05;
          dust = clamp(neck + head) * 0.95;
        } else if (['ring', 'helix', 'rosette'].includes(morphology)) {
          const radius = morphology === 'ring' ? 0.47 : morphology === 'helix' ? 0.65 : 0.57;
          const thick = morphology === 'ring' ? 0.065 : morphology === 'helix' ? 0.1 : 0.17;
          shape = Math.exp(-Math.pow((r - radius - broad * 0.08) / thick, 2)) * (0.4 + fiber * 1.4);
          if (morphology === 'helix')
            shape += Math.exp(-Math.pow((Math.hypot(wx * 0.9, wy, wz * 0.32) - 0.78) / 0.055, 2)) * 0.23;
          dust *= 0.65;
        } else if (morphology === 'remnant') {
          shape = Math.exp(-Math.pow((r - 0.53) / 0.16, 2)) * (0.12 + fiber * 1.9) + Math.exp((-r * r) / 0.12) * 0.08;
          dust *= 0.35;
        } else if (morphology === 'web') {
          const spokes = Math.pow(0.5 + 0.5 * Math.sin(angle * 11 + r * 8 + broad * 4), 6);
          shape = (fiber * 0.8 + spokes * 0.7) * smooth(0.1, 0.3, r) * (1 - smooth(0.66, 0.9, r));
        } else if (morphology === 'lagoon') {
          const lane = Math.exp(-Math.pow((wx + wy * 0.36 - Math.sin(wz) * 0.12) / 0.075, 2));
          shape *= 1 - lane * 0.85;
          dust = clamp(dust + lane * 0.7);
        } else if (morphology === 'trifid') {
          const lanes = Math.exp(-Math.pow((Math.sin(angle * 1.5 + Math.sin(wz) * 0.12) * r) / 0.045, 2));
          shape *= 1 - lanes * 0.9;
          dust = clamp(dust + lanes * 0.75);
        }
        const p = (x + size * (size - 1 - y)) * 3;
        const lum = Math.max(photo[p], photo[p + 1], photo[p + 2]) / 255;
        const guideWeight = Math.exp(-Math.pow((pz - 2.55) / 0.3, 2));
        const d = (shape * (0.22 + fiber * 0.72) + guideWeight * lum * 0.35) * edge;
        const i = (x + size * (y + size * z)) * 4;
        // Quantization compresses large fields while fine repeat detail stays 8-bit.
        data[i] = Math.round(Math.sqrt(clamp(d / 2.5)) * 63) * 4;
        data[i + 2] = Math.round(clamp(dust) * 31) * 8;
        data[i + 3] = Math.round(smooth(-0.5, 0.65, wy * 0.4 + broad * 0.8) * 31) * 8;
      }
  for (let z = 0; z < size; z++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        let depth = 0;
        for (let j = 1; j <= 8 && x + j < size && y + j < size && z + j < size; j++) {
          const v = data[(x + j + size * (y + j + size * (z + j))) * 4] / 255;
          depth += v * v * 2.5;
        }
        data[(x + size * (y + size * z)) * 4 + 1] = Math.round(Math.exp(-depth * 0.35) * 31) * 8;
      }
  const compressed = gzipSync(data, { level: 9 });
  await writeFile(new URL(`${id}-v1.wvz`, folder), compressed);
  const manifest = {
    version: 1,
    kind: 'Observed photographic guide with original artistic depth; not measured 3D tomography.',
    generator: 'scripts/build-popular-nebulae.mjs',
    assets: [
      {
        texture: `/assets/nebulae/popular/${id}-v1.wvz`,
        dimensions: [size, size, size],
        channels: 4,
        encoding: 'gzip uint8',
        bytes: data.length,
        compressedBytes: compressed.length,
        sha256: hash(compressed),
      },
      orion.assets[1],
    ],
  };
  profiles.push({
    id,
    code,
    mode: 4 + index,
    morphology,
    cool,
    warm,
    glow: 1.4,
    manifest,
    guide: `/assets/nebulae/popular/${id}-guide.jpg`,
    preview: `/assets/nebulae/popular/${id}-preview.webp`,
    previewSha256: hash(preview),
    source,
    credit,
    license: 'CC BY 4.0',
    licenseUrl: 'https://esahubble.org/copyright/',
    originalImage: remote,
    sourceSha256: hash(input),
    guideSha256: hash(guide),
    sourceDimensions: [sourceMetadata.width, sourceMetadata.height],
    guideDimensions: [1536, 1536],
  });
  console.log(`${id}: ${compressed.length} bytes · ${credit}`);
}
await writeFile(new URL('../src/data/popular-nebulae.json', import.meta.url), JSON.stringify(profiles, null, 2) + '\n');
