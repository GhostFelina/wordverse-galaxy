import { expect, test } from '@playwright/test';

test('the built app is installable and reopens offline with local records', async ({ page, context }) => {
  const words = [
    {
      id: 'a',
      galaxyId: 'g',
      word: 'Offline star',
      meaning: 'm',
      x: 31,
      y: 0,
      z: 18,
      createdAt: '2026-10-04T09:00:00Z',
    },
  ];
  await page.addInitScript(
    (value) => {
      if (!localStorage.getItem('wordverse.universe.v4')) localStorage.setItem('wordverse.universe.v4', value);
    },
    JSON.stringify({
      version: 4,
      activeGalaxyId: 'g',
      events: [],
      galaxies: [
        {
          id: 'g',
          name: 'Offline galaxy',
          language: 'English',
          meaningLanguage: 'en',
          createdAt: '2026-10-04T09:00:00Z',
        },
      ],
      words,
    }),
  );
  await page.goto('/?lang=en');
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await page.request.get(manifestHref)).json();
  expect(manifest).toMatchObject({ name: 'Wordverse', display: 'standalone', start_url: '/' });
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512', '512x512']);
  for (const icon of manifest.icons)
    expect((await page.request.get(icon.src)).headers()['content-type']).toContain('image/png');

  await expect
    .poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state))
    .toBe('activated');
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#app')).toHaveAttribute('data-content-ready', 'true');
  await page.locator('#collection-btn').click();
  await expect(page.locator('.collection-item')).toContainText('Offline star');
  await context.setOffline(false);
});
