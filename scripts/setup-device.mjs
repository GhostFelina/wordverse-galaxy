import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, realpathSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const start = '<!-- wordverse-routing:start -->';
const end = '<!-- wordverse-routing:end -->';

export function routeInstructions(previous, projectRoot) {
  const block = `${start}
## Wordverse projesine devam
- Kullanıcı "wordverse kaldığın yerden devam et" dediğinde proje: ${JSON.stringify(projectRoot)}.
- Önce gerçek işletim sistemini ve kabuğu kontrol et, bu dizine geç ve AGENTS.md'yi oku.
- Kayıtlı yol bu cihazda yoksa Windows yolunu macOS'ta kullanma. Gerçek Masaüstü/Projeler altında mevcut klonu bul; repo https://github.com/GhostFelina/wordverse-galaxy. İlk kurulum için aktif dalın docs/handoff/CROSS_DEVICE.md dosyasını oku.
- Git durumunu kontrol et; temizse git pull --ff-only yap. Yerel değişiklikleri silme, force/reset kullanma.
- docs/handoff/HANDOFF.md tek güncel görev kaynağıdır. MASTER_PROMPT.md, KNOWN_ISSUES.md, TASKS.md ve CROSS_DEVICE.md'yi oku. Bitmiş fazları yeniden başlatma.
- Kullanıcıyla Türkçe konuş, yerel uygulamayı 127.0.0.1:5360 üzerinde görünür tarayıcıda aç ve sıradaki görevleri sürdür.
- Kullanıcı cihazlar arası kurulum ve bu proje yönlendirmesini 2026-10-03'te istedi. Bağımlılıkları bu cihazda yeniden kur; sırları ve tarayıcı verisini Git'e koyma.
${end}`;
  const from = previous.indexOf(start);
  const to = previous.indexOf(end);
  if (from >= 0 !== to >= 0 || (from >= 0 && to < from)) {
    throw new Error('Wordverse yönlendirme işaretleri bozuk; mevcut talimatlar değiştirilmedi.');
  }
  if (from >= 0) return previous.slice(0, from) + block + previous.slice(to + end.length);
  return previous + (previous.endsWith('\n') ? '\n' : '\n\n') + block + '\n';
}

export function publicEnvironment(master, previous) {
  const url = master.match(/Proje URL'si: `([^`]+)`/)?.[1];
  const key = master.match(/Publishable key: `(sb_publishable_[^`]+)`/)?.[1];
  if (!url || !key) throw new Error('Ana görevde public Supabase yapılandırması bulunamadı.');
  const config = {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_PUBLISHABLE_KEY: key,
    VITE_GOOGLE_AUTH_ENABLED: 'true',
  };
  const missing = Object.entries(config).filter(
    ([name]) => !new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=`, 'm').test(previous),
  );
  if (!missing.length) return previous;
  return (
    previous +
    (previous.endsWith('\n') ? '\n' : '\n\n') +
    '# Wordverse public client configuration\n' +
    missing.map(([name, value]) => `${name}=${value}`).join('\n') +
    '\n'
  );
}

function run(args, projectRoot) {
  const executable = platform() === 'win32' ? 'npm.cmd' : 'npm';
  // All arguments here are fixed strings; no secrets or user input enter a shell.
  const result = spawnSync(executable, args, { cwd: projectRoot, stdio: 'inherit', shell: platform() === 'win32' });
  if (result.error || result.status !== 0) throw new Error(`npm ${args.join(' ')} başarısız.`);
}

export function setupDevice(args = process.argv.slice(2)) {
  const allowed = ['--register-only', '--skip-browser', '--dry-run'];
  if (args.some((arg) => !allowed.includes(arg))) throw new Error(`Seçenekler: ${allowed.join(', ')}`);
  const projectRoot = realpathSync(fileURLToPath(new URL('..', import.meta.url)));
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (!(major >= 24 || (major === 22 && minor >= 13))) throw new Error('Node 24 önerilir; en az Node 22.13 gerekir.');
  const codexDir = resolve(process.env.CODEX_HOME || join(homedir(), '.codex'));
  const override = join(codexDir, 'AGENTS.override.md');
  const instructions =
    existsSync(override) && readFileSync(override, 'utf8').trim() ? override : join(codexDir, 'AGENTS.md');
  const previous = existsSync(instructions) ? readFileSync(instructions, 'utf8') : '';
  const next = routeInstructions(previous, projectRoot);
  console.log(
    `Sistem: ${platform()} ${process.arch}; Node ${process.versions.node}; kabuk: ${process.env.SHELL || process.env.ComSpec || 'terminal'}`,
  );
  console.log(`Proje: ${projectRoot}\nCodex yönlendirmesi: ${instructions}`);
  if (args.includes('--dry-run')) {
    console.log('Önizleme: dosya değiştirilmedi, paket kurulmadı.');
    return;
  }
  if (!args.includes('--register-only')) {
    const envFile = join(projectRoot, '.env.local');
    const previousEnv = existsSync(envFile) ? readFileSync(envFile, 'utf8') : '';
    const nextEnv = publicEnvironment(
      readFileSync(join(projectRoot, 'docs/handoff/MASTER_PROMPT.md'), 'utf8'),
      previousEnv,
    );
    if (nextEnv !== previousEnv) writeFileSync(envFile, nextEnv, { encoding: 'utf8', mode: 0o600 });
    run(['ci'], projectRoot);
    if (!args.includes('--skip-browser')) run(['exec', '--', 'playwright', 'install', 'chromium'], projectRoot);
  }
  if (next !== previous) {
    mkdirSync(codexDir, { recursive: true });
    if (existsSync(instructions) && !existsSync(`${instructions}.wordverse-backup`))
      copyFileSync(instructions, `${instructions}.wordverse-backup`);
    writeFileSync(instructions, next, 'utf8');
  }
  console.log('Yönlendirme kaydedildi. Yeni Codex oturumunda: wordverse kaldığın yerden devam et');
  console.log('Yerel görünüm: npm run dev -- --port 5360 (tarayıcı: http://127.0.0.1:5360/)');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    setupDevice();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
