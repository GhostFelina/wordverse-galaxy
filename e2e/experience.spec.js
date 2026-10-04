import { expect, test } from '@playwright/test';

for (const locale of ['tr', 'en', 'es']) {
  test(`public demo and guest learning stay separate in ${locale}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/?lang=${locale}`);
    await expect(page.locator('#app')).toHaveAttribute('data-experience', 'showcase-demo');
    await expect(page.locator('#showcase-intro')).toBeVisible();
    await expect(page.locator('#star-layer .star-hit')).toHaveCount(0);
    const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    await page.locator('#showcase-explore').click();
    await page.locator('#reset-view').click();
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
    await page.locator('#showcase-guest').click();
    await expect(page.locator('#app')).toHaveAttribute('data-experience', 'guest-personal');
    await expect(page.locator('#showcase-intro')).toBeHidden();
    await expect(page.locator('#star-count')).toHaveText('00');
    for (let i = 0; i < 10; i++) {
      await page.locator('#showcase-preview').click();
      await page.locator('#showcase-guest').click();
    }
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
    expect(errors).toEqual([]);
  });
}

test('existing guest records are immediately usable after session resolution and survive demo preview', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'wordverse.universe.v4',
      JSON.stringify({
        version: 4,
        activeGalaxyId: 'guest-g',
        galaxies: [
          {
            id: 'guest-g',
            name: 'Synthetic home',
            language: 'English',
            meaningLanguage: 'en',
            createdAt: '2026-10-03T12:00:00Z',
          },
        ],
        words: [
          {
            id: 'guest-w',
            galaxyId: 'guest-g',
            word: 'Kept guest',
            meaning: 'Test',
            createdAt: '2026-10-03T12:00:00Z',
            x: 31,
            y: 0,
            z: 18,
          },
          {
            id: 'guest-conjunction',
            galaxyId: 'guest-g',
            kind: 'conjunction',
            planetType: 'earth',
            word: 'Retained conjunction',
            meaning: 'Test',
            createdAt: '2026-10-03T12:00:00Z',
            x: 20,
            y: 4,
            z: 18,
          },
        ],
        events: [],
      }),
    ),
  );
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-experience', 'guest-personal');
  await expect(page.locator('#star-layer .star-hit')).toHaveCount(1);
  await expect(page.locator('#universe')).toHaveAttribute('data-personal-renderer', 'premium-surface');
  await expect(page.locator('#universe')).toHaveAttribute('data-personal-details', '0');
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  expect(JSON.parse(before).words).toHaveLength(2);
  await page.locator('#showcase-preview').click();
  await expect(page.locator('#app')).toHaveAttribute('data-experience', 'showcase-demo');
  await expect(page.locator('#star-layer .star-hit')).toHaveCount(0);
  await page.locator('#showcase-guest').click();
  await expect(page.locator('#star-layer .star-hit')).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
  await page.mouse.move(500, 400);
  await page.mouse.wheel(0, 7000);
  await expect(page.locator('#universe')).toHaveAttribute('data-personal-points', '1');
  await expect(page.locator('#universe')).toHaveAttribute('data-personal-details', '0');
  await page.reload();
  await expect(page.locator('#star-layer .star-hit')).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
});

test('premium production bodies compile and their synthetic fixture never writes storage', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tests/fixtures/upgrade-lab.html');
  await expect(page.locator('canvas')).toHaveAttribute('data-ready', 'true');
  for (const shot of ['star', 'planet', 'gas', 'wide']) {
    await page.locator(`#${shot}`).click();
    await expect(page.locator('canvas')).toHaveAttribute('data-shot', shot);
  }
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(errors).toEqual([]);
});
