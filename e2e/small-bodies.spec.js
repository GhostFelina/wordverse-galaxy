import { expect, test } from '@playwright/test';
import asteroids from '../src/data/catalog/asteroids-1000.json' with { type: 'json' };
import { asteroidPosition } from '../src/asteroid-orbit.js';
for (const locale of ['tr', 'en', 'es'])
  for (const width of [1440, 390]) {
    test(`asteroid and historical meteor exploration in ${locale} at ${width}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/?lang=${locale}`);
      const canvas = page.locator('#universe');
      await expect(canvas).toHaveAttribute('data-asteroids', '1000');
      await expect(canvas).toHaveAttribute('data-fireballs', '1000');
      const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
      await page.locator('#open-catalog').click();
      await page.locator('[data-catalog-type="asteroids"]').click();
      await expect(page.locator('#celestial-count')).toHaveAttribute('data-count', '1000');
      await page.locator('#catalog-search').fill('Vesta');
      await expect(page.locator('.celestial-results a')).toHaveAttribute('href', /sbdb_lookup/);
      await page.locator('[data-catalog-id="20000004"]').click();
      const expected = asteroidPosition(asteroids.find((r) => r.name === 'Vesta'))[2] + 35;
      await expect
        .poll(async () => Math.abs(Number(await canvas.getAttribute('data-camera-z')) - expected))
        .toBeLessThan(3);
      await page.locator('#open-catalog').click();
      await page.locator('[data-catalog-type="fireballs"]').click();
      await expect(page.locator('#celestial-count')).toHaveAttribute('data-count', '1000');
      await page.locator('#catalog-search').fill('2026-09-15');
      await expect(page.locator('.celestial-results')).toContainText('UTC');
      await page.locator('.celestial-results button').click();
      await expect(page.locator('#catalog-view')).toBeVisible();
      await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-camera-z')) + 465)).toBeLessThan(3);
      await page.locator('#reset-view').click();
      await expect(page.locator('#catalog-view')).not.toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
      expect(errors).toEqual([]);
    });
  }
