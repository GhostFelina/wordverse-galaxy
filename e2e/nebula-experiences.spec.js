import { test, expect } from '@playwright/test';

async function showPicker(page) {
  if (!(await page.locator('#nebula-picker').evaluate((node) => node.open)))
    await page.locator('#nebula-picker summary').click();
}

async function open(page, locale = 'en', width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    if (localStorage.getItem('wordverse.universe.v4')) return;
    localStorage.setItem(
      'wordverse.universe.v4',
      JSON.stringify({
        version: 4,
        activeGalaxyId: 'nebula-g',
        events: [],
        galaxies: [
          {
            id: 'nebula-g',
            name: 'Synthetic sky',
            language: 'English',
            meaningLanguage: 'en',
            createdAt: '2026-10-10T09:00:00Z',
          },
        ],
        words: [
          {
            id: 'nebula-w',
            galaxyId: 'nebula-g',
            kind: 'word',
            word: 'Luminous',
            meaning: 'Synthetic hidden answer',
            x: 31,
            y: 0,
            z: 0,
            createdAt: '2026-10-10T09:00:00Z',
          },
        ],
      }),
    );
  });
  await page.goto(`/?lang=${locale}`);
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready', { timeout: 20000 });
}

test('three added gas volumes support distant preview, interior flight and a clean return without changing records', async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await open(page);
  const canvas = page.locator('#universe');
  const baseline = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  for (const id of ['ion-veil', 'ember-reach', 'tidal-shell']) {
    await showPicker(page);
    await page.locator(`[data-nebula-select="${id}"]`).click();
    await expect(canvas).toHaveAttribute('data-nebula-experience', id, { timeout: 20000 });
    await expect(canvas).toHaveAttribute('data-nebula-flight', 'false');
    await expect(page.locator(`[data-nebula-select="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: test.info().outputPath(`${id}-far.png`) });
    await page.locator('#enter-nebula').click();
    await expect(canvas).toHaveAttribute('data-nebula-flight', 'true');
    await expect(page.locator('#app')).toHaveClass(/immersive/);
    await page.locator('#nebula-depth').fill('55');
    await page.locator('#nebula-depth').blur();
    await expect
      .poll(async () => Math.abs(Number(await page.locator('#nebula-depth').inputValue()) - 55), { timeout: 15000 })
      .toBeLessThan(2);
    await expect(page.locator('#nebula-navigation output')).toHaveText('55%', { timeout: 15000 });
    await page.screenshot({ path: test.info().outputPath(`${id}-inside.png`) });
    await page.locator('#nebula-navigation button').click();
    await expect(canvas).toHaveAttribute('data-nebula-experience', 'orion');
    await expect(canvas).toHaveAttribute('data-nebula-flight', 'false');
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(baseline);
  }
  expect(errors).toEqual([]);
});

test('failed optional volume leaves the current sky intact and offers a working retry', async ({ page }) => {
  test.setTimeout(60000);
  await open(page);
  let fail = true;
  await page.route('**/assets/nebulae/ember-reach-v1.wvz', (route) =>
    fail ? route.fulfill({ status: 503, body: 'Unavailable' }) : route.continue(),
  );
  await showPicker(page);
  await page.locator('[data-nebula-select="ember-reach"]').click();
  await expect(page.locator('.nebula-selection-status')).toContainText('could not load');
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-experience', 'orion');
  await expect(page.locator('[data-nebula-select="ember-reach"]')).toBeEnabled();
  fail = false;
  await page.locator('[data-nebula-select="ember-reach"]').click();
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-experience', 'ember-reach', { timeout: 20000 });
  await expect(page.locator('.nebula-selection-status')).toBeHidden();
});

test('desktop exposes the original previews and the complete fourteen-scene atlas', async ({ page }) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  const baseline = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  for (const id of ['orion', 'ion-veil', 'ember-reach', 'tidal-shell']) {
    const choice = page.locator(`[data-nebula-select="${id}"]`);
    await expect(choice).toBeVisible();
    await expect.poll(() => choice.locator('img').evaluate((image) => image.naturalWidth)).toBe(768);
  }
  await page.locator('#open-nebulae').click();
  await expect(page.locator('.nebula-card')).toHaveCount(14);
  await expect(page.locator('#nebula-title')).toHaveText('Nebula atlas · 14');
  expect((await page.locator('#nebula-dialog').boundingBox()).width).toBeGreaterThan(800);
  await page.locator('[data-nebula="ember-reach"]').click();
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-experience', 'ember-reach');
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-flight', 'true');
  await page.locator('#nebula-navigation button').click();
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(baseline);
  expect(errors).toEqual([]);
});

test('ten popular nebulae load on demand, fly and return with a bounded cache and unchanged records', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors = [],
    requests = [],
    guides = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (request) => {
    if (request.url().includes('/popular/') && request.url().endsWith('.wvz')) requests.push(request.url());
    if (request.url().includes('/popular/') && request.url().endsWith('-guide.jpg')) guides.push(request.url());
  });
  await open(page);
  expect(requests).toHaveLength(0);
  expect(guides).toHaveLength(0);
  const baseline = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  const canvas = page.locator('#universe');
  for (const id of [
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
    await showPicker(page);
    await page.locator(`[data-nebula-select="${id}"]`).click();
    await expect(canvas).toHaveAttribute('data-nebula-experience', id, { timeout: 20000 });
    await expect(page.locator('.nebula-source-credit')).toBeVisible();
    await page.locator('#enter-nebula').click();
    await expect(canvas).toHaveAttribute('data-nebula-flight', 'true');
    await page.locator('#nebula-depth').fill('55');
    await page.locator('#nebula-depth').blur();
    await expect(page.locator('#nebula-navigation output')).toHaveText('55%', { timeout: 15000 });
    expect(Number(await canvas.getAttribute('data-nebula-cache'))).toBeLessThanOrEqual(3);
    await page.locator('#nebula-navigation button').click();
    await expect(canvas).toHaveAttribute('data-nebula-experience', 'orion');
  }
  expect(new Set(requests).size).toBe(10);
  expect(new Set(guides).size).toBe(10);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(baseline);
  expect(errors).toEqual([]);
});

test('both atlas searches find translated names and compact catalog codes and recover from empty results', async ({
  page,
}) => {
  await open(page, 'es');
  const search = page.locator('#nebula-picker .nebula-search');
  await search.fill('HÉLICE');
  await expect(page.locator('.nebula-choice:not([hidden])')).toHaveCount(1);
  await expect(page.locator('[data-nebula-select="helix"]')).toBeVisible();
  await search.fill('ngc7293');
  await expect(page.locator('.nebula-choice:not([hidden])')).toHaveCount(1);
  await search.fill('zzzz');
  await expect(page.locator('#nebula-picker .nebula-no-results')).toBeVisible();
  await search.fill('');
  await expect(page.locator('.nebula-choice:not([hidden])')).toHaveCount(14);
  await page.locator('[data-nebula-group="popular"]').click();
  await expect(page.locator('.nebula-choice:not([hidden])')).toHaveCount(10);
  await expect(page.locator('[data-nebula-select="orion"]')).toBeHidden();
  await page.locator('[data-nebula-group="all"]').click();
  await expect(page.locator('.nebula-choice:not([hidden])')).toHaveCount(14);
  await page.locator('.nebula-atlas-link').click();
  await page.locator('#nebula-atlas-search').fill('M57');
  await expect(page.locator('.nebula-card:not([hidden])')).toHaveCount(1);
  await expect(page.locator('.nebula-card:not([hidden]) h3')).toHaveText('Anillo');
  await page.locator('#nebula-atlas-search').fill('zzzz');
  await expect(page.locator('#nebula-dialog .nebula-no-results')).toBeVisible();
  await page.locator('#nebula-atlas-search').fill('');
  await expect(page.locator('.nebula-card:not([hidden])')).toHaveCount(14);
});

test('black-hole inspection is explicit, returns safely and preserves word records and reduced-motion time', async ({
  page,
}) => {
  test.setTimeout(60000);
  await open(page);
  const baseline = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await page.locator('#sky-launcher summary').click();
  await page.locator('[data-sky-quick="blackhole"]').click();
  await expect(page.locator('#blackhole-inspect')).toBeVisible();
  await page.locator('#blackhole-inspect').click();
  await expect(page.locator('#universe')).toHaveAttribute('data-blackhole-view', 'close');
  await expect(page.locator('#app')).toHaveClass(/immersive/);
  await expect(page.locator('#universe')).toHaveAttribute('data-sky-event-time', '0');
  await page.locator('#blackhole-inspect').click();
  await expect(page.locator('#universe')).toHaveAttribute('data-blackhole-view', 'distant');
  await page.locator('#blackhole-inspect').click();
  await page.locator('#universe-mode').click();
  await expect(page.locator('#universe')).toHaveAttribute('data-blackhole-view', 'distant');
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(baseline);
});

test('compact nebula picker isolates scrolling and keeps flight depth and return reachable', async ({ page }) => {
  test.setTimeout(45000);
  await open(page, 'es', 390);
  const canvas = page.locator('#universe');
  const baseline = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await showPicker(page);
  await page.locator('.nebula-gallery > p').first().hover();
  await page.mouse.wheel(0, -400);
  await expect(canvas).toHaveAttribute('data-camera-target-z', '160');
  await page.locator('[data-nebula-select="ion-veil"]').click();
  await expect(canvas).toHaveAttribute('data-nebula-experience', 'ion-veil');
  await showPicker(page);
  await page.locator('.nebula-gallery-dive').click();
  await expect(page.locator('#nebula-navigation')).toBeVisible();
  await page.locator('#nebula-depth').fill('55');
  await page.locator('#nebula-depth').blur();
  await expect(page.locator('#nebula-navigation output')).toHaveText('55%', { timeout: 15000 });
  await page.locator('#nebula-navigation button').click();
  await expect(canvas).toHaveAttribute('data-nebula-flight', 'false');
  await expect(canvas).toHaveAttribute('data-nebula-experience', 'orion');
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(baseline);
});

test('automatic cosmic events continue inside a nebula and quiet sky stops them', async ({ page }) => {
  test.setTimeout(60000);
  await open(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await showPicker(page);
  await page.locator('[data-nebula-select="tidal-shell"]').click();
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-experience', 'tidal-shell');
  await page.locator('#enter-nebula').click();
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-flight', 'true');
  await expect(page.locator('#universe')).toHaveAttribute('data-sky-origin', 'automatic', { timeout: 30000 });
  await expect(page.locator('#universe')).not.toHaveAttribute('data-sky-event', '');
  await page.locator('#sky-launcher summary').click();
  await page.locator('#living-sky').click();
  await expect(page.locator('#universe')).toHaveAttribute('data-living-sky', 'false');
  await expect(page.locator('#universe')).toHaveAttribute('data-sky-event', '');
});

for (const [locale, width] of [
  ['tr', 1440],
  ['en', 1024],
  ['es', 390],
]) {
  test(`language menu supports native names, keyboard navigation and bounds at ${width}/${locale}`, async ({
    page,
  }) => {
    await open(page, locale, width);
    const trigger = page.locator('#language-trigger');
    await trigger.click();
    await expect(page.locator('#language-menu [role="menuitemradio"]')).toHaveCount(3);
    await expect(page.locator(`[data-locale-option="${locale}"]`)).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator(`[data-locale-option="${locale}"]`)).toBeFocused();
    const bounds = await page.locator('#language-menu').boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('End');
    await expect(page.locator('[data-locale-option="es"]')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('[data-locale-option="tr"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(page.locator('#language-menu')).toBeHidden();
    const baseline = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    await trigger.click();
    await page.locator('[data-locale-option="en"]').click();
    await expect(page).toHaveURL(/\/en\/$/);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(baseline);
  });
}

test('all 22 production event shaders draw, new phenomena differ and reduced motion freezes them', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tests/fixtures/sky-event-lab.html');
  await expect(page.locator('#sky-lab')).toHaveAttribute('data-ready', 'true', { timeout: 20000 });
  const results = await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { createSkyEvents, SKY_EVENTS } = await import('/src/sky-events.js');
    const renderer = new THREE.WebGLRenderer();
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const target = new THREE.WebGLRenderTarget(256, 256);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100000);
    camera.position.z = 160;
    camera.updateMatrixWorld();
    const events = createSkyEvents({ reducedMotion: true });
    await events.warm(renderer);
    const capture = () => {
      renderer.setRenderTarget(target);
      renderer.setClearColor(0);
      renderer.render(scene, camera);
      events.render(renderer);
      const pixels = new Uint8Array(256 * 256 * 4);
      renderer.readRenderTargetPixels(target, 0, 0, 256, 256, pixels);
      return pixels;
    };
    const result = [];
    for (const id of Object.keys(SKY_EVENTS)) {
      events.select(id, { reposition: false });
      events.update(0, 1, camera);
      const before = capture();
      events.update(0.1, 1, camera);
      const after = capture();
      let lit = 0,
        hash = 2166136261;
      for (let i = 0; i < before.length; i += 4) {
        if (Math.max(before[i], before[i + 1], before[i + 2]) > 5) lit++;
        hash = Math.imul(hash ^ before[i] ^ (before[i + 1] << 8) ^ (before[i + 2] << 16), 16777619) >>> 0;
      }
      result.push({ id, lit, hash, frozen: before.every((v, i) => v === after[i]) });
      if (Object.keys(SKY_EVENTS).indexOf(id) >= 6) {
        events.setReducedMotion(false);
        events.select(id, { reposition: false });
        for (let elapsed = 0; elapsed < SKY_EVENTS[id] * 0.45; elapsed += 0.1) events.update(0.1, 1, camera);
        const moving = capture();
        for (let step = 0; step < 10; step++) events.update(0.1, 1, camera);
        const captureAfter = capture();
        result.at(-1).animated = !moving.every((v, i) => v === captureAfter[i]);
        events.setReducedMotion(true);
      }
    }
    events.dispose();
    target.dispose();
    renderer.dispose();
    return result;
  });
  expect(results).toHaveLength(22);
  for (const result of results) {
    expect(result.lit, result.id).toBeGreaterThan(8);
    expect(result.lit, result.id).toBeLessThan(256 * 256 * 0.2);
    expect(result.frozen, result.id).toBe(true);
    if (Object.hasOwn(result, 'animated')) expect(result.animated, result.id).toBe(true);
  }
  expect(new Set(results.slice(6).map((result) => result.hash)).size).toBe(16);
  expect(errors).toEqual([]);
});
