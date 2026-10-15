import { expect, test } from '@playwright/test';

test('owner and galaxy transitions erase an open recall session; same-owner refresh preserves it', async ({ page }) => {
  await page.goto('/tests/fixtures/recall-lab.html');
  await page.locator('#open-recall').click();
  await page.locator('#recall-reveal').click();
  // Simulate an asynchronous identity notification while the native modal is open.
  await page.evaluate(() => document.querySelector('#same-owner').click());
  await expect(page.locator('#recall-dialog')).toBeVisible();
  await expect(page.locator('.recall-meaning')).toHaveText('Owner A meaning');
  await page.evaluate(() => document.querySelector('#different-owner').click());
  await expect(page.locator('#recall-dialog')).toBeHidden();
  await expect(page.locator('#recall-dialog')).toBeEmpty();
  await page.locator('#open-recall').click();
  await page.evaluate(() => document.querySelector('#different-galaxy').click());
  await expect(page.locator('#recall-dialog')).toBeHidden();
  await expect(page.locator('#recall-dialog')).toBeEmpty();
});

for (const [width, locale] of [
  [1440, 'tr'],
  [768, 'en'],
  [390, 'es'],
]) {
  test(`short recall reveals, rates and retries without changing records at ${width}/${locale}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      localStorage.setItem(
        'wordverse.universe.v4',
        JSON.stringify({
          version: 4,
          activeGalaxyId: 'recall-g',
          events: [],
          galaxies: [
            {
              id: 'recall-g',
              name: 'Recall fixture',
              language: 'English',
              meaningLanguage: 'en',
              createdAt: '2026-10-04T09:00:00Z',
            },
          ],
          words: [
            {
              id: 'a',
              galaxyId: 'recall-g',
              word: 'Continuity',
              meaning: 'Hidden answer A',
              example: 'A continuous journey.',
              x: 31,
              y: 0,
              z: 18,
              createdAt: '2026-10-04T09:00:00Z',
            },
            {
              id: 'b',
              galaxyId: 'recall-g',
              word: '<img src=x onerror=alert(1)>',
              meaning: 'Hidden answer B',
              x: 12,
              y: 4,
              z: 18,
              createdAt: '2026-10-04T09:00:00Z',
            },
            {
              id: 'other-galaxy',
              galaxyId: 'other-g',
              word: 'Excluded',
              meaning: 'Not in this galaxy',
              createdAt: '2026-10-04T09:00:00Z',
            },
          ],
        }),
      );
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/?lang=${locale}`);
    await expect(page.locator('#app')).toHaveAttribute('data-experience', 'guest-personal');
    const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    await page.locator('#collection-btn').click();
    await page.locator('#open-recall').click();
    const dialog = page.locator('#recall-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('progress')).toHaveAttribute('max', '2');
    await expect(dialog.locator('progress')).toHaveAttribute('value', '0');
    await expect(dialog.locator('.recall-progress')).toHaveText(
      '0 / 2 ' + { tr: 'tamamlandı', en: 'completed', es: 'completadas' }[locale],
    );
    await expect(dialog.locator('.recall-meaning')).toHaveCount(0);
    const first = await dialog.locator('#recall-word').textContent();
    await page.locator('#recall-reveal').click();
    await expect(dialog.locator('.recall-meaning')).toContainText('Hidden answer');
    await expect(dialog.locator('img')).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath(`2026-10-12-recall-${width}-${locale}.png`) });
    await page.locator('#recall-again').click();
    await expect(dialog.locator('progress')).toHaveAttribute('value', '1');
    await expect(dialog.locator('#recall-word')).not.toHaveText(first);
    await expect(dialog.locator('.recall-meaning')).toHaveCount(0);
    await page.locator('#recall-reveal').click();
    await page.locator('#recall-remembered').click();
    await expect(page.locator('#recall-retry')).toBeVisible();
    await page.locator('#recall-retry').click();
    await expect(dialog.locator('#recall-word')).toHaveText(first);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(dialog).toBeEmpty();
    await expect(page.locator('#collection-btn')).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
    await page.reload();
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
    expect(errors).toEqual([]);
  });
}
