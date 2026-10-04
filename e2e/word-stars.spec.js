import { expect, test } from '@playwright/test';

test('word-star optics, surface, lateral passage and return use one continuous body', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tests/fixtures/word-star-lab.html');
  const canvas = page.locator('#star-lab');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await page.locator('#far').click();
  await expect(canvas).toHaveAttribute('data-shot', 'far');
  await expect(canvas).toHaveAttribute('data-detail', '0');
  await page.locator('#close').click();
  await expect(canvas).toHaveAttribute('data-shot', 'close');
  await expect(canvas).toHaveAttribute('data-detail', '1');
  await expect.poll(async () => Number(await canvas.getAttribute('data-diameter'))).toBeGreaterThan(400);
  await page.locator('#side').click();
  await expect(canvas).toHaveAttribute('data-shot', 'side');
  await page.locator('#passed').click();
  await expect(canvas).toHaveAttribute('data-shot', 'passed');
  await expect(canvas).toHaveAttribute('data-diameter', '0');
  await page.locator('#focus').click();
  await expect(canvas).toHaveAttribute('data-detail', '1');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  expect(errors).toEqual([]);
});

test('real word records keep their positions through selection, addition, reload and distant LOD', async ({ page }) => {
  const entries = [
    { id: 'steady', x: 31, y: 0, z: 18 },
    { id: 'second', x: 8, y: 12, z: 22 },
  ].map((e) => ({
    ...e,
    galaxyId: 'test-g',
    kind: 'word',
    word: e.id,
    meaning: 'Anlam',
    createdAt: '2026-10-04T09:00:00Z',
  }));
  await page.addInitScript(
    (entries) =>
      !localStorage.getItem('wordverse.universe.v4') &&
      localStorage.setItem(
        'wordverse.universe.v4',
        JSON.stringify({
          version: 4,
          activeGalaxyId: 'test-g',
          galaxies: [
            {
              id: 'test-g',
              name: 'Synthetic',
              language: 'English',
              meaningLanguage: 'tr',
              createdAt: '2026-10-04T09:00:00Z',
            },
          ],
          words: entries,
          events: [],
        }),
      ),
    entries,
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?lang=tr');
  const canvas = page.locator('#universe');
  await expect(canvas).toHaveAttribute('data-word-star-system', 'shared-photosphere-v1');
  const star = page.locator('[data-word-id="steady"]');
  await expect(star).toBeVisible();
  await expect.poll(async () => Number(await star.getAttribute('data-diameter'))).toBeGreaterThan(3);
  const before = await star.boundingBox();
  await star.click();
  await expect(page.locator('#detail-word')).toHaveText('steady');
  await page.locator('#reveal-meaning').click();
  await expect(page.locator('#detail-meaning')).toBeVisible();
  await page.locator('#focus-star').click();
  await expect(canvas).toHaveAttribute('data-focused-word', 'steady');
  await expect.poll(async () => Number(await star.getAttribute('data-diameter'))).toBeGreaterThan(150);
  await page.locator('#universe-mode').click();
  await page.locator('#reset-view').click();
  await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-camera-z')) - 160)).toBeLessThan(3);
  await page.locator('#open-add').click();
  await page.locator('#word-input').fill('third');
  await page.locator('#meaning-input').fill('Üçüncü');
  await page.locator('#word-form button[type="submit"]').click();
  await expect(page.locator('#star-layer .star-hit')).toHaveCount(3);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('wordverse.universe.v4')));
  expect(saved.words.find((e) => e.id === 'steady')).toEqual(entries[0]);
  expect(saved.words.find((e) => e.id === 'second')).toEqual(entries[1]);
  await page.keyboard.press('Escape');
  await page.locator('#home-btn').click();
  await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-camera-z')) - 160)).toBeLessThan(3);
  await expect.poll(async () => Math.abs((await star.boundingBox()).x - before.x)).toBeLessThan(2);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 7000);
  await expect(canvas).toHaveAttribute('data-personal-details', '0');
  await expect(canvas).toHaveAttribute('data-personal-points', '3');
  await expect(canvas).toHaveAttribute('data-background-stars', '0');
  await expect(canvas).toHaveAttribute('data-nebula-field-sources', '0');
  await expect(canvas).toHaveAttribute('data-wheel-speed', '0.75');
  await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-camera-z')) - 160)).toBeLessThan(3);
  await page.mouse.wheel(0, 9000);
  await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-camera-z')) - 160)).toBeLessThan(3);
  await page.reload();
  await expect(page.locator('#star-layer .star-hit')).toHaveCount(3);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('wordverse.universe.v4')))).toEqual(saved);
});
