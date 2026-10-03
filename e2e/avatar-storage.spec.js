import { expect, test } from '@playwright/test';

test('avatar SDK fixture uploads, upserts, downloads and removes only its in-memory object', async ({ page }) => {
  const external = [];
  page.on('request', (request) => {
    if (
      new URL(request.url()).hostname.endsWith('.supabase.co') ||
      new URL(request.url()).hostname === 'avatar-storage.test'
    )
      external.push(request.url());
  });
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({
      colorScheme: width === 768 ? 'light' : 'dark',
      reducedMotion: width === 390 ? 'reduce' : 'no-preference',
    });
    await page.goto('/tests/fixtures/avatar-lab.html');
    await page.getByRole('button', { name: 'Yükleme, değiştirme ve kaldırmayı doğrula' }).click();
    await expect(page.getByRole('status')).toHaveText('İstemci kontrolü geçti · gerçek Storage kabulü bekliyor');
    await expect(page.locator('#steps li')).toHaveCount(6);
    await expect(page.getByAltText('İndirilen örnek avatar')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Yükleme, değiştirme ve kaldırmayı doğrula' }).click();
    await expect(page.getByRole('status')).toHaveText('İstemci kontrolü geçti · gerçek Storage kabulü bekliyor');
    await expect(page.locator('#steps li')).toHaveCount(6);
  }
  expect(external).toEqual([]);
});
