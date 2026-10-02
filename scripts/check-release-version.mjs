import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const parse = value => /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value)?.slice(1).map(Number);
const current = parse(version);
if (!current) throw new Error(`Geçersiz sürüm: ${version}`);

let tags = [];
try { tags = execFileSync('git', ['tag', '--list', 'v*'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split(/\r?\n/).filter(Boolean); } catch { /* Initial local setup. */ }
const latest = tags.map(tag => ({ tag, parts: parse(tag) })).filter(item => item.parts).sort((a, b) => {
  for (let i = 0; i < 3; i++) if (a.parts[i] !== b.parts[i]) return b.parts[i] - a.parts[i];
  return 0;
})[0];

if (latest && !process.env.GITHUB_REF?.startsWith('refs/tags/')) {
  let headTags = [];
  try { headTags = execFileSync('git', ['tag', '--points-at', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split(/\r?\n/); } catch { /* Uncommitted setup. */ }
  const ahead = current.findIndex((part, i) => part !== latest.parts[i]);
  if ((ahead < 0 && !headTags.includes(latest.tag)) || (ahead >= 0 && current[ahead] < latest.parts[ahead])) throw new Error(`Yeni güncelleme için ${latest.tag} sürümünden büyük bir package.json sürümü gerekli.`);
}
console.log(`Sürüm kontrolü: ${version}${latest ? ` (son etiket ${latest.tag})` : ' (ilk yayın)'}`);
