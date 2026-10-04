import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

// A separate fake-account server and browser never access the user's 5360 storage.
const base = 'http://127.0.0.1:5351';
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5351', '--strictPort'],
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
  await page.goto(`${base}/?lang=tr`);
  const canvas = page.locator('#universe');
  await expect(canvas).toHaveAttribute('data-nebula-ready', 'true');
  await mkdir('docs/handoff/evidence/upgrade', { recursive: true });
  await page.screenshot({ path: 'docs/handoff/evidence/upgrade/orion-home-1440.png' });
  await page.locator('#open-nebulae').click();
  await page.locator('[data-nebula="orion"]').click();
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, -120);
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(150);
  await page.mouse.wheel(0, -120);
  await expect(canvas).toHaveAttribute('data-inside-nebula', 'orion');
  await expect(canvas).toHaveAttribute('data-nebula-texture-resolution', '8192');
  await page.screenshot({ path: 'docs/handoff/evidence/upgrade/orion-interior-1440.png' });
  console.log('Synthetic Orion home/interior evidence captured; user storage untouched.');
} finally {
  await browser?.close();
  server.kill();
}
