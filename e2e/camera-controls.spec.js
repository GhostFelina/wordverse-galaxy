import { expect, test } from '@playwright/test';

async function seedHome(page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('wordverse.universe.v4')) return;
    localStorage.setItem(
      'wordverse.universe.v4',
      JSON.stringify({
        version: 4,
        activeGalaxyId: 'camera-g',
        events: [],
        galaxies: [
          {
            id: 'camera-g',
            name: 'Camera fixture',
            language: 'English',
            meaningLanguage: 'en',
            createdAt: '2026-10-04T09:00:00Z',
          },
        ],
        words: [
          {
            id: 'camera-w',
            galaxyId: 'camera-g',
            kind: 'word',
            word: 'Continuity',
            meaning: 'A synthetic camera test',
            x: 31,
            y: 0,
            z: 18,
            createdAt: '2026-10-04T09:00:00Z',
          },
        ],
      }),
    );
  });
}

for (const [width, height, locale] of [
  [1440, 900, 'tr'],
  [1280, 800, 'es'],
  [1024, 768, 'en'],
]) {
  test(`home composition keeps navigation and footer apart at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await seedHome(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?lang=${locale}`);
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-ready', 'true');
    for (const selector of [
      '#home-btn',
      '#open-add',
      '#collection-btn',
      '.bottom-left',
      '.controls',
      '#nebula-credit',
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
    }
    const stats = await page.locator('.bottom-left').boundingBox();
    const controls = await page.locator('.controls').boundingBox();
    const credit = await page.locator('#nebula-credit').boundingBox();
    expect(stats.y + stats.height).toBeLessThanOrEqual(credit.y);
    if (width <= 760) expect(stats.y + stats.height).toBeLessThanOrEqual(controls.y);
    await expect(page.locator('#hero-add')).toBeVisible();
    await expect(page.locator('#universe')).toHaveAttribute('data-nebula-refined', 'true');
    await page.screenshot({ path: `docs/handoff/evidence/2026-10-12-home-${width}-${height}-${locale}.png` });
    await page.locator('#collection-btn').click();
    await expect(page.locator('#open-recall')).toBeVisible();
    await expect(page.locator('#universe-mode')).toBeHidden();
    await page.locator('.collection-item').click();
    await expect(page.locator('#detail-panel')).toHaveClass(/open/);
    await expect(page.locator('#detail-panel')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    await expect(page.locator('.detail-orbit').first()).toBeHidden();
    await expect(page.locator('#universe-mode')).toBeHidden();
    await page.screenshot({ path: `docs/handoff/evidence/2026-10-12-detail-${width}-${height}-${locale}.png` });
  });
}

for (const [width, locale] of [
  [1440, 'tr'],
  [768, 'en'],
  [390, 'es'],
]) {
  test(`view settings stay reachable, isolated and persistent at ${width}/${locale}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: width === 768 ? 'light' : 'dark' });
    await seedHome(page);
    await page.goto(`/?lang=${locale}`);
    const canvas = page.locator('#universe');
    await expect(canvas).toHaveAttribute('data-nebula-ready', 'true');
    const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    await page.locator('#scene-controls summary').click();
    await expect(page.locator('#render-quality')).toBeVisible();
    const bounds = await page.locator('.scene-controls-content').boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await page.locator('#render-quality').selectOption('low');
    await expect(canvas).toHaveAttribute('data-quality-mode', 'low');
    await expect(canvas).toHaveAttribute('data-render-dpr', '0.75');
    await page.mouse.move(bounds.x + 50, bounds.y + 100);
    await page.mouse.wheel(0, -500);
    await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeCloseTo(160, 1);
    await expect(canvas).toHaveAttribute('data-nebula-loaded', '1');
    await expect(canvas).toHaveAttribute('data-nebula-refined', 'true');
    await page.screenshot({ path: `docs/handoff/evidence/2026-10-12-view-controls-${width}-${locale}.png` });
    await page.reload();
    await expect(canvas).toHaveAttribute('data-quality-mode', 'low');
    await page.locator('#scene-controls summary').click();
    await expect(page.locator('#render-quality')).toHaveValue('low');
    await page.locator('#render-quality').press('Escape');
    await expect(page.locator('#scene-controls')).not.toHaveAttribute('open', '');
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
  });
}

test('explore opens the universe, keyboard navigates and Escape restores the interface without writes', async ({
  page,
}) => {
  await seedHome(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?lang=en');
  const canvas = page.locator('#universe');
  await expect(canvas).toHaveAttribute('data-nebula-ready', 'true');
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await page.locator('#hero-explore').click();
  await expect(page.locator('#app')).toHaveClass(/immersive/);
  await expect(canvas).toBeFocused();
  await canvas.press('+');
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(150);
  await canvas.press('Home');
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeGreaterThan(159);
  await canvas.press('ArrowRight');
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-x'))).toBeGreaterThan(35);
  await canvas.press('Escape');
  await expect(page.locator('#app')).not.toHaveClass(/immersive/);
  await page.locator('#collection-btn').click();
  await page.locator('#search-input').fill('/');
  await page.locator('#search-input').press('/');
  await expect(page.locator('#search-input')).toHaveValue('//');
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
});

test('two-finger zoom preserves the selected target; cancellation leaves mouse navigation usable', async ({ page }) => {
  await seedHome(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?lang=en');
  const canvas = page.locator('#universe');
  await expect(canvas).toHaveAttribute('data-nebula-ready', 'true');
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await page.locator('.star-hit').click();
  await page.keyboard.press('Escape');
  await canvas.focus();
  await canvas.press('+');
  await expect(canvas).toHaveAttribute('data-focused-word', 'camera-w');
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(150);
  const start = Number(await canvas.getAttribute('data-camera-z'));
  await page.locator('#universe-mode').click();
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 600, y: 600, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: 600, y: 600, id: 1 },
      { x: 800, y: 600, id: 2 },
    ],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: 500, y: 600, id: 1 },
      { x: 900, y: 600, id: 2 },
    ],
  });
  await expect(canvas).toHaveAttribute('data-focused-word', 'camera-w');
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(start - 20);
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await canvas.press('Home');
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeGreaterThan(159);
  await page.mouse.move(550, 650);
  await page.mouse.down();
  await page.mouse.move(850, 650, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-x'))).toBeLessThan(-5);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
});
