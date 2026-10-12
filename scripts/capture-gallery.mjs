import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';

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
  await page.addInitScript(() => {
    const entries = [
      ['Serendipity', 'A fortunate discovery', 31, 0, 18],
      ['Resilience', 'The ability to recover', -4, 14, -160],
      ['Wonder', 'A feeling of curiosity', 67, 22, -220],
      ['Luminous', 'Giving off light', 12, -22, -100],
      ['Ethereal', 'Delicate and light', -18, 28, -440],
      ['Wanderlust', 'A desire to explore', 72, -13, -260],
    ];
    localStorage.setItem(
      'wordverse.universe.v4',
      JSON.stringify({
        version: 4,
        activeGalaxyId: 'gallery-g',
        events: [],
        galaxies: [
          {
            id: 'gallery-g',
            name: 'English galaxy',
            language: 'English',
            meaningLanguage: 'en',
            createdAt: '2026-10-12T09:00:00Z',
          },
        ],
        words: entries.map(([word, meaning, x, y, z], i) => ({
          id: `gallery-${i}`,
          galaxyId: 'gallery-g',
          kind: 'word',
          word,
          meaning,
          x,
          y,
          z,
          createdAt: '2026-10-12T09:00:00Z',
        })),
      }),
    );
  });
  await mkdir('docs/images', { recursive: true });
  await page.goto(`${base}/?lang=en`);
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
  await page.evaluate(() => document.fonts.ready);
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await page.screenshot({ path: 'docs/images/wordverse-desktop.png' });
  await page.locator('#scene-controls summary').click();
  for (const kind of ['blackhole', 'supernova', 'meteor']) {
    await page.locator(`[data-sky-event="${kind}"]`).click();
    await expect(page.locator('#universe')).toHaveAttribute('data-sky-event', kind);
    await page.locator('#scene-controls summary').click();
    await page.screenshot({ path: `docs/images/wordverse-${kind}.png` });
    await page.locator('#scene-controls summary').click();
  }
  await page.locator('[data-sky-event="none"]').click();
  await page.locator('#scene-controls summary').click();
  await page.locator('#collection-btn').click();
  await page.screenshot({ path: 'docs/images/wordverse-atlas.png' });
  await page.locator('.collection-item').filter({ hasText: 'Serendipity' }).click();
  await expect(page.locator('.detail-visual')).toHaveAttribute('data-stellar-preview', 'ready');
  await page.locator('#share-word').click();
  await expect(page.locator('#word-card-download')).toBeEnabled();
  const download = page.waitForEvent('download');
  await page.locator('#word-card-download').click();
  await (await download).saveAs('docs/images/wordverse-card-square.png');
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
  await page.goto(`${base}/tests/fixtures/word-star-lab.html`);
  await expect(page.locator('#star-lab')).toHaveAttribute('data-ready', 'true');
  await page.locator('#close').click();
  await expect(page.locator('#star-lab')).toHaveAttribute('data-shot', 'close');
  await expect(page.locator('#star-lab')).toHaveAttribute('data-refined', 'true');
  await page.evaluate(() => {
    document.querySelector('nav').style.display = 'none';
    document.querySelector('footer').style.display = 'none';
  });
  await page.screenshot({ path: 'docs/images/wordverse-photosphere.png' });
  expect(errors).toEqual([]);
  await writeFile(
    'docs/images/PROVENANCE.json',
    JSON.stringify(
      {
        date: '2026-10-12',
        version: '1.17.0',
        viewport: '1440x900',
        records: 'Synthetic gallery only, isolated ephemeral localhost and fresh browser; no user storage accessed',
        renderer: 'Production modules, Chromium, reduced motion',
        card: '1080x1080 PNG; selected synthetic word only, meaning omitted',
        astronomy: 'Artistic procedural experiences; Orion guidance credits in ATTRIBUTIONS.md',
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('Synthetic product gallery and card saved; records unchanged.');
} finally {
  await browser?.close();
  server.kill();
}
