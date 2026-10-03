import { expect, test } from '@playwright/test';

test('sync indicator and universe view control remain separate on compact screens', async ({ page }) => {
  for (const width of [390, 768, 958]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?lang=tr');
    const sync = page.locator('#sync-status');
    await expect(sync).toBeVisible();
    const first = await sync.boundingBox();
    const second = await page.locator('#universe-mode').boundingBox();
    const overlap =
      first.x < second.x + second.width &&
      first.x + first.width > second.x &&
      first.y < second.y + second.height &&
      first.y + first.height > second.y;
    expect(overlap, `controls overlap at ${width}px`).toBe(false);
    await sync.click();
    await expect(page.locator('#universe-mode')).toHaveAttribute('aria-pressed', 'false');
  }
});

async function setupMockAccount(page, seedCloud = true) {
  const user = { id: '22222222-2222-4222-8222-222222222222', email: 'sync@example.test', aud: 'authenticated' };
  const at = '2026-10-03T06:00:00Z';
  const guest = {
    version: 4,
    activeGalaxyId: 'g',
    galaxies: [{ id: 'g', name: 'Guest galaxy', language: 'English', meaningLanguage: 'en', createdAt: at }],
    words: [{ id: 'w', galaxyId: 'g', word: 'guest star', meaning: 'guest meaning', kind: 'word', createdAt: at }],
    events: [],
  };
  await page.addInitScript((value) => localStorage.setItem('wordverse.universe.v4', JSON.stringify(value)), guest);
  const row = (id, payload, extra = {}) => ({
    user_id: user.id,
    id,
    payload,
    updated_at: at,
    deleted_at: null,
    ...extra,
  });
  const tables = {
    wordverse_galaxies: seedCloud ? [row('g', { ...guest.galaxies[0], name: 'Cloud galaxy' })] : [],
    wordverse_entries: seedCloud ? [row('w', { ...guest.words[0], word: 'cloud star' }, { galaxy_id: 'g' })] : [],
    wordverse_events: [],
    wordverse_settings: [],
  };
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const token = [
    Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'),
    Buffer.from(JSON.stringify({ sub: user.id, exp: expiresAt })).toString('base64url'),
    'test-signature',
  ].join('.');
  let sequence = 0;
  let writes = 0;
  await page.route('https://wordverse-auth.test/**', async (route) => {
    const url = new URL(route.request().url());
    const reply = (body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 });
    if (url.pathname.endsWith('/user')) return reply(user);
    if (url.pathname.includes('/rest/v1/rpc/')) {
      const input = route.request().postDataJSON();
      const records = tables[input.p_table];
      const index = records.findIndex((record) => input.p_table === 'wordverse_settings' || record.id === input.p_id);
      const current = records[index];
      if ((current?.updated_at || null) !== input.p_expected_updated_at)
        return reply({ status: 'conflict', row: current || null });
      writes++;
      const saved = {
        user_id: input.p_owner_id,
        ...(input.p_id ? { id: input.p_id } : {}),
        ...(['wordverse_entries', 'wordverse_events'].includes(input.p_table) ? { galaxy_id: input.p_galaxy_id } : {}),
        payload: input.p_payload,
        deleted_at: input.p_deleted_at,
        updated_at: `2026-10-03T06:05:${String(++sequence).padStart(2, '0')}Z`,
      };
      if (index === -1) records.push(saved);
      else records[index] = saved;
      return reply({ status: 'applied', row: saved });
    }
    if (url.pathname.startsWith('/rest/v1/')) return reply(tables[url.pathname.split('/').at(-1)] || []);
    return reply({
      access_token: token,
      refresh_token: 'test-only-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: expiresAt,
      user,
    });
  });
  return { tables, writes: () => writes };
}

async function signInAndOpenMerge(page) {
  await page.locator('#open-account').click();
  const dialog = page.locator('#account-dialog');
  await dialog.getByLabel('Email', { exact: true }).fill('sync@example.test');
  await dialog.getByLabel('Password', { exact: true }).fill('test-only-password');
  await dialog.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('#sync-status')).toHaveText('Connect universe');
  await dialog.getByRole('button', { name: 'Universe and sync', exact: true }).click();
  await expect(page.locator('#sync-dialog')).toBeVisible();
}

test('first account merge preserves both trees, uploads and restores the untouched guest copy on sign-out', async ({
  page,
}) => {
  const backend = await setupMockAccount(page);
  await page.goto('/?lang=en');
  await page.locator('#open-account').waitFor();
  const guestCopy = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await signInAndOpenMerge(page);
  await page.locator('#sync-dialog').getByRole('button', { name: 'Merge my guest universe' }).click();
  await expect(page.locator('#sync-dialog')).not.toBeVisible();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  expect(backend.writes()).toBeGreaterThan(0);
  expect(backend.tables.wordverse_entries.map((record) => record.payload.word)).toEqual(
    expect.arrayContaining(['guest star', 'cloud star']),
  );
  expect(backend.tables.wordverse_galaxies).toHaveLength(2);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(guestCopy);
  await page.reload();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await expect(page.locator('#galaxy-count')).toHaveText('02');
  await page.locator('#open-account').click();
  await page.locator('#account-dialog').getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('#sync-status')).toHaveText('Guest');
  await expect(page.locator('#galaxy-count')).toHaveText('01');
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(guestCopy);
});

test('cloud-only choice keeps an empty account empty and offers galaxy creation before adding a word', async ({
  page,
}) => {
  const backend = await setupMockAccount(page, false);
  await page.goto('/?lang=en');
  await signInAndOpenMerge(page);
  await page.locator('#sync-dialog').getByRole('button', { name: 'Open only my account universe' }).click();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await expect(page.locator('#galaxy-count')).toHaveText('00');
  expect(backend.tables.wordverse_entries).toEqual([]);
  expect(backend.tables.wordverse_galaxies).toEqual([]);
  await page.locator('#open-add').click();
  await expect(page.locator('#toast')).toHaveText('Create a galaxy first.');
  await expect(page.locator('#galaxy-panel')).toBeVisible();
});

test('account edits persist offline, sync on reconnect and survive reload without changing guest storage', async ({
  page,
  context,
}) => {
  const backend = await setupMockAccount(page);
  await page.goto('/?lang=en');
  await page.locator('#open-account').waitFor();
  const guestCopy = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await signInAndOpenMerge(page);
  await page.locator('#sync-dialog').getByRole('button', { name: 'Merge my guest universe' }).click();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  const writes = backend.writes();
  await context.setOffline(true);
  await page.locator('#open-add').click();
  await page.locator('#word-input').fill('offline account star');
  await page.locator('#meaning-input').fill('kept while disconnected');
  await page.locator('#word-form button[type=submit]').click();
  await expect(page.locator('#sync-status')).toHaveText('Offline');
  expect(backend.writes()).toBe(writes);
  await context.setOffline(false);
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await page.reload();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  expect(backend.tables.wordverse_entries.some((record) => record.payload.word === 'offline account star')).toBe(true);
  await expect(page.locator('#star-count')).toHaveText('02');
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(guestCopy);
});
