import { expect, test } from '@playwright/test';

test('a late native account connection closes after a simulated block and retry persists safely', async ({ page }) => {
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({
      colorScheme: width === 768 ? 'light' : 'dark',
      reducedMotion: width === 390 ? 'reduce' : 'no-preference',
    });
    await page.goto('/tests/fixtures/account-storage-lab.html');
    await page.getByRole('button', { name: 'Engellenme ve tekrar denemeyi doğrula' }).click();
    await expect(page.getByRole('status')).toHaveText('4 kontrol geçti · gerçek tarayıcı politikası kabulü bekliyor');
    await expect(page.locator('#steps li')).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
