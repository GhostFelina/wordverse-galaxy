import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';
import { command, doctor, handoffState, projectRoot } from './doctor.mjs';
import { preparePublicEnvironment, setupDevice } from './setup-device.mjs';

const agent = process.argv[2];
if (!['codex', 'claude'].includes(agent)) {
  console.error('npm run resume:codex veya npm run resume:claude kullan.');
  process.exitCode = 1;
} else {
  const clean = command('git', ['status', '--porcelain']);
  let ready = clean.status === 0;
  if (ready && !clean.stdout.trim()) {
    ready = command('git', ['pull', '--ff-only'], { stdio: 'inherit' }).status === 0;
    const state = handoffState();
    const branch = command('git', ['branch', '--show-current']).stdout?.trim();
    if (ready && branch !== state.activeBranch) {
      ready = command('git', ['switch', state.activeBranch], { stdio: 'inherit' }).status === 0;
      if (ready) ready = command('git', ['pull', '--ff-only'], { stdio: 'inherit' }).status === 0;
    }
  } else if (ready)
    console.log('Yerel değişiklikler korunuyor; otomatik pull yapılmadı. Ajan önce git durumunu inceleyecek.');
  if (ready) {
    preparePublicEnvironment(projectRoot);
    setupDevice(['--register-only']);
    ready = doctor({ agent, pushCheck: true });
  }
  if (!ready) {
    console.error(
      'Ön kontrol gerekli kurulum/giriş adımlarını yukarıda gösterdi. Tamamladıktan sonra aynı komutu çalıştır.',
    );
    process.exitCode = 1;
  } else {
    const prompt = 'wordverse projemize kaldığımız yerden devam et';
    const result =
      platform() === 'win32' && agent === 'codex'
        ? spawnSync(
            process.env.ComSpec || 'cmd.exe',
            ['/d', '/s', '/c', 'codex "wordverse projemize kaldığımız yerden devam et"'],
            { cwd: projectRoot, stdio: 'inherit' },
          )
        : spawnSync(agent, [prompt], { cwd: projectRoot, stdio: 'inherit' });
    process.exitCode = result.status ?? 1;
  }
}
