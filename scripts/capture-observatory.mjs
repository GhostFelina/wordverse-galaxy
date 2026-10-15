import { chromium, expect as baseExpect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const folder = 'docs/handoff/evidence/2026-10-15-observatory',
  expect = baseExpect.configure({ timeout: 15000 });
const reservation = createServer();
await new Promise((r) => reservation.listen(0, '127.0.0.1', r));
const port = reservation.address().port;
await new Promise((r) => reservation.close(r));
const base = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  {
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      VITE_SUPABASE_URL: 'https://wordverse-auth.test',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    },
  },
);
let browser;
const errors = [],
  captures = [];
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
  browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=d3d11'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.addInitScript(() => {
    localStorage.setItem('wordverse.render-quality', 'high');
    if (localStorage.getItem('wordverse.universe.v4')) return;
    const names = [
      'Lucent',
      'Ephemeral',
      'Serendipity',
      'Luminous',
      'Ethereal',
      'Wanderlust',
      'Sonder',
      'Halcyon',
      'Resonance',
      'Solace',
      'Aurora',
      'Continuity',
    ];
    localStorage.setItem(
      'wordverse.universe.v4',
      JSON.stringify({
        version: 4,
        activeGalaxyId: 'observatory',
        events: [],
        galaxies: [
          {
            id: 'observatory',
            name: 'English galaxy',
            language: 'English',
            meaningLanguage: 'en',
            createdAt: '2026-10-14T09:00:00Z',
          },
        ],
        words: names.map((word, i) => ({
          id: 'synthetic-' + i,
          galaxyId: 'observatory',
          kind: 'word',
          word,
          meaning: 'Synthetic definition ' + i,
          x: 12 + ((i * 19) % 100),
          y: ((i % 3) - 1) * 20,
          z: 18 - i * 35,
          createdAt: new Date(Date.UTC(2026, 9, 14, 9, i)).toISOString(),
        })),
      }),
    );
  });
  await mkdir(folder, { recursive: true });
  let baseline;
  const shot = async (name) => {
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `${folder}/${name}.png` });
    captures.push({
      file: `${name}.png`,
      viewport: page.viewportSize(),
      sha256: createHash('sha256')
        .update(await readFile(`${folder}/${name}.png`))
        .digest('hex'),
    });
  };
  for (const [width, height, locale] of [
    [1440, 900, 'tr'],
    [1024, 900, 'en'],
    [390, 900, 'es'],
    [1280, 600, 'tr'],
    [1920, 1080, 'en'],
    [1920, 855, 'en'],
    [2560, 900, 'en'],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/?lang=${locale}`);
    await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
    await page.evaluate(() => document.fonts.ready);
    if (await page.locator('#home-recent').isVisible()) {
      const [recent, stats] = await Promise.all([
        page.locator('#home-recent').boundingBox(),
        page.locator('.bottom-left').boundingBox(),
      ]);
      expect(recent.y + recent.height + 16).toBeLessThanOrEqual(stats.y);
    }
    baseline ??= await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await shot(`home-${width}-${height}-${locale}`);
    if (height >= 900) {
      await page.locator('.recent-word').first().click();
      await expect(page.locator('#detail-panel')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
      await expect(page.locator('#detail-meaning')).toBeHidden();
      await page.locator('#next-record').click();
      await shot(`detail-${width}-${locale}`);
      await page.keyboard.press('Escape');
    }
    if (width === 1440 || width === 390) {
      await page.locator('#scene-controls summary').click();
      await page.locator('#nebula-density').scrollIntoViewIfNeeded();
      const box = await page.locator('.scene-controls-content').boundingBox();
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(height);
      await shot(`atmosphere-controls-${width}-${locale}`);
      await page.keyboard.press('Escape');
    }
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(baseline);
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${base}/?lang=en`);
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
  await page.locator('#scene-controls summary').click();
  await page.locator('#star-paths').selectOption('on');
  await page.locator('#star-labels').selectOption('all');
  await page.keyboard.press('Escape');
  await page.locator('#enter-nebula').click();
  for (const depth of [15, 40, 65, 85]) {
    await page.locator('#nebula-depth').fill(String(depth));
    await expect
      .poll(async () =>
        Math.abs(
          Number(await page.locator('#universe').getAttribute('data-camera-z')) -
            Number(await page.locator('#universe').getAttribute('data-camera-target-z')),
        ),
      )
      .toBeLessThan(2);
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
    await page.waitForTimeout(250);
    await shot(`flight-depth-${depth}`);
  }
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(baseline);
  await page.goto(`${base}/tests/fixtures/word-star-lab.html`);
  await expect(page.locator('#star-lab')).toHaveAttribute('data-ready', 'true');
  for (const view of ['general', 'nebula-entrance', 'nebula-inside', 'nebula-deep', 'nebula-angle', 'nebula-side']) {
    await page.locator(`#${view}`).click();
    await expect(page.locator('#star-lab')).toHaveAttribute('data-shot', view);
    await expect(page.locator('#star-lab')).toHaveAttribute('data-refined', 'true');
    await page.waitForTimeout(400);
    await shot(`volume-${view}`);
  }
  expect(errors).toEqual([]);
  await writeFile(
    `${folder}/PROVENANCE.json`,
    JSON.stringify(
      {
        version: JSON.parse(await readFile('package.json', 'utf8')).version,
        date: new Date().toISOString(),
        browser: await browser.version(),
        renderer: 'Fresh native Chrome, ANGLE D3D11 requested',
        quality:
          'High; reduced motion in the actual app; frozen production-module fixture. Native viewport resolution, no canvas substitution or image upscaling.',
        privacy:
          'Only isolated synthetic records; no existing browser profile, personal record or private screenshot is accessed.',
        checks:
          'TR/EN/ES, short/narrow screens, menu bounds, concealed meanings, record navigation, camera convergence, unchanged stored records, and six production volume angles.',
        captures,
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`${captures.length} native synthetic captures; record and viewport checks pass.`);
} finally {
  await browser?.close();
  server.kill();
}
