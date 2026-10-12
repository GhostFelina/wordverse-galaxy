import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
const folder = 'docs/images/home-design';
const errors = [];
const captures = [];
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
  const native = process.env.WORDVERSE_CAPTURE_BROWSER === 'chrome';
  browser = await chromium.launch(native ? { channel: 'chrome', args: ['--use-angle=d3d11'] } : {});
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.addInitScript(() => {
    let seed = 827;
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    if (localStorage.getItem('wordverse.universe.v4')) return;
    localStorage.setItem('wordverse.render-quality', 'high');
    const entries = [
      ['Lucent', 'Softly shining', 31, -4, 67],
      ['Ephemeral', 'Lasting for a short time', 47, 12, 48],
      ['Serendipity', 'A fortunate discovery', 22, 7, 40],
      ['Luminous', 'Giving off light', 12, -22, -100],
      ['Ethereal', 'Delicate and light', -18, 28, -440],
      ['Wanderlust', 'A desire to explore', 72, -13, -260],
    ];
    localStorage.setItem(
      'wordverse.universe.v4',
      JSON.stringify({
        version: 4,
        activeGalaxyId: 'home-design-g',
        events: [],
        galaxies: [
          {
            id: 'home-design-g',
            name: 'English galaxy',
            language: 'English',
            meaningLanguage: 'en',
            createdAt: '2026-10-12T09:00:00Z',
          },
        ],
        words: entries.map(([word, meaning, x, y, z], i) => ({
          id: `home-design-${i}`,
          galaxyId: 'home-design-g',
          kind: 'word',
          word,
          meaning,
          x,
          y,
          z,
          createdAt: new Date(Date.now() - [18, 60, 3, 0, 150, 500][i] * 60000).toISOString(),
        })),
      }),
    );
  });
  await mkdir(folder, { recursive: true });
  const shot = async (name, path = `${folder}/${name}.png`) => {
    await page.mouse.move(0, 0);
    await page.screenshot({ path });
    captures.push({
      file: path,
      viewport: page.viewportSize(),
      sha256: createHash('sha256')
        .update(await readFile(path))
        .digest('hex'),
    });
  };
  let baseline;
  for (const [width, height, locale] of [
    [1440, 900, 'en'],
    [1440, 900, 'tr'],
    [1280, 800, 'es'],
    [1024, 768, 'en'],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/?lang=${locale}`);
    await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#sky-launcher summary').click();
    await page.locator('#living-sky').click();
    await page.locator('#sky-launcher summary').click();
    const records = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    if (baseline) expect(records).toBe(baseline);
    baseline = records;
    await shot(
      `home-${width}-${locale}`,
      locale === 'en' && width === 1440 ? 'docs/images/wordverse-desktop.png' : undefined,
    );
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/?lang=tr`);
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
  await page.locator('#scene-controls summary').click();
  const menu = await page.locator('.scene-controls-content').boundingBox();
  expect(menu.y).toBeGreaterThanOrEqual(96);
  expect(menu.x + menu.width).toBeLessThanOrEqual(1440);
  await shot('view-menu');
  await page.locator('#render-quality').press('Escape');
  await expect(page.locator('#scene-controls summary')).toBeFocused();
  await page.locator('#sky-launcher summary').click();
  await shot('sky-menu');
  await page.locator('#sky-launcher summary').press('Escape');
  await page.locator('#galaxy-switch').click();
  await expect(page.locator('#galaxy-panel')).toHaveClass(/open/);
  await expect(page.locator('#galaxy-panel')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await shot('galaxy-menu');
  await page.locator('#close-galaxy').click();
  await page.locator('#open-add').click();
  await expect(page.locator('#add-panel')).toHaveClass(/open/);
  await expect(page.locator('#add-panel')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await expect(page.locator('#galaxy-panel')).not.toHaveClass(/open/);
  await shot('add-panel');
  await page.locator('#close-add').click();
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(baseline);
  const emptyPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await emptyPage.goto(`${base}/?lang=en`);
  await expect(emptyPage.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
  await expect(emptyPage.locator('#showcase-intro')).toBeVisible();
  await emptyPage.evaluate(() => document.fonts.ready);
  await emptyPage.screenshot({ path: `${folder}/first-visit.png` });
  captures.push({
    file: `${folder}/first-visit.png`,
    viewport: emptyPage.viewportSize(),
    sha256: createHash('sha256')
      .update(await readFile(`${folder}/first-visit.png`))
      .digest('hex'),
  });
  await emptyPage.locator('#showcase-guest').click();
  await expect(emptyPage.locator('#showcase-intro')).toBeHidden();
  await expect(emptyPage.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
  await expect(emptyPage.locator('#scene-loading')).toBeHidden();
  await expect(emptyPage.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
  await expect(emptyPage.locator('#hero-add')).toHaveText(/Add your first word/);
  await expect(emptyPage.locator('#hero-add')).toBeVisible();
  await expect(emptyPage.locator('#star-count')).toHaveText('00');
  await emptyPage.screenshot({ path: `${folder}/empty-home.png` });
  captures.push({
    file: `${folder}/empty-home.png`,
    viewport: emptyPage.viewportSize(),
    sha256: createHash('sha256')
      .update(await readFile(`${folder}/empty-home.png`))
      .digest('hex'),
  });
  expect(errors).toEqual([]);
  const version = JSON.parse(await readFile('package.json', 'utf8')).version;
  const provenance = {
    version,
    date: '2026-10-12',
    browser: await browser.version(),
    renderer: native ? 'Fresh native Chrome; ANGLE D3D11 requested' : 'Fresh Playwright Chromium',
    quality: 'High-quality reduced-motion scene; no CSS or canvas substitutions',
    privacy:
      'Synthetic vocabulary only, isolated ephemeral localhost. Existing user profiles and records are never accessed.',
    checks:
      'TR/EN/ES desktop states, empty state, menu bounds, Escape focus restoration and unchanged synthetic records',
    captures,
    errors,
  };
  await writeFile(`${folder}/PROVENANCE.json`, JSON.stringify(provenance, null, 2) + '\n');
  const galleryPath = 'docs/images/PROVENANCE.json';
  const gallery = JSON.parse(await readFile(galleryPath, 'utf8'));
  gallery.homeDesign = {
    version,
    manifest: 'home-design/PROVENANCE.json',
    replaces: 'wordverse-desktop.png; other gallery captures and animation retain their original provenance',
  };
  await writeFile(galleryPath, JSON.stringify(gallery, null, 2) + '\n');
  console.log(`${captures.length} synthetic home-design captures saved; record and menu checks passed.`);
} finally {
  await browser?.close();
  server.kill();
}
