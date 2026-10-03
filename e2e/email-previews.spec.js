import { expect, test } from '@playwright/test';

for (const locale of ['tr', 'en', 'es']) {
  test(`email confirmation and recovery previews are readable in ${locale}`, async ({ page }) => {
    for (const type of ['confirmation', 'recovery']) {
      for (const width of [1440, 768, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/tests/fixtures/emails/${type}-${locale}.html`);
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const links = page.getByRole('link');
        await expect(links).toHaveCount(2);
        for (const link of await links.all())
          await expect(link).toHaveAttribute('href', 'https://example.test/auth/verify');
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
        await expect(page.locator('body')).not.toContainText('{{');
        // Vite injects its dev client; the generated email itself has no script.
        await expect(page.locator('img,script:not([src="/@vite/client"])')).toHaveCount(0);
      }
    }
  });
}
