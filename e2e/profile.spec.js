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
        { id: 's', name: 'Second', language: locale === 'en' ? 'constructor' : 'Spanish' },
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
      await expect(profile.locator('.profile-totals:not(.profile-review-totals) dd')).toHaveText(['1', '1', '2']);
      await expect(profile.locator('.profile-review-totals dd')).toHaveText(['0', '—', '0', '0']);
      await expect(profile.locator('.profile-recent')).toContainText('porque');
      if (locale === 'en') await expect(profile.locator('.profile-languages')).toContainText('constructor');
      await expect(profile).toContainText('<img src=x onerror=alert(1)>');
      await expect(profile.locator('img')).toHaveCount(0);
      expect(await profile.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
      expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
      await profile.getByRole('button', { name: labels[locale][1] }).click();
      await expect(profile).not.toBeVisible();
    }
  });
}

test('profile shows review history, recall rate and the due forecast without changing records', async ({ page }) => {
  const seed = {
    version: 4,
    activeGalaxyId: 'g',
    galaxies: [{ id: 'g', name: 'Test galaxy', language: 'English' }],
    words: ['a', 'b', 'c'].map((id) => ({
      id,
      galaxyId: 'g',
      word: `word ${id}`,
      meaning: 'm',
      createdAt: '2026-10-01T12:00:00Z',
    })),
    events: [],
  };
  await page.addInitScript((value) => {
    const day = (offset) => {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    const at = (days) => new Date(Date.now() + days * 86_400_000).toISOString();
    const card = (due, stability) => ({
      due,
      lastReview: at(-1),
      stability,
      difficulty: 5,
      reps: 2,
      lapses: 0,
      state: 'review',
    });
    localStorage.setItem('wordverse.universe.v4', JSON.stringify(value));
    localStorage.setItem(
      'wordverse.reviews.v1:guest-personal:guest',
      JSON.stringify({
        version: 1,
        cards: { a: card(at(-2), 3), b: card(at(2.5), 30), c: card(at(40), 60), deleted: card(at(1), 3) },
        days: { [day(0)]: { reviewed: 6, again: 1, learned: 2 }, [day(-1)]: { reviewed: 4, again: 1, learned: 1 } },
      }),
    );
  }, seed);
  await page.goto('/?lang=en');
  await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await page.locator('#open-account').click();
  await page.locator('#account-dialog').getByRole('button', { name: 'Profile and statistics', exact: true }).click();
  const profile = page.locator('#profile-dialog');
  await expect(profile.locator('.profile-review-totals dd')).toHaveText(['10', '80%', '2', '2']);
  await expect(profile.locator('.profile-history li')).toHaveCount(30);
  await expect(profile.locator('.profile-history li').last()).toHaveAttribute('aria-label', /: 6 reviews$/);
  const forecast = profile.locator('.profile-forecast strong');
  await expect(forecast).toHaveCount(7);
  // The overdue word counts today; the deleted word and the 40-day word are excluded.
  await expect(forecast.first()).toHaveText('1');
  expect((await forecast.allTextContents()).map(Number).reduce((sum, value) => sum + value, 0)).toBe(2);
  await expect(profile.locator('.profile-forecast li').first()).toContainText('Today');
  await profile.evaluate((node) => node.scrollTo(0, node.scrollHeight));
  await profile.screenshot({ path: test.info().outputPath('2026-11-01-profile-review.png') });
  expect(await profile.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
});
