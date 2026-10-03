import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

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
  let reads = 0;
  let failReads = false;
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
        updated_at: new Date(
          Math.max(Date.parse(current?.updated_at || at), Date.parse('2026-10-03T06:05:00Z')) + ++sequence * 1000,
        ).toISOString(),
      };
      if (index === -1) records.push(saved);
      else records[index] = saved;
      return reply({ status: 'applied', row: saved });
    }
    if (url.pathname.startsWith('/rest/v1/')) {
      reads++;
      if (failReads)
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'test read unavailable' }),
        });
      return reply(tables[url.pathname.split('/').at(-1)] || []);
    }
    return reply({
      access_token: token,
      refresh_token: 'test-only-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: expiresAt,
      user,
    });
  });
  return {
    tables,
    writes: () => writes,
    reads: () => reads,
    failReads: (value) => {
      failReads = value;
    },
  };
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

test('account JSON export and legacy import preserve cloud records, survive reload and leave the guest untouched', async ({
  page,
}) => {
  const backend = await setupMockAccount(page);
  await page.goto('/?lang=en');
  await page.locator('#open-account').waitFor();
  const guestCopy = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await signInAndOpenMerge(page);
  await page.locator('#sync-dialog').getByRole('button', { name: 'Open only my account universe' }).click();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await page.locator('#galaxy-switch').click();
  await expect(page.locator('#galaxy-panel')).toHaveAttribute('aria-hidden', 'false');
  const downloadReady = page.waitForEvent('download');
  await page.locator('#export-universe').click();
  const download = await downloadReady;
  const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(exported.version).toBe(4);
  expect(exported.words.map((item) => item.word)).toEqual(['cloud star']);
  expect(exported.exportedAt).toBeTruthy();
  expect(JSON.stringify(exported)).not.toMatch(/test-only-refresh-token|test-signature|access_token/);
  const legacy = {
    version: 3,
    activeGalaxyId: 'legacy-g',
    galaxies: [{ id: 'legacy-g', name: 'Historic galaxy', language: 'Spanish' }],
    words: [{ id: 'legacy-w', galaxyId: 'legacy-g', word: 'luz', meaning: 'ışık', createdAt: '2025-01-01T00:00:00Z' }],
    events: [],
  };
  await page.locator('#import-universe').setInputFiles({
    name: 'historic-v3.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  });
  await expect
    .poll(() => backend.tables.wordverse_entries.map((item) => item.payload.word))
    .toEqual(expect.arrayContaining(['cloud star', 'luz']));
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await page.reload();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await expect(page.locator('#galaxy-count')).toHaveText('02');
  expect(backend.tables.wordverse_entries.find((item) => item.id === 'legacy-w').payload).toMatchObject({
    meaning: 'ışık',
    createdAt: '2025-01-01T00:00:00Z',
  });
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(guestCopy);
});

test('account backup ID conflicts keep both versions through sync and repeat import', async ({ page }) => {
  const backend = await setupMockAccount(page);
  await page.goto('/?lang=en');
  await signInAndOpenMerge(page);
  await page.locator('#sync-dialog').getByRole('button', { name: 'Open only my account universe' }).click();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  const guestCopy = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  const backup = {
    version: 4,
    activeGalaxyId: 'g',
    galaxies: backend.tables.wordverse_galaxies.map((row) => row.payload),
    words: [{ ...backend.tables.wordverse_entries[0].payload, meaning: 'historic backup meaning' }],
    events: [],
  };
  const file = {
    name: 'conflicting-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  };
  await page.locator('#import-universe').setInputFiles(file);
  await expect.poll(() => backend.tables.wordverse_entries.length).toBe(2);
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  const ids = backend.tables.wordverse_entries.map((row) => row.id);
  expect(backend.tables.wordverse_entries.map((row) => row.payload.meaning)).toEqual(
    expect.arrayContaining(['guest meaning', 'historic backup meaning']),
  );
  await page.reload();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await page.locator('#import-universe').setInputFiles(file);
  await expect(page.locator('#toast')).toHaveText('The backup was merged; your existing words were kept.');
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  expect(backend.tables.wordverse_entries.map((row) => row.id)).toEqual(ids);
  expect(backend.tables.wordverse_galaxies).toHaveLength(1);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(guestCopy);
});

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
  await expect(page.locator('#galaxy-panel')).toHaveAttribute('aria-hidden', 'false');
});

test('account deletion persists as a tombstone and explicit JSON restore revives the backed-up entry', async ({
  page,
}) => {
  const backend = await setupMockAccount(page);
  await page.goto('/?lang=en');
  await signInAndOpenMerge(page);
  await page.locator('#sync-dialog').getByRole('button', { name: 'Open only my account universe' }).click();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  const backup = {
    version: 4,
    activeGalaxyId: 'g',
    galaxies: backend.tables.wordverse_galaxies.map((item) => item.payload),
    words: backend.tables.wordverse_entries.map((item) => item.payload),
    events: [],
  };
  await page.locator('#collection-btn').click();
  await page.locator('#collection-list button').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#delete-word').click();
  await expect.poll(() => backend.tables.wordverse_entries[0].deleted_at).toBeTruthy();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await page.reload();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await expect(page.locator('#star-count')).toHaveText('00');
  await page
    .locator('#import-universe')
    .setInputFiles({ name: 'restore.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await expect.poll(() => backend.tables.wordverse_entries[0].deleted_at).toBeNull();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await page.reload();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await expect(page.locator('#star-count')).toHaveText('01');
  expect(backend.tables.wordverse_entries[0].payload.word).toBe('cloud star');
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

test('returning to an account fetches other-device changes and failed refresh remains retryable', async ({ page }) => {
  const backend = await setupMockAccount(page);
  await page.goto('/?lang=en');
  await signInAndOpenMerge(page);
  await page.locator('#sync-dialog').getByRole('button', { name: 'Open only my account universe' }).click();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  backend.tables.wordverse_entries[0].payload = {
    ...backend.tables.wordverse_entries[0].payload,
    word: 'from another device',
  };
  backend.tables.wordverse_entries[0].updated_at = '2026-10-03T07:00:00Z';
  await page.evaluate(() => {
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.locator('#collection-btn').click();
  await expect(page.locator('#collection-list')).toContainText('from another device');
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await page.locator('#close-collection').click();
  backend.failReads(true);
  await page.locator('#sync-status').click();
  await expect(page.locator('#sync-status')).toHaveText('Sync error · retry');
  await page.locator('#collection-btn').click();
  await expect(page.locator('#collection-list')).toContainText('from another device');
  await page.locator('#close-collection').click();
  backend.failReads(false);
  await page.locator('#sync-status').click();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
});

test('returning while editing keeps the draft and retry preserves a concurrent remote version', async ({ page }) => {
  const backend = await setupMockAccount(page);
  await page.goto('/?lang=en');
  await signInAndOpenMerge(page);
  await page.locator('#sync-dialog').getByRole('button', { name: 'Open only my account universe' }).click();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  await page.locator('#collection-btn').click();
  await page.locator('#collection-list button').click();
  await page.locator('#edit-word').click();
  await page.locator('#word-input').fill('unfinished local draft');
  backend.tables.wordverse_entries[0].payload = {
    ...backend.tables.wordverse_entries[0].payload,
    word: 'concurrent remote version',
  };
  backend.tables.wordverse_entries[0].updated_at = '2026-10-03T07:00:00Z';
  await page.evaluate(() => {
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#word-input')).toHaveValue('unfinished local draft');
  await page.locator('#word-form button[type=submit]').click();
  await expect(page.locator('#sync-status')).toHaveText('Conflict · retry');
  await page.locator('#close-detail').click();
  await page.locator('#sync-status').click();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  expect(backend.tables.wordverse_entries.map((item) => item.payload.word)).toEqual(
    expect.arrayContaining(['unfinished local draft', 'concurrent remote version']),
  );
});

test('unavailable account IndexedDB preserves the guest and retries safely when storage returns', async ({ page }) => {
  const backend = await setupMockAccount(page);
  await page.addInitScript(() => {
    const open = indexedDB.open.bind(indexedDB);
    window.accountStorageBlocked = true;
    indexedDB.open = (name, version) => {
      if (name === 'wordverse-accounts' && window.accountStorageBlocked)
        throw new DOMException('Test storage denied', 'SecurityError');
      return version === undefined ? open(name) : open(name, version);
    };
  });
  await page.goto('/?lang=en');
  const original = await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'));
  await page.locator('#open-account').click();
  const dialog = page.locator('#account-dialog');
  await dialog.getByLabel('Email', { exact: true }).fill('sync@example.test');
  await dialog.getByLabel('Password', { exact: true }).fill('test-only-password');
  await dialog.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('#sync-status')).toHaveText('Sync error · retry');
  expect(backend.writes()).toBe(0);
  expect(backend.reads()).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(original);
  await dialog.getByRole('button', { name: 'Universe and sync', exact: true }).click();
  await expect(page.locator('#sync-status')).toHaveText('Sync error · retry');
  await expect(page.locator('#sync-dialog')).not.toBeVisible();
  await page.locator('#collection-btn').click();
  await expect(page.locator('#collection-list')).toContainText('guest star');
  await page.locator('#close-collection').click();
  await page.evaluate(() => {
    window.accountStorageBlocked = false;
  });
  await page.locator('#sync-status').click();
  await expect(page.locator('#sync-status')).toHaveText('Connect universe');
  await page.locator('#sync-status').click();
  await expect(page.locator('#sync-dialog')).toBeVisible();
  await page.locator('#sync-dialog').getByRole('button', { name: 'Open only my account universe' }).click();
  await expect(page.locator('#sync-status')).toHaveText('Synced');
  expect(await page.evaluate(() => localStorage.getItem('wordverse.universe.v4'))).toBe(original);
  expect(backend.tables.wordverse_entries.map((row) => row.payload.word)).toEqual(['cloud star']);
});
