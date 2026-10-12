import { expect, test } from '@playwright/test';

async function seed(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() =>
    localStorage.setItem(
      'wordverse.universe.v4',
      JSON.stringify({
        version: 4,
        activeGalaxyId: 'fallback-g',
        galaxies: [
          {
            id: 'fallback-g',
            name: 'Synthetic atlas',
            language: 'English',
            meaningLanguage: 'tr',
            createdAt: '2026-10-01',
          },
        ],
        words: [
          {
            id: 'fallback-w',
            galaxyId: 'fallback-g',
            word: 'Resilience',
            meaning: 'Dayanıklılık',
            kind: 'word',
            x: 31,
            y: 0,
            z: 18,
            createdAt: '2026-10-01',
          },
        ],
        events: [],
      }),
    ),
  );
}

test('desktop atlas, details and short recall remain available when the universe cannot initialize', async ({
  page,
}) => {
  await seed(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      return this.id === 'universe' ? null : original.apply(this, args);
    };
  });
  await page.goto('/?lang=tr');
  await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');
  await expect(page.locator('#app')).toHaveAttribute('data-graphics', 'unavailable');
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await expect(page.locator('.graphics-fallback')).toBeVisible();
  await expect(page.locator('#hero-explore')).toBeDisabled();
  await page.screenshot({ path: 'docs/handoff/evidence/2026-10-12-graphics-fallback-1440.png' });
  await page.locator('#graphics-open-atlas').click();
  await expect(page.locator('.collection-item')).toHaveCount(1);
  await page.locator('.collection-item').click();
  await expect(page.locator('#detail-word')).toHaveText('Resilience');
  await expect(page.locator('#focus-star')).toBeDisabled();
  await page.locator('#reveal-meaning').click();
  await expect(page.locator('#detail-meaning')).toHaveText('Dayanıklılık');
  await page.locator('#detail-atlas-back').click();
  await page.locator('#open-recall').click();
  await expect(page.locator('.recall-dialog')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
  expect(errors).toEqual([]);
});

test('losing the main graphics context exits immersive safely and restores the scene without record changes', async ({
  page,
}) => {
  await seed(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?lang=en');
  await expect(page.locator('#universe')).toHaveAttribute('data-nebula-ready', 'true');
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await page.locator('#hero-explore').click();
  await expect(page.locator('#app')).toHaveClass(/immersive/);
  await page.evaluate(() => {
    window.mainContextExtension = document
      .querySelector('#universe')
      .getContext('webgl2')
      .getExtension('WEBGL_lose_context');
    window.mainContextExtension.loseContext();
  });
  await expect(page.locator('#app')).toHaveAttribute('data-graphics', 'unavailable');
  await expect(page.locator('#app')).not.toHaveClass(/immersive/);
  await page.locator('#graphics-open-atlas').click();
  await expect(page.locator('.collection-item')).toHaveCount(1);
  await page.locator('#close-collection').click();
  await page.evaluate(() => window.mainContextExtension.restoreContext());
  await expect(page.locator('#app')).toHaveAttribute('data-graphics', 'ready');
  await expect(page.locator('.graphics-fallback')).toBeHidden();
  await expect(page.locator('#hero-explore')).toBeEnabled();
  await page.locator('.star-hit').click();
  await expect(page.locator('#detail-word')).toHaveText('Resilience');
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
  expect(errors).toEqual([]);
});
