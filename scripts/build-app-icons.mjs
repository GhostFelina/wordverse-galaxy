// Render installable-app icons from the constellation mark. Output is committed;
// rerun after the brand mark changes: node scripts/build-app-icons.mjs
import { mkdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const mark = await readFile(new URL('public/assets/wordverse-mark.svg', root), 'utf8');
const inner = mark
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<title>[\s\S]*?<\/title>/, '');
const BACKGROUND = '#02040a';

// `padding` is the share of the canvas kept clear around the mark; maskable icons
// need the mark inside the central 80% safe zone.
function iconSvg(size, padding) {
  const box = size * (1 - padding * 2);
  const offset = size * padding;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BACKGROUND}"/>
  <radialGradient id="g" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#1b1712"/><stop offset="1" stop-color="${BACKGROUND}"/></radialGradient>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <svg x="${offset}" y="${offset}" width="${box}" height="${box}" viewBox="0 0 40 40" fill="none">${inner}</svg>
</svg>`;
}

const outputs = [
  ['icon-192.png', 192, 0.14],
  ['icon-512.png', 512, 0.14],
  ['icon-maskable-512.png', 512, 0.22],
  ['apple-touch-icon.png', 180, 0.14],
];
await mkdir(new URL('public/icons/', root), { recursive: true });
for (const [name, size, padding] of outputs) {
  await sharp(Buffer.from(iconSvg(size, padding)))
    .png({ compressionLevel: 9 })
    .toFile(new URL(`public/icons/${name}`, root).pathname);
  console.log(`public/icons/${name}`);
}
