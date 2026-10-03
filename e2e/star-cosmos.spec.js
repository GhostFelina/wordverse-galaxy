import { expect, test } from '@playwright/test';

for (const locale of ['tr', 'en', 'es']) {
  for (const width of [1440, 768, 390]) {
    test(`single star cosmos in ${locale} at ${width}`, async ({ page }) => {
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
      const canvas = page.locator('#universe');
      await expect(canvas)
        .toHaveAttribute('data-scene-mode', 'layered-cosmos')
        .catch((error) => {
          throw new Error(`${error.message}\nConsole: ${JSON.stringify(errors)}`);
        });
      expect(Number(await canvas.getAttribute('data-star-capacity'))).toBeGreaterThan(5000);
      await expect(page.locator('#open-catalog')).toBeVisible();
      expect(await page.locator('#catalog-dialog').count()).toBe(1);
      const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
      await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeGreaterThan(100);
      await page.locator('#universe-mode').click();
      await page.mouse.move(width / 2, 450);
      await page.mouse.wheel(0, -600);
      await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeLessThan(90);
      await page.mouse.move(width / 2, 450);
      await page.mouse.down();
      await page.mouse.move(width / 2 + 70, 500, { steps: 4 });
      await page.mouse.up();
      await page.mouse.wheel(0, 7000);
      await expect.poll(async () => Number(await canvas.getAttribute('data-camera-z'))).toBeGreaterThan(45000);
      await page.locator('#universe-mode').click();
      await page.locator('#reset-view').click();
      await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-camera-z')) - 160)).toBeLessThan(3);
      expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
      expect(errors).toEqual([]);
    });
  }
}
