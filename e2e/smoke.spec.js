import { expect, test } from '@playwright/test';

test('guest can add a word and retain it after reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('#open-add').click();
  await page.locator('#word-input').fill('luminous');
  await page.locator('#meaning-input').fill('ışık saçan');
  await page.locator('#submit-word').click();
  await expect(page.locator('#star-count')).toHaveText('01');
  await page.reload();
  await expect(page.locator('#star-count')).toHaveText('01');
  await page.locator('#collection-btn').click();
  await expect(page.locator('#collection-list')).toContainText('luminous');
});

test('about page opens', async ({ page }) => {
  await page.goto('/about.html');
  await expect(page).toHaveTitle(/Wordverse/);
});

for (const [locale, heading, question] of [
  ['tr', 'Nasıl çalışır?', 'Kelimelerim nerede saklanıyor?'],
  ['en', 'How does it work?', 'Where are my words stored?'],
  ['es', '¿Cómo funciona?', '¿Dónde se guardan mis palabras?'],
]) {
  test(`about content, metadata and FAQ are localized in ${locale}`, async ({ page }) => {
    await page.goto(`/about.html?lang=${locale}`);
    await expect(page.locator('#how')).toHaveText(heading);
    await expect(page.locator('section[aria-labelledby="questions"] h3').first()).toHaveText(question);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute('href', /\/es\/about\.html$/);
    const faq = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(faq).mainEntity[0].name).toBe(question);
    expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();
  });
}

for (const [locale, heading] of [
  ['tr', 'Her kelime,'],
  ['en', 'Every word,'],
  ['es', 'Cada palabra,'],
]) {
  test(`home hero and metadata are localized in ${locale}`, async ({ page }) => {
    await page.goto(`/?lang=${locale}`);
    await expect(page.locator('.hero h1')).toContainText(heading);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('.about-link')).toHaveAttribute(
      'href',
      locale === 'tr' ? '/about.html' : `/${locale}/about.html`,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      locale === 'tr' ? 'https://wordverse-galaxy.vercel.app/' : `https://wordverse-galaxy.vercel.app/${locale}/`,
    );
  });
}

test('language picker changes the whole page and keeps the choice', async ({ page }) => {
  await page.goto('/?lang=tr');
  await page.locator('#ui-language').selectOption('es');
  await expect(page).toHaveURL(/\/es\/$/);
  await expect(page.locator('.hero h1')).toContainText('Cada palabra,');
  await page.locator('#open-add').click();
  await expect(page.locator('#form-title')).toContainText('estrella.');
  await expect(page.locator('#submit-word')).toContainText('Añadir estrella al universo');
  await page.locator('#close-add').click();
  await page.locator('#collection-btn').click();
  await expect(page.locator('#collection-title')).toContainText('Mis palabras');
  await page.reload();
  await expect(page.locator('#ui-language')).toHaveValue('es');
});

test('about language picker follows localized paths', async ({ page }) => {
  await page.goto('/en/about.html');
  await expect(page.locator('#how')).toHaveText('How does it work?');
  await page.locator('#ui-language').selectOption('es');
  await expect(page).toHaveURL(/\/es\/about\.html$/);
  await expect(page.locator('#how')).toHaveText('¿Cómo funciona?');
  await expect(page.locator('#ui-language')).toHaveValue('es');
});

for (const [locale, formTitle, collectionTitle, galaxyTitle] of [
  ['tr', 'Yeni bir yıldız', 'Kelimelerim', 'Galaksilerim'],
  ['en', 'A new star', 'My words', 'My galaxies'],
  ['es', 'Nace una', 'Mis palabras', 'Mis galaxias'],
]) {
  test(`add, detail, collection and galaxy screens work in ${locale}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/?lang=${locale}`);
    await page.locator('#open-add').click();
    await expect(page.locator('#form-title')).toContainText(formTitle);
    await page.locator('#word-input').fill('luminous');
    await page.locator('#meaning-input').fill('parlak');
    await page.locator('#submit-word').click();
    await expect(page.locator('#detail-word')).toHaveText('luminous');
    await page.locator('#reveal-meaning').click();
    await expect(page.locator('#detail-meaning')).toBeVisible();
    await page.locator('#close-detail').click();
    await page.keyboard.press('/');
    await expect(page.locator('#collection-title')).toContainText(collectionTitle);
    await expect(page.locator('.collection-item')).toHaveCount(1);
    await page.locator('#close-collection').click();
    await page.locator('#galaxy-switch').click();
    await expect(page.locator('#galaxy-panel-title')).toContainText(galaxyTitle);
    expect(errors).toEqual([]);
  });
}

test('v3 data migrates to v4 without replacing its original record', async ({ page }) => {
  const oldState = {
    version: 3,
    galaxies: [{ id: 'galaxy-english', name: 'İngilizce Galaksisi', language: 'İngilizce' }],
    activeGalaxyId: 'galaxy-english',
    words: [
      {
        id: 'old-word',
        galaxyId: 'galaxy-english',
        word: 'eager',
        meaning: 'hevesli',
        createdAt: '2025-01-01T00:00:00.000Z',
        x: 1,
        y: 2,
      },
    ],
    events: [],
  };
  await page.addInitScript((value) => {
    if (!localStorage.getItem('wordverse.universe.v4')) localStorage.setItem('wordverse.universe.v3', value);
  }, JSON.stringify(oldState));
  await page.goto('/');
  await expect(page.locator('#star-count')).toHaveText('01');
  const records = await page.evaluate(() => ({
    old: localStorage.getItem('wordverse.universe.v3'),
    current: JSON.parse(localStorage.getItem('wordverse.universe.v4')),
    schema: localStorage.getItem('wordverse.schema.version'),
  }));
  expect(records.old).toBe(JSON.stringify(oldState));
  expect(records.current.version).toBe(4);
  expect(records.current.galaxies[0].meaningLanguage).toBe('tr');
  expect(records.current.words[0].meaning).toBe('hevesli');
  expect(records.schema).toBe('4');
});

test('a galaxy stores its meaning language separately from the learned language', async ({ page }) => {
  await page.goto('/?lang=tr');
  await page.locator('#galaxy-switch').click();
  await page.locator('#meaning-language-current').selectOption('es');
  await expect(page.locator('#galaxy-language')).toHaveText('İngilizce');
  await page.reload();
  await page.locator('#galaxy-switch').click();
  await expect(page.locator('#meaning-language-current')).toHaveValue('es');
  const galaxy = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('wordverse.universe.v4')).galaxies.find((item) => item.id === 'galaxy-english'),
  );
  expect(galaxy.language).toBe('İngilizce');
  expect(galaxy.meaningLanguage).toBe('es');
});
