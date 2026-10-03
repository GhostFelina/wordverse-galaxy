import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { loadAccountCache, saveAccountCache, type AccountCache } from '../src/account-cache';

const cache = (ownerId: string): AccountCache => ({
  version: 1,
  ownerId,
  universe: { version: 4, activeGalaxyId: 'g', galaxies: [{ id: 'g' }], words: [], events: [] },
  remote: { galaxies: [], words: [], events: [], settings: [] },
  pending: [],
  lastSyncedAt: null,
});

test('account snapshots and pending changes survive a read independently for each owner', async () => {
  const database = `accounts-${crypto.randomUUID()}`;
  const first = cache('a');
  first.universe.words.push({ id: 'w', galaxyId: 'g', word: 'orbit' });
  first.pending.push({
    table: 'wordverse_entries',
    row: {
      user_id: 'a',
      id: 'w',
      galaxy_id: 'g',
      payload: { id: 'w', galaxyId: 'g', word: 'orbit' },
      updated_at: '2026-10-03T06:00:00Z',
      deleted_at: null,
    },
    expectedUpdatedAt: null,
  });
  await saveAccountCache(first, database);
  await saveAccountCache(cache('b'), database);
  expect((await loadAccountCache('a', database))?.pending).toHaveLength(1);
  expect((await loadAccountCache('b', database))?.universe.words).toHaveLength(0);
  expect(await loadAccountCache('c', database)).toBeNull();
});

test('a foreign-owner pending write is rejected before replacing intact local records', async () => {
  const database = `accounts-${crypto.randomUUID()}`;
  const intact = cache('a');
  await saveAccountCache(intact, database);
  const invalid = cache('a');
  invalid.pending.push({
    table: 'wordverse_galaxies',
    row: { user_id: 'b', id: 'g', payload: { id: 'g' }, updated_at: '2026-10-03T06:00:00Z', deleted_at: null },
    expectedUpdatedAt: null,
  });
  await expect(saveAccountCache(invalid, database)).rejects.toThrow('Foreign account');
  expect(await loadAccountCache('a', database)).toEqual(intact);
});

test('saving captures a snapshot before asynchronous database work begins', async () => {
  const database = `accounts-${crypto.randomUUID()}`;
  const source = cache('a');
  const saving = saveAccountCache(source, database);
  source.universe.galaxies[0].name = 'Changed after save';
  await saving;
  expect((await loadAccountCache('a', database))?.universe.galaxies[0].name).toBeUndefined();
});
