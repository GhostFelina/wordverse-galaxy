import { expect, test } from '@playwright/test';

const labels = {
  en: ['Profile and statistics', 'Close profile'],
  tr: ['Profil ve istatistikler', 'Profili kapat'],
  es: ['Perfil y estad\u00edsticas', 'Cerrar perfil'],
};
for (const locale of ['tr', 'en', 'es']) {
  test(`current universe profile is readable and preserves guest data in ${locale}`, async ({ page }) => {
    const seed = {
      version: 4,
      activeGalaxyId: 'g',
      galaxies: [
        { id: 'g', name: 'Test galaxy', language: 'English' },
        { id: 's', name: 'Second', language: 'Spanish' },
      ],
      words: [
        {
          id: 'w',
          galaxyId: 'g',
          word: '<img src=x onerror=alert(1)>',
          meaning: 'safe text',
          kind: 'word',
          createdAt: '2026-10-01T12:00:00Z',
        },
        {
          id: 'p',
          galaxyId: 's',
          word: 'porque',
          meaning: 'because',
          kind: 'conjunction',
          createdAt: '2026-10-02T12:00:00Z',
        },
      ],
      events: [],
    };
    await page.addInitScript((value) => localStorage.setItem('wordverse.universe.v4', JSON.stringify(value)), seed);
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({
        colorScheme: width === 768 ? 'light' : 'dark',
        reducedMotion: width === 390 ? 'reduce' : 'no-preference',
      });
      await page.goto(`/?lang=${locale}`);
      await page.locator('#open-account').click();
      const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
      await page.locator('#account-dialog').getByRole('button', { name: labels[locale][0], exact: true }).click();
      const profile = page.locator('#profile-dialog');
      await expect(profile).toBeVisible();
      await expect(profile.locator('dd')).toHaveText(['1', '1', '2']);
      await expect(profile.locator('.profile-recent')).toContainText('porque');
      await expect(profile).toContainText('<img src=x onerror=alert(1)>');
      await expect(profile.locator('img')).toHaveCount(0);
      expect(await profile.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
      expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
      await profile.getByRole('button', { name: labels[locale][1] }).click();
      await expect(profile).not.toBeVisible();
    }
  });
}
