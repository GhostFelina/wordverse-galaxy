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
  await page.goto(`${base}/?lang=tr`);
  const canvas = page.locator('#universe');
  await expect(canvas).toHaveAttribute('data-nebula-ready', 'true');
  await expect(canvas).toHaveAttribute('data-nebula-loaded', '1');
  await page.locator('#showcase-guest').click();
  await expect(page.locator('#app')).toHaveAttribute('data-experience', 'guest-personal');
  // Identity transitions clear the previous owner frame. Observe an actual
  // camera frame before trusting refinement attributes left by that owner.
  await page.locator('#zoom-out').click();
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeGreaterThan(180);
  await page.locator('#open-nebulae').click();
  await page.locator('#nebula-overview').click();
  await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-camera-z')) - 160)).toBeLessThan(3);
  await expect(canvas).toHaveAttribute('data-nebula-refined', 'true');
  await mkdir('docs/handoff/evidence/upgrade', { recursive: true });
  await page.screenshot({ path: 'docs/handoff/evidence/upgrade/orion-home-1440.png' });
  await page.locator('#open-nebulae').click();
  await page.locator('[data-nebula="orion"]').click();
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, -120);
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(150);
  await page.mouse.wheel(0, -120);
  await expect(canvas).toHaveAttribute('data-inside-nebula', 'orion');
  await expect(canvas).toHaveAttribute('data-nebula-texture-resolution', '1254');
  const entranceZ = Number(await canvas.getAttribute('data-camera-z'));
  await page.mouse.wheel(0, -120);
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(entranceZ - 50);
  await expect(canvas).toHaveAttribute('data-nebula-refined', 'true');
  await page.screenshot({ path: 'docs/handoff/evidence/upgrade/orion-interior-1440.png' });
  for (let i = 0; i < 2; i++) {
    const before = Number(await canvas.getAttribute('data-camera-z'));
    await page.mouse.wheel(0, -120);
    await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(before - 50);
  }
  await expect(canvas).toHaveAttribute('data-inside-nebula', 'orion');
  await expect(canvas).toHaveAttribute('data-nebula-refined', 'true');
  await page.screenshot({ path: 'docs/handoff/evidence/upgrade/orion-deep-1440.png' });
  console.log('Synthetic Orion home/interior evidence captured; user storage untouched.');
} finally {
  await browser?.close();
  server.kill();
}
