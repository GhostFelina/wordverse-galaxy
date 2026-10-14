import { expect, test } from '@playwright/test';

async function seed(page, { empty = false } = {}) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(
    ({ empty }) => {
      localStorage.setItem(
        'wordverse.universe.v4',
        JSON.stringify({
          version: 4,
          activeGalaxyId: 'learning-g',
          events: [],
          galaxies: [
            {
              id: 'learning-g',
              name: 'Learning fixture',
              language: 'English',
              meaningLanguage: 'en',
              createdAt: '2026-10-14T09:00:00Z',
            },
          ],
          words: empty
            ? []
            : [
                {
                  id: 'learning-w',
                  galaxyId: 'learning-g',
                  kind: 'word',
                  word: 'Continuity',
                  meaning: 'An uninterrupted connection',
                  x: 31,
                  y: 0,
                  z: 18,
                  createdAt: '2026-10-14T09:00:00Z',
                },
              ],
        }),
      );
    },
    { empty },
  );
}

for (const [locale, width, label] of [
  ['tr', 1440, 'Kısa tekrar yap'],
  ['en', 1024, 'Practice my words'],
  ['es', 390, 'Repasar mis palabras'],
]) {
  test(`home recall is discoverable, conceals answers and returns focus at ${width}/${locale}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await seed(page);
    await page.goto(`/?lang=${locale}`);
    const trigger = page.locator('#home-recall');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveText(label);
    const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    await trigger.click();
    await expect(page.locator('#recall-dialog')).toBeVisible();
    await expect(page.locator('.recall-meaning')).toHaveCount(0);
    await page.locator('#recall-reveal').click();
    await expect(page.locator('.recall-meaning')).toHaveText('An uninterrupted connection');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
  });
}

test('atlas shortcut and modal focus cycle preserve form input and return to the opener', async ({ page }) => {
  await seed(page);
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');
  await page.locator('#collection-btn').click();
  await expect(page.locator('#search-input')).toBeFocused();
  await page.locator('#collection-add').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#close-collection')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#collection-add')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#collection-btn')).toBeFocused();
  await page.keyboard.press('Control+k');
  await expect(page.locator('#search-input')).toBeFocused();
  await page.locator('#search-input').fill('/');
  await page.keyboard.press('Control+k');
  await expect(page.locator('#search-input')).toBeFocused();
  await expect(page.locator('#search-input')).toHaveValue('/');
  await page.keyboard.press('/');
  await expect(page.locator('#search-input')).toHaveValue('//');
  await page.keyboard.press('Escape');
  await page.locator('#open-add').click();
  await expect(page.locator('#word-input')).toBeFocused();
  await page.locator('#word-input').fill('Draft word');
  await page.keyboard.press('Control+k');
  await expect(page.locator('#add-panel')).toHaveClass(/open/);
  await expect(page.locator('#word-input')).toHaveValue('Draft word');
  await page.keyboard.press('Escape');
  await expect(page.locator('#open-add')).toBeFocused();
  await page.locator('#open-add').click();
  // Closing before the scheduled autofocus must not pull focus into a hidden panel.
  await page.keyboard.press('Escape');
  await expect(page.locator('#open-add')).toBeFocused();
  await page.waitForTimeout(450);
  await expect(page.locator('#open-add')).toBeFocused();
});

test('first visit and an empty guest sky hide the home recall action', async ({ page }) => {
  await seed(page, { empty: true });
  await page.goto('/?lang=en');
  await expect(page.locator('#showcase-intro')).toBeVisible();
  await expect(page.locator('#home-recall')).toBeHidden();
  await page.locator('#showcase-guest').click();
  await expect(page.locator('#hero-add')).toBeVisible();
  await expect(page.locator('#home-recall')).toBeHidden();
});
