import { expect, test } from '@playwright/test';

test('sign-in error stays local and preserves the guest universe', async ({ page }) => {
  await page.route('https://wordverse-auth.test/**', (route) =>
    route.fulfill({
      status: 400,
      headers: {
        'X-Supabase-Api-Version': '2024-01-01',
        'Access-Control-Expose-Headers': 'X-Supabase-Api-Version',
      },
      contentType: 'application/json',
      body: JSON.stringify({ code: 'invalid_credentials', message: 'Invalid login credentials' }),
    }),
  );
  await page.goto('/?lang=tr');
  await page.locator('#open-account').click();
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  const dialog = page.locator('#account-dialog');
  await dialog.getByLabel('E-posta', { exact: true }).fill('isolated@example.test');
  await dialog.getByLabel('Şifre', { exact: true }).fill('test-only-password');
  await dialog.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('E-posta veya şifre doğrulanamadı.');
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
});

test('mocked sign-in and local sign-out leave guest records intact', async ({ page }) => {
  const user = { id: '11111111-1111-4111-8111-111111111111', email: 'isolated@example.test', aud: 'authenticated' };
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const token = [
    Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'),
    Buffer.from(JSON.stringify({ sub: user.id, exp: expiresAt })).toString('base64url'),
    'test-signature',
  ].join('.');
  await page.route('https://wordverse-auth.test/**', (route) => {
    if (route.request().url().includes('/logout')) return route.fulfill({ status: 204 });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: token,
        refresh_token: 'test-only-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: expiresAt,
        user,
      }),
    });
  });
  await page.goto('/?lang=en');
  await page.locator('#open-account').click();
  const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  const dialog = page.locator('#account-dialog');
  await dialog.getByLabel('Email', { exact: true }).fill(user.email);
  await dialog.getByLabel('Password', { exact: true }).fill('test-only-password');
  await dialog.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(dialog).toHaveAccessibleName('Your account');
  await expect(dialog).toContainText(user.email);
  await dialog.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(dialog).toHaveAccessibleName('Sign in');
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
});

for (const [locale, signin, signup, reset, email, password, guest] of [
  ['tr', 'Giriş yap', 'Hesap oluştur', 'Şifreni sıfırla', 'E-posta', 'Şifre', 'Misafir olarak devam et'],
  ['en', 'Sign in', 'Create account', 'Reset your password', 'Email', 'Password', 'Continue as a guest'],
  [
    'es',
    'Iniciar sesión',
    'Crear cuenta',
    'Restablece tu contraseña',
    'Correo electrónico',
    'Contraseña',
    'Continuar como invitado',
  ],
]) {
  test(`account views are accessible in ${locale} and preserve guest data`, async ({ page }) => {
    await page.goto(`/?lang=${locale}`);
    await page.locator('#open-account').waitFor();
    const before = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
    await page.locator('#open-account').click();
    const dialog = page.locator('#account-dialog');
    await expect(dialog).toHaveAccessibleName(signin);
    await expect(dialog.getByLabel(email, { exact: true })).toBeFocused();
    await dialog.getByLabel(password, { exact: true }).fill('one');
    await page.keyboard.type('/two');
    await expect(dialog.getByLabel(password, { exact: true })).toHaveValue('one/two');
    await dialog.getByRole('button', { name: signup, exact: true }).click();
    await expect(dialog).toHaveAccessibleName(signup);
    await expect(dialog.getByLabel(password, { exact: true })).toHaveAttribute('minlength', '8');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await page.locator('#open-account').click();
    await dialog.locator('.auth-link').first().click();
    await expect(dialog).toHaveAccessibleName(signin);
    await dialog.locator('.auth-link').first().click();
    await expect(dialog).toHaveAccessibleName(reset);
    await expect(dialog.locator('input[type=password]')).toHaveCount(0);
    await dialog.getByRole('button', { name: guest, exact: true }).click();
    await expect(dialog).not.toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(before);
  });
}

for (const [locale, privacy, terms] of [
  ['tr', 'Gizlilik', 'Kullanım koşulları'],
  ['en', 'Privacy', 'Terms of use'],
  ['es', 'Privacidad', 'Condiciones de uso'],
]) {
  test(`legal pages remain readable without JavaScript in ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const prefix = locale === 'tr' ? '' : `/${locale}`;
    for (const [kind, title] of [
      ['privacy', privacy],
      ['terms', terms],
    ]) {
      await page.goto(`${test.info().project.use.baseURL}${prefix}/${kind}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        `https://wordverse-galaxy.vercel.app${prefix}/${kind}`,
      );
      await expect(page.locator('link[hreflang]')).toHaveCount(4);
    }
    await context.close();
  });
}

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

test('IndexedDB primary restores a guest word when the localStorage copy is missing', async ({ page }) => {
  await page.goto('/?lang=tr');
  await page.locator('#open-add').click();
  await page.locator('#word-input').fill('orbit');
  await page.locator('#meaning-input').fill('yörünge');
  await page.locator('#submit-word').click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          new Promise((resolve) => {
            const request = indexedDB.open('wordverse-offline');
            request.onsuccess = () => {
              const database = request.result;
              const read = database.transaction('state', 'readonly').objectStore('state').get('universe');
              read.onsuccess = () => {
                resolve(read.result?.universe?.words?.some((word) => word.word === 'orbit') ?? false);
                database.close();
              };
              read.onerror = () => {
                resolve(false);
                database.close();
              };
            };
            request.onerror = () => resolve(false);
          }),
      ),
    )
    .toBe(true);
  await page.evaluate(() => localStorage.removeItem('wordverse.universe.v4'));
  await page.reload();
  await page.locator('#collection-btn').click();
  await expect(page.locator('#collection-list')).toContainText('orbit');
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
