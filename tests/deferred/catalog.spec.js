import { expect, test } from '@playwright/test';

// Each viewport has its own 30s budget: CI uses software WebGL.
for (const locale of ['tr', 'en', 'es']) {
  for (const width of [1440, 768, 390]) {
    test(`catalog exploration preserves the universe in ${locale} at ${width}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({
        colorScheme: width === 768 ? 'light' : 'dark',
        reducedMotion: width === 390 ? 'reduce' : 'no-preference',
      });
      await page.goto(`/?lang=${locale}`);
      await expect(page.locator('#open-catalog')).toBeVisible();
      const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
      await page.locator('#open-catalog').click();
      const dialog = page.locator('#catalog-dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('.catalog-card')).toHaveCount(5);
      await expect(dialog.getByRole('link')).toHaveCount(6);
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await dialog.locator('[data-catalog-id="M51"]').click();
      await expect(dialog).not.toBeVisible();
      await expect(page.locator('#catalog-view')).toContainText('M51');
      await expect(page.locator('#app')).toHaveClass(/catalog-exploring/);
      await page.locator('#catalog-view button').click();
      await expect(page.locator('#catalog-view')).not.toBeVisible();
      await expect(page.locator('#app')).not.toHaveClass(/catalog-exploring/);
      await page.locator('#open-catalog').click();
      await page.locator('#catalog-overview').click();
      await expect(page.locator('#catalog-visible-count')).toHaveAttribute('data-count', '300');
      await page.mouse.move(width / 2, 450);
      await page.mouse.wheel(0, 5000);
      await expect(page.locator('#catalog-visible-count')).toHaveAttribute('data-count', '0');
      await page.locator('#open-catalog').click();
      await page.locator('#catalog-search').fill('NGC0224');
      await expect(page.locator('.catalog-results li')).toHaveCount(1);
      await page.locator('.catalog-results [data-catalog-id="M31"]').click();
      await expect(page.locator('#catalog-view')).toContainText('M31');
      for (let step = 0; step < 6; step++) await page.locator('#zoom-in').click();
      await expect(page.locator('#universe')).toBeVisible();
      await page.locator('#catalog-view button').click();
      await page.locator('#open-catalog').click();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}
