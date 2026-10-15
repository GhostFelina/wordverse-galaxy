import { expect, test } from '@playwright/test';

async function seed(page) {
  await page.addInitScript(() =>
    localStorage.setItem(
      'wordverse.universe.v4',
      JSON.stringify({
        version: 4,
        activeGalaxyId: 'zoom-g',
        events: [],
        galaxies: [
          {
            id: 'zoom-g',
            name: 'Zoom fixture',
            language: 'English',
            meaningLanguage: 'en',
            createdAt: '2026-10-12T09:00:00Z',
          },
        ],
        words: [
          {
            id: 'zoom-w',
            galaxyId: 'zoom-g',
            kind: 'word',
            word: 'Anchor',
            meaning: 'Synthetic zoom target',
            x: 31,
            y: 0,
            z: 18,
            createdAt: '2026-10-12T09:00:00Z',
          },
        ],
      }),
    ),
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

test('a failed sky asset gives visible atlas access instead of an endless black opening', async ({ page }) => {
  await seed(page);
  await page.route('**/assets/nebulae/orion-starless-v2.png', (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-graphics', 'unavailable');
  await expect(page.locator('#scene-loading')).toBeHidden();
  await page.locator('#graphics-open-atlas').click();
  await expect(page.locator('.collection-item')).toHaveCount(1);
});

test('plain wheel over Orion keeps personal stars and a continuous local depth scale', async ({ page }) => {
  await seed(page);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?lang=en');
  const canvas = page.locator('#universe');
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  // The visible gallery owns this screen region until explicitly collapsed.
  await page.locator('#nebula-picker summary').click();
  await page.mouse.move(1080, 450);
  await page.mouse.wheel(0, -180);
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-target-z'))).toBeLessThan(160);
  expect(Number(await canvas.getAttribute('data-camera-target-z'))).toBeGreaterThan(140);
  await expect
    .poll(async () =>
      Math.abs(
        Number(await canvas.getAttribute('data-camera-z')) - Number(await canvas.getAttribute('data-camera-target-z')),
      ),
    )
    .toBeLessThan(0.3);
  expect(Math.abs(Number(await canvas.getAttribute('data-camera-x')))).toBeLessThan(20);
  await expect(page.locator('[data-word-id="zoom-w"]')).toBeVisible();
  await expect(canvas).toHaveAttribute('data-focused-word', '');
  await page.mouse.wheel(0, 180);
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeGreaterThan(159);
  expect(Math.abs(Number(await canvas.getAttribute('data-camera-x')))).toBeLessThan(1);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
  expect(errors).toEqual([]);
});

test('reversing the wheel during damping returns the cursor anchor without sideways drift', async ({ page }) => {
  await seed(page);
  await page.goto('/?lang=en');
  const canvas = page.locator('#universe');
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
  await page.locator('#nebula-picker summary').click();
  await page.mouse.move(1080, 450);
  await page.mouse.wheel(0, -180);
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-camera-z')), { intervals: [20] })
    .toBeLessThan(158);
  await page.mouse.wheel(0, 180);
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeGreaterThan(159.9);
  expect(Math.abs(Number(await canvas.getAttribute('data-camera-x')))).toBeLessThan(0.3);
});

test('wheel directly over an unselected word star locks that star without opening a panel', async ({ page }) => {
  await seed(page);
  await page.goto('/?lang=tr');
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
  const star = page.locator('[data-word-id="zoom-w"]');
  const box = await star.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -180);
  await expect(page.locator('#universe')).toHaveAttribute('data-focused-word', 'zoom-w');
  await expect(page.locator('#detail-panel')).not.toHaveClass(/open/);
  await expect(star).toBeVisible();
});

test('cold opening shows preparation and renders stars before unrelated slow images finish', async ({ page }) => {
  await seed(page);
  let release;
  const hold = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/assets/nebulae/orion-starless.png', async (route) => {
    await hold;
    await route.continue();
  });
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const img = document.createElement('img');
      img.src = '/slow-opening-image';
      img.hidden = true;
      document.body.append(img);
    });
  });
  let releaseImage;
  const slowImage = new Promise((resolve) => {
    releaseImage = resolve;
  });
  await page.route('**/slow-opening-image', async (route) => {
    await slowImage;
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
    });
  });
  try {
    await page.goto('/?lang=es', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#scene-loading')).toBeVisible();
    await expect(page.locator('#scene-loading')).toHaveText('Preparando tu universo…');
    await expect(page.locator('#hero')).toBeVisible();
    release();
    await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
    expect(await page.evaluate(() => document.readyState)).not.toBe('complete');
    await expect(page.locator('[data-word-id="zoom-w"]')).toBeVisible();
    await expect(page.locator('#scene-loading')).toBeHidden();
  } finally {
    release();
    releaseImage();
  }
});
