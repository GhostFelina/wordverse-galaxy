import { test, expect } from '@playwright/test';

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
    await page.locator('#nebula-picker summary').click();
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
  await page.locator('#nebula-picker summary').click();
  await page.locator('[data-nebula-select="ember-reach"]').click();
  await expect(page.locator('.nebula-selection-status')).toContainText('could not load');
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-experience', 'orion');
  await expect(page.locator('[data-nebula-select="ember-reach"]')).toBeEnabled();
  fail = false;
  await page.locator('[data-nebula-select="ember-reach"]').click();
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-experience', 'ember-reach', { timeout: 20000 });
  await expect(page.locator('.nebula-selection-status')).toBeHidden();
});

test('compact nebula picker isolates scrolling and keeps flight depth and return reachable', async ({ page }) => {
  test.setTimeout(45000);
  await open(page, 'es', 390);
  const canvas = page.locator('#universe');
  const baseline = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await page.locator('#nebula-picker summary').click();
  await page.locator('.nebula-gallery > p').hover();
  await page.mouse.wheel(0, -400);
  await expect(canvas).toHaveAttribute('data-camera-target-z', '160');
  await page.locator('[data-nebula-select="ion-veil"]').click();
  await expect(canvas).toHaveAttribute('data-nebula-experience', 'ion-veil');
  await page.locator('#nebula-picker summary').click();
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
  await page.locator('#nebula-picker summary').click();
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
