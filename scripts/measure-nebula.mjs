import { chromium, expect as baseExpect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(process.argv[2] || '.'),
  label = process.argv[3] || 'after',
  software = process.argv[4] === 'software';
const expect = baseExpect.configure({ timeout: 60000 });
const reservation = createServer();
await new Promise((r) => reservation.listen(0, '127.0.0.1', r));
const port = reservation.address().port;
await new Promise((r) => reservation.close(r));
const server = spawn(
  process.execPath,
  [path.resolve('node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { cwd: root, windowsHide: true, stdio: 'ignore' },
);
let browser;
try {
  await expect
    .poll(async () => {
      try {
        return (await fetch(`http://127.0.0.1:${port}`)).ok;
      } catch {
        return false;
      }
    })
    .toBe(true);
  browser = await chromium.launch({
    channel: 'chrome',
    args: software ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=d3d11'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(`http://127.0.0.1:${port}/tests/fixtures/nebula-benchmark.html`);
  await expect(page.locator('canvas')).toHaveAttribute('data-done', 'true', { timeout: 180000 });
  const metrics = JSON.parse(await page.locator('#result').textContent());
  const folder = process.env.WORDVERSE_BENCH_OUTPUT || '.tools/nebula-benchmark';
  await mkdir(folder, { recursive: true });
  const result = {
    label,
    software,
    date: new Date().toISOString(),
    browser: await browser.version(),
    viewport: { width: 1920, height: 1080 },
    ...metrics,
    errors,
  };
  await writeFile(
    `${folder}/${label}-${software ? 'software' : 'native'}.json`,
    JSON.stringify(result, null, 2) + '\n',
  );
  await page.screenshot({ path: `${folder}/${label}-${software ? 'software' : 'native'}.png` });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser?.close();
  server.kill();
}
