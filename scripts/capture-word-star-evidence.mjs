import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';

// A separate fake-account server and browser never access the user's 5360 storage.
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  {
    env: {
      ...process.env,
      VITE_SUPABASE_URL: 'https://wordverse-auth.test',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    },
    stdio: 'ignore',
    windowsHide: true,
  },
);
let browser;
try {
  await expect
    .poll(async () => {
      try {
        return (await fetch(base)).ok;
      } catch {
        return false;
      }
    })
    .toBe(true);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(`${base}/tests/fixtures/word-star-lab.html`);
  const canvas = page.locator('#star-lab');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await mkdir('docs/handoff/evidence/upgrade', { recursive: true });
  for (const shot of ['far', 'focus', 'close', 'side']) {
    await page.locator(`#${shot}`).click();
    await expect(canvas).toHaveAttribute('data-shot', shot);
    await expect(canvas).toHaveAttribute('data-refined', 'true');
    await page.screenshot({ path: `docs/handoff/evidence/upgrade/word-star-${shot}-1440.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#close').click();
  await expect(canvas).toHaveAttribute('data-shot', 'close');
  await expect(canvas).toHaveAttribute('data-refined', 'true');
  await page.screenshot({ path: 'docs/handoff/evidence/upgrade/word-star-close-390.png' });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  console.log('Shared production star optics/surface/passage evidence saved; no user records accessed.');
} finally {
  await browser?.close();
  server.kill();
}
