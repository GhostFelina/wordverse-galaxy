import { chromium, expect as baseExpect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base = process.env.WORDVERSE_BASE_URL || 'http://127.0.0.1:5351';
const folder = 'docs/handoff/evidence/2026-10-15-nebula-atlas';
const expect = baseExpect.configure({ timeout: 20000 });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const errors = [],
  captures = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
await page.addInitScript(() => {
  localStorage.setItem('wordverse.render-quality', 'high');
  if (localStorage.getItem('wordverse.universe.v4')) return;
  const createdAt = '2026-10-10T09:00:00Z';
  localStorage.setItem(
    'wordverse.universe.v4',
    JSON.stringify({
      version: 4,
      activeGalaxyId: 'visual-g',
      events: [],
      galaxies: [{ id: 'visual-g', name: 'English galaxy', language: 'English', meaningLanguage: 'en', createdAt }],
      words: ['Luminous', 'Serendipity', 'Solace', 'Aurora', 'Wanderlust', 'Halcyon'].map((word, i) => ({
        id: `visual-${i}`,
        galaxyId: 'visual-g',
        word,
        kind: 'word',
        meaning: `Synthetic answer ${i}`,
        createdAt,
        x: 24 + i * 14,
        y: ((i % 3) - 1) * 12,
        z: -i * 35,
      })),
    }),
  );
});
await mkdir(folder, { recursive: true });
let baseline;
async function shot(name) {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `${folder}/${name}.png` });
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(baseline);
  captures.push({
    file: `${name}.png`,
    viewport: page.viewportSize(),
    sha256: createHash('sha256')
      .update(await readFile(`${folder}/${name}.png`))
      .digest('hex'),
  });
}
async function ready(locale = 'tr', width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}/?lang=${locale}`);
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
  await page.evaluate(() => document.fonts.ready);
  baseline ??= await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
}
try {
  for (const [locale, width, height] of [
    ['tr', 1440, 900],
    ['en', 1024, 768],
    ['es', 390, 900],
    ['tr', 1280, 600],
    ['en', 1920, 1080],
  ]) {
    await ready(locale, width, height);
    await shot('home-' + width + '-' + height + '-' + locale);
  }
  await ready();
  await page.locator('[data-nebula-group="popular"]').click();
  await shot('gallery-popular-ten');
  await page.locator('[data-nebula-group="all"]').click();
  await page.locator('#language-trigger').click();
  await shot('language-native-menu');
  await page.keyboard.press('Escape');
  await page.locator('#open-nebulae').click();
  await page.locator('#nebula-atlas-search').fill('M57');
  await shot('atlas-ring-search');
  await page.locator('#nebula-atlas-search').fill('');
  await shot('atlas-all-fourteen');
  await page.locator('#nebula-dialog .auth-close').click();
  for (const id of [
    'ion-veil',
    'ember-reach',
    'tidal-shell',
    'carina',
    'eagle',
    'horsehead',
    'helix',
    'crab',
    'ring',
    'rosette',
    'tarantula',
    'lagoon',
    'trifid',
  ]) {
    await ready();
    await page.locator('#nebula-picker .nebula-search').fill(id);
    await page.locator('[data-nebula-select="' + id + '"]').click();
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-experience', id);
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
    await page.locator('#nebula-picker summary').click();
    await shot(id + '-far');
    await page.locator('#enter-nebula').click();
    await page.locator('#nebula-depth').fill('55');
    await page.locator('#nebula-depth').blur();
    await expect(page.locator('#nebula-navigation output')).toHaveText('55%');
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
    await shot(id + '-inside');
  }
  await ready();
  await page.locator('#sky-launcher summary').click();
  await page.locator('[data-sky-quick="blackhole"]').click();
  await shot('blackhole-far');
  await page.locator('#blackhole-inspect').click();
  await expect(page.locator('#universe')).toHaveAttribute('data-blackhole-view', 'close');
  await shot('blackhole-close');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const frames = await page.evaluate(async () => {
    const samples = [];
    let last = performance.now();
    for (let i = 0; i < 65; i++) {
      const now = await new Promise(requestAnimationFrame);
      if (i > 4) samples.push(now - last);
      last = now;
    }
    samples.sort((a, b) => a - b);
    return {
      count: samples.length,
      p50: samples[Math.floor(samples.length * 0.5)],
      p95: samples[Math.floor(samples.length * 0.95)],
    };
  });
  const graphics = await page.locator('#universe').evaluate((canvas) => {
    const gl = canvas.getContext('webgl2'),
      ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      gasResolution: canvas.dataset.nebulaGasResolution,
      dpr: canvas.dataset.renderDpr,
    };
  });
  expect(errors).toEqual([]);
  await writeFile(
    folder + '/PROVENANCE.json',
    JSON.stringify(
      {
        version: '1.27.0',
        date: new Date().toISOString(),
        browser: browser.version(),
        graphics,
        blackHoleCloseFrames: frames,
        source: 'Native production modules, isolated synthetic vocabulary; storage checked after every capture.',
        captures,
        consoleErrors: errors,
        limits: 'Short native headless run; user visual acceptance and other GPU performance remain open.',
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ captures: captures.length, graphics, blackHoleCloseFrames: frames, errors }));
} finally {
  await browser.close();
}
