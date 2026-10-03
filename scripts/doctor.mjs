import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const projectRoot = realpathSync(fileURLToPath(new URL('..', import.meta.url)));

export function command(name, args, options = {}) {
  const settings = {
    cwd: projectRoot,
    encoding: 'utf8',
    timeout: 20000,
    ...options,
  };
  if (platform() === 'win32' && name === 'codex') {
    if (!['--version', 'login status'].includes(args.join(' ')))
      throw new Error('Desteklenmeyen Codex kontrol komutu.');
    return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `codex ${args.join(' ')}`], settings);
  }
  return spawnSync(name, args, settings);
}

export function handoffState() {
  const state = JSON.parse(readFileSync(join(projectRoot, 'docs/handoff/STATE.json'), 'utf8'));
  if (state.repository !== 'GhostFelina/wordverse-galaxy' || !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(state.activeBranch))
    throw new Error('Devir repo/dal bilgisi geçersiz.');
  return state;
}

export function doctor({ agent = null, pushCheck = false } = {}) {
  if (agent && !['codex', 'claude'].includes(agent)) throw new Error('Ajan codex veya claude olmalı.');
  const state = handoffState();
  const results = [];
  const add = (name, ok, detail, required = true) => results.push({ name, ok: Boolean(ok), detail, required });
  const git = command('git', ['--version']);
  add('Git', git.status === 0, 'Eksikse resmî Git paketini kur.');
  const origin = command('git', ['remote', 'get-url', 'origin']);
  add(
    'Doğru repo',
    /(?:github\.com[/:])GhostFelina\/wordverse-galaxy(?:\.git)?\s*$/.test(origin.stdout || ''),
    'Origin GhostFelina/wordverse-galaxy olmalı.',
  );
  const branch = command('git', ['branch', '--show-current']).stdout?.trim();
  add('Aktif dal', branch === state.activeBranch, `Beklenen dal: ${state.activeBranch}`);
  add(
    'Devir belgeleri',
    ['HANDOFF.md', 'MASTER_PROMPT.md', 'TASKS.md', 'KNOWN_ISSUES.md', 'CROSS_DEVICE.md'].every((file) =>
      existsSync(join(projectRoot, 'docs/handoff', file)),
    ),
    'Ortak görev belgeleri repoda bulunmalı.',
  );
  const env = existsSync(join(projectRoot, '.env.local')) ? readFileSync(join(projectRoot, '.env.local'), 'utf8') : '';
  add(
    'Public env',
    ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_GOOGLE_AUTH_ENABLED'].every((name) =>
      new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=\\s*\\S+`, 'm').test(env),
    ),
    'Eksik isimler için npm run setup:device; değerler yazdırılmaz.',
  );
  add(
    'Yerel bağımlılıklar',
    existsSync(join(projectRoot, 'node_modules/vite/package.json')),
    'npm ci ile bu cihazda yeniden kur.',
  );
  const gh = command('gh', ['api', `repos/${state.repository}`]);
  let permissions;
  try {
    permissions = JSON.parse(gh.stdout).permissions;
  } catch {
    /* Never print raw authentication output. */
  }
  add(
    'GitHub okuma/yazma',
    gh.status === 0 && permissions?.pull && permissions?.push,
    'Gerekirse gh auth login --hostname github.com --web --git-protocol https; hesap GhostFelina; sonra gh auth setup-git.',
  );
  for (const tool of ['codex', 'claude']) {
    const required = !agent || agent === tool;
    add(
      `${tool} CLI`,
      command(tool, ['--version']).status === 0,
      `Eksikse ${tool === 'codex' ? 'npm install -g @openai/codex' : 'npm install -g @anthropic-ai/claude-code'}; mevcut kurulumu gereksiz güncelleme.`,
      required,
    );
    const auth = tool === 'codex' ? ['login', 'status'] : ['auth', 'status'];
    add(
      `${tool} giriş`,
      command(tool, auth).status === 0,
      `İlk giriş için ${tool === 'codex' ? 'codex login' : 'claude auth login'}; kullanıcı tarayıcıda tamamlar.`,
      required,
    );
    const instructions =
      tool === 'codex'
        ? (() => {
            const dir = resolve(process.env.CODEX_HOME || join(homedir(), '.codex'));
            const override = join(dir, 'AGENTS.override.md');
            return existsSync(override) && readFileSync(override, 'utf8').trim() ? override : join(dir, 'AGENTS.md');
          })()
        : join(resolve(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')), 'CLAUDE.md');
    add(
      `${tool} proje yönlendirmesi`,
      existsSync(instructions) && readFileSync(instructions, 'utf8').includes(JSON.stringify(projectRoot)),
      'npm run setup:device -- --register-only',
      required,
    );
  }
  if (pushCheck && branch === state.activeBranch) {
    add(
      'Git push yetkisi (dry run)',
      command('git', ['push', '--dry-run', 'origin', `HEAD:${state.activeBranch}`]).status === 0,
      'Veri göndermeyen yazma kontrolü; gerekirse gh auth setup-git ile Git bağlantısını kur.',
    );
  }
  for (const result of results)
    console.log(
      `${result.ok ? 'OK' : result.required ? 'EKSİK' : 'BİLGİ'} · ${result.name}${result.ok ? '' : ` · ${result.detail}`}`,
    );
  return results.every((result) => result.ok || !result.required);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = doctor({ pushCheck: process.argv.includes('--push-check') }) ? 0 : 1;
  } catch {
    console.error('Devir durumu okunamadı; doğru Wordverse dalını ve STATE.json dosyasını kontrol et.');
    process.exitCode = 1;
  }
}
