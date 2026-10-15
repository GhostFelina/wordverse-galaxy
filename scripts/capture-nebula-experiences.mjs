import { chromium, expect as baseExpect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base = process.env.WORDVERSE_BASE_URL || 'http://127.0.0.1:5351';
const folder = 'docs/handoff/evidence/2026-10-15-nebula-experiences';
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
    ['en', 1024, 900],
    ['es', 390, 900],
    ['tr', 1280, 600],
    ['en', 1920, 855],
  ]) {
    await ready(locale, width, height);
    await shot(`home-${width}-${height}-${locale}`);
    if ([390, 1024, 1440].includes(width)) {
      await page.locator('#language-trigger').click();
      await shot(`language-${width}-${locale}`);
      await page.keyboard.press('Escape');
    }
  }
  await ready();
  await page.locator('#nebula-picker summary').click();
  await shot('nebula-gallery');
  await page.keyboard.press('Escape');
  for (const id of ['ion-veil', 'ember-reach', 'tidal-shell']) {
    await ready();
    await page.locator('#nebula-picker summary').click();
    await page.locator(`[data-nebula-select="${id}"]`).click();
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-experience', id);
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
    await shot(`${id}-far`);
    await page.locator('#enter-nebula').click();
    await page.locator('#nebula-depth').fill('55');
    await page.locator('#nebula-depth').blur();
    await expect(page.locator('#nebula-navigation output')).toHaveText('55%');
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
    await shot(`${id}-inside`);
  }
  await ready();
  await page.locator('#sky-launcher summary').click();
  await shot('cosmic-event-menu');
  const graphics = await page.locator('#universe').evaluate((canvas) => {
    const gl = canvas.getContext('webgl2'),
      ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      gasResolution: canvas.dataset.nebulaGasResolution,
      quality: canvas.dataset.qualityMode,
    };
  });
  await page.goto(`${base}/tests/fixtures/sky-event-lab.html`);
  await expect(page.locator('#sky-lab')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { createSkyEvents, SKY_EVENTS } = await import('/src/sky-events.js');
    const { translate } = await import('/src/i18n.js');
    document.body.replaceChildren();
    document.body.style.cssText = 'margin:0;background:#05080f;color:#dfd6ca;font:12px system-ui;';
    const title = document.createElement('h1');
    title.textContent = 'Wordverse · 22 cosmic phenomena';
    title.style.cssText = 'font:400 25px Georgia;margin:0;padding:22px 28px;height:70px;box-sizing:border-box;';
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    const tileWidth = 240,
      tileHeight = 200;
    renderer.setSize(1440, 800);
    renderer.setClearColor(0x05080f);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const events = createSkyEvents({ reducedMotion: true });
    await events.warm(renderer);
    renderer.clear();
    renderer.setScissorTest(true);
    const grid = document.createElement('div');
    grid.style.cssText =
      'position:absolute;top:70px;left:0;display:grid;grid-template-columns:repeat(6,240px);grid-auto-rows:200px;pointer-events:none;';
    Object.keys(SKY_EVENTS).forEach((id, i) => {
      const x = i % 6,
        y = 3 - Math.floor(i / 6);
      renderer.setViewport(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
      renderer.setScissor(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
      events.select(id, { reposition: false });
      events.update(0, tileWidth / tileHeight, null);
      events.render(renderer);
      const label = document.createElement('div');
      label.textContent = String(i + 1).padStart(2, '0') + ' / ' + translate('en', `sky.${id}`);
      label.style.cssText = 'box-sizing:border-box;border:1px solid #e5c9a71a;padding:170px 12px 0;font-size:11px;';
      grid.append(label);
    });
    document.body.append(title, canvas, grid);
  });
  const eventGallery = 'cosmic-phenomena-22.png';
  await page.screenshot({ path: `${folder}/${eventGallery}` });
  captures.push({
    file: eventGallery,
    viewport: page.viewportSize(),
    sha256: createHash('sha256')
      .update(await readFile(`${folder}/${eventGallery}`))
      .digest('hex'),
  });
  expect(errors).toEqual([]);
  await writeFile(
    `${folder}/PROVENANCE.json`,
    JSON.stringify(
      {
        version: '1.26.0',
        date: new Date().toISOString(),
        browser: browser.version(),
        graphics,
        source:
          'Production modules on an isolated test origin/context. Synthetic records only; vocabulary storage checked after every capture.',
        motion: 'reduced; high gas quality',
        captures,
        consoleErrors: errors,
        limits:
          'Native headless Chrome review; user visual acceptance and broader GPU/performance acceptance remain open.',
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`${captures.length} synthetic native captures verified; ${graphics.renderer}`);
} finally {
  await browser.close();
}
