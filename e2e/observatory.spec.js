import { test, expect } from '@playwright/test';
async function seed(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() =>
    localStorage.setItem(
      'wordverse.universe.v4',
      JSON.stringify({
        version: 4,
        activeGalaxyId: 'observe-g',
        events: [],
        galaxies: [
          {
            id: 'observe-g',
            name: 'Synthetic observatory',
            language: 'English',
            meaningLanguage: 'en',
            createdAt: '2026-10-14T09:00:00Z',
          },
        ],
        words: ['Atlas', 'Aurora', 'Bloom', 'Cedar'].map((word, i) => ({
          id: `observe-${i}`,
          galaxyId: 'observe-g',
          kind: 'word',
          word,
          meaning: `Hidden answer ${i}`,
          x: 10 + i * 12,
          y: (i % 2) * 12,
          z: -i * 30,
          createdAt: `2026-10-${10 + i}T09:00:00Z`,
        })),
      }),
    ),
  );
}
for (const [locale, width] of [
  ['tr', 1440],
  ['en', 1024],
  ['es', 390],
]) {
  test(`recent discoveries and record navigation preserve concealed answers at ${width}/${locale}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await seed(page);
    await page.goto(`/?lang=${locale}`);
    await expect(page.locator('#home-recent')).toBeVisible();
    const raw = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    await expect(page.locator('.recent-word')).toHaveCount(3);
    await page.locator('.recent-word').first().click();
    await expect(page.locator('#detail-word')).toHaveText('Cedar');
    await page.locator('#next-record').click();
    await expect(page.locator('#detail-word')).toHaveText('Bloom');
    await expect(page.locator('#detail-meaning')).toBeHidden();
    await expect(page.locator('#next-record')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#detail-word')).toHaveText('Cedar');
    await page.keyboard.press('Escape');
    await expect(page.locator('.recent-word').first()).toBeFocused();
    await page.locator('#random-word').click();
    await expect(page.locator('#detail-word')).not.toHaveText('Cedar');
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(raw);
  });
}
test('atlas navigation follows the filtered order and view preferences survive reload without record changes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed(page);
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
  const canvas = page.locator('#universe'),
    raw = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await page.locator('#collection-btn').click();
  await page.locator('#search-input').fill('A');
  const ids = await page.locator('.collection-item').evaluateAll((rows) => rows.map((row) => row.dataset.recordId));
  const titles = await page.locator('.collection-copy strong').allTextContents();
  expect(ids.length).toBeGreaterThan(1);
  await page.locator('.collection-item').first().click();
  await page.locator('#next-record').click();
  await expect(page.locator('#detail-word')).toHaveText(titles[1]);
  await expect(page.locator('#detail-atlas-back')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('#scene-controls summary').click();
  await page.locator('#star-paths').selectOption('on');
  await page.locator('#star-labels').selectOption('all');
  await page.locator('#nebula-density').fill('60');
  await page.locator('#nebula-density').dispatchEvent('change');
  await page.locator('#nebula-light').fill('120');
  await page.locator('#nebula-light').dispatchEvent('change');
  await expect(canvas).toHaveAttribute('data-star-paths', 'true');
  expect(Number(await canvas.getAttribute('data-star-path-count'))).toBeLessThanOrEqual(3);
  await page.reload();
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'ready');
  await page.locator('#scene-controls summary').click();
  await expect(page.locator('#star-paths')).toHaveValue('on');
  await expect(page.locator('#star-labels')).toHaveValue('all');
  await expect(page.locator('#nebula-density')).toHaveValue('60');
  await expect(page.locator('#nebula-light')).toHaveValue('120');
  await page.keyboard.press('Escape');
  await page.locator('#enter-nebula').click();
  await page.locator('#scene-controls summary').click();
  await expect(page.locator('#nebula-density')).toBeVisible();
  const bounds = await page.locator('.scene-controls-content').boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(raw);
});
test('missing finite volume falls back to the atlas without exposing a partial scene', async ({ page }) => {
  await seed(page);
  await page.route('**/orion-density-v1.wvz', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-scene-state', 'failed');
  await page.locator('#collection-btn').click();
  await expect(page.locator('.collection-item')).toHaveCount(4);
});
