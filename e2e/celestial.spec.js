import { expect, test } from '@playwright/test';

for (const locale of ['tr', 'en', 'es'])
  for (const width of [1440, 390]) {
    test(`nebula catalog and travel in ${locale} at ${width}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await page.setViewportSize({ width, height: 900 });
      // Archived layers stay testable in an isolated lab; the product is Orion-only.
      await page.goto(`/tests/fixtures/celestial-lab.html?lang=${locale}`);
      const canvas = page.locator('#universe');
      await expect(canvas).toHaveAttribute('data-nebulae', '200');
      const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
      await page.locator('#open-catalog').click();
      await expect(page.locator('#celestial-count')).toHaveAttribute('data-count', '200');
      await expect(page.locator('.celestial-results li')).toHaveCount(12);
      await page.locator('#catalog-search').fill('M42');
      await expect(page.locator('[data-catalog-id="NGC1976"]')).toBeVisible();
      await expect(page.locator('.celestial-results a')).toHaveAttribute('href', /OpenNGC/);
      await page.locator('[data-catalog-id="NGC1976"]').click();
      await expect(page.locator('#catalog-dialog')).not.toBeVisible();
      await expect(page.locator('#catalog-view')).toBeVisible();
      await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-camera-z')) - 30)).toBeLessThan(3);
      await page.locator('#catalog-view button').click();
      await expect(page.locator('#catalog-view')).not.toBeVisible();
      await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-camera-z')) - 160)).toBeLessThan(3);
      expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
