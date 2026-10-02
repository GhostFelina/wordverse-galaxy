import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const count = Number(process.argv[2] || 200);
if (!Number.isInteger(count) || count < 1 || count > 2000) throw new Error('Word count must be between 1 and 2000');

const now = new Date().toISOString();
const galaxies = [
  { id: 'benchmark-natural', name: 'Doğal Küme Testi', language: 'İngilizce', createdAt: now },
  { id: 'benchmark-spanish', name: 'Benchmark İspanyolca', language: 'İspanyolca', createdAt: now },
];
const random = seed => { let n = seed >>> 0; return () => { n = (1664525 * n + 1013904223) >>> 0; return n / 4294967296; }; };
const words = Array.from({ length: count }, (_, index) => {
  const cluster = Math.floor(index / 7);
  const slot = index % 7;
  const angle = cluster * 2.399 + .7;
  const radius = 22 + Math.sqrt(cluster) * 20;
  const pattern = [[0, 0], [-4.2, 3.4], [4.6, 2.6], [-7.1, -2.3], [7.8, -2], [-2.4, -6.7], [5.1, -7.4]][slot];
  const rotation = cluster * 2.399;
  const px = pattern[0] * Math.cos(rotation) - pattern[1] * Math.sin(rotation);
  const py = pattern[0] * Math.sin(rotation) + pattern[1] * Math.cos(rotation);
  const seed = random((cluster + 1) * 42197 + slot * 7919);
  const x = Math.cos(angle) * radius + px + (seed() - .5) * 2.4;
  const y = Math.sin(angle) * radius * .57 + py + (seed() - .5) * 2.4;
  return { id: `benchmark-natural-word-${index}`, galaxyId: galaxies[0].id, word: `star${String(index + 1).padStart(4, '0')}`, meaning: 'test yıldızı', example: '', createdAt: new Date(Date.now() - index * 86400000).toISOString(), x: 31 + x * Math.cos(-.17) - y * Math.sin(-.17), y: x * Math.sin(-.17) + y * Math.cos(-.17), z: 17 + slot * .62 };
});
const backup = { version: 3, galaxies, activeGalaxyId: galaxies[0].id, words, events: [], exportedAt: now };
const path = join(tmpdir(), `wordverse-benchmark-${count}.json`);
writeFileSync(path, JSON.stringify(backup), 'utf8');
console.log(path);
