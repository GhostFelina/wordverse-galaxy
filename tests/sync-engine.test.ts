import { expect, test, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountCache, PendingChange } from '../src/account-cache';
import type { CloudRow } from '../src/cloud-universe';
import { AccountSyncEngine } from '../src/sync-engine';
import { planSyncChanges } from '../src/sync-queue';

const at = '2026-10-03T06:00:00Z';
const later = '2026-10-03T06:01:00Z';
const client = {} as SupabaseClient;
function cache(): AccountCache {
  const universe = { version: 4 as const, activeGalaxyId: 'g', galaxies: [{ id: 'g' }], words: [], events: [] };
  const source: AccountCache = {
    version: 1,
    ownerId: 'a',
    universe,
    remote: { galaxies: [], words: [], events: [], settings: [] },
    pending: [],
    lastSyncedAt: null,
  };
  return planSyncChanges(source, universe, at);
}
const saved = (change: PendingChange): CloudRow => ({ ...change.row, updated_at: later });
function gate<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('parallel flush calls serialize writes and persist each acknowledgement', async () => {
  const storage = vi.fn(async () => {});
  const seen: string[] = [];
  let inFlight = 0;
  const engine = new AccountSyncEngine({
    client,
    cache: cache(),
    save: storage,
    write: async (change) => {
      expect(++inFlight).toBe(1);
      await Promise.resolve();
      seen.push(change.table);
      inFlight--;
      return { status: 'applied', row: saved(change) };
    },
  });
  const first = engine.flush();
  expect(engine.flush()).toBe(first);
  await first;
  expect(seen).toEqual(['wordverse_galaxies', 'wordverse_settings']);
  expect(storage).toHaveBeenCalledTimes(2);
  expect(engine.snapshot()).toMatchObject({ status: 'synced', cache: { pending: [], lastSyncedAt: later } });
});

test('editing during a request preserves the new edit and writes against its acknowledgement', async () => {
  const waiting = gate<void>();
  const entered = gate<void>();
  const sent: PendingChange[] = [];
  const storage = vi.fn(async () => {});
  const engine = new AccountSyncEngine({
    client,
    cache: cache(),
    save: storage,
    write: async (change) => {
      sent.push(structuredClone(change));
      if (sent.length === 1) {
        entered.resolve();
        await waiting.promise;
      }
      return { status: 'applied', row: saved(change) };
    },
  });
  const drain = engine.flush();
  await entered.promise;
  const universe = engine.snapshot().cache.universe;
  universe.galaxies[0].name = 'edited while sending';
  await engine.update(universe);
  expect(storage).toHaveBeenCalledTimes(1);
  waiting.resolve();
  await drain;
  expect(sent[1]).toMatchObject({
    table: 'wordverse_galaxies',
    expectedUpdatedAt: later,
    row: { payload: { name: 'edited while sending' } },
  });
  expect(engine.snapshot().cache.pending).toEqual([]);
});

test('stopping an account suppresses late responses and prevents the next queued write', async () => {
  const waiting = gate<void>();
  const entered = gate<void>();
  const storage = vi.fn(async () => {});
  const states = vi.fn();
  const write = vi.fn(async (change: PendingChange) => {
    entered.resolve();
    await waiting.promise;
    return { status: 'applied' as const, row: saved(change) };
  });
  const engine = new AccountSyncEngine({ client, cache: cache(), save: storage, write, onState: states });
  const drain = engine.flush();
  await entered.promise;
  engine.stop();
  const count = states.mock.calls.length;
  waiting.resolve();
  await drain;
  expect(write).toHaveBeenCalledTimes(1);
  expect(storage).not.toHaveBeenCalled();
  expect(states).toHaveBeenCalledTimes(count);
  expect(engine.snapshot().cache.pending).toHaveLength(2);
  await expect(engine.update(engine.snapshot().cache.universe)).rejects.toThrow('stopped');
});

test('offline and network failures keep durable pending records available for retry', async () => {
  let online = false;
  let fail = true;
  const write = vi.fn(async (change: PendingChange) => {
    if (fail) throw new Error('unavailable');
    return { status: 'applied' as const, row: saved(change) };
  });
  const engine = new AccountSyncEngine({ client, cache: cache(), save: async () => {}, online: () => online, write });
  await engine.flush();
  expect(engine.snapshot().status).toBe('offline');
  expect(write).not.toHaveBeenCalled();
  online = true;
  await engine.flush();
  expect(engine.snapshot()).toMatchObject({ status: 'error', cache: { pending: expect.any(Array) } });
  expect(engine.snapshot().cache.pending).toHaveLength(2);
  fail = false;
  await engine.flush();
  expect(engine.snapshot().status).toBe('synced');
});

test('a storage failure prevents any network write until the latest local state is durable', async () => {
  let fail = true;
  const durableCopies: AccountCache[] = [];
  const storage = vi.fn(async (value: AccountCache) => {
    if (fail) throw new Error('quota');
    durableCopies.push(structuredClone(value));
  });
  const write = vi.fn(async (change: PendingChange) => ({ status: 'applied' as const, row: saved(change) }));
  const engine = new AccountSyncEngine({ client, cache: cache(), save: storage, write });
  const universe = engine.snapshot().cache.universe;
  universe.galaxies[0].name = 'kept in memory';
  await expect(engine.update(universe)).rejects.toThrow('quota');
  await engine.flush();
  expect(write).not.toHaveBeenCalled();
  expect(engine.snapshot().cache.universe.galaxies[0].name).toBe('kept in memory');
  fail = false;
  await engine.flush();
  expect(write).toHaveBeenCalledTimes(2);
  expect(durableCopies[0].universe.galaxies[0].name).toBe('kept in memory');
});

test('a lost response is acknowledged only when the conflicting server contents match the sent change', async () => {
  const engine = new AccountSyncEngine({
    client,
    cache: cache(),
    save: async () => {},
    write: async (change) => ({ status: 'conflict', row: saved(change) }),
  });
  await engine.flush();
  expect(engine.snapshot().status).toBe('synced');
  const source = cache();
  const write = vi.fn(async (change: PendingChange) => ({
    status: 'conflict' as const,
    row: { ...saved(change), payload: { id: 'g', name: 'other device' } },
  }));
  const conflict = new AccountSyncEngine({ client, cache: source, save: async () => {}, write });
  await conflict.flush();
  expect(write).toHaveBeenCalledTimes(1);
  expect(conflict.snapshot()).toMatchObject({
    status: 'conflict',
    cache: { pending: source.pending },
    conflict: { remote: { payload: { name: 'other device' } } },
  });
});

test('refresh pauses uploads while local edits persist and merges both concurrent versions', async () => {
  const source = cache();
  // Convert the fixture's initial pending galaxy/settings into a confirmed baseline.
  source.remote.galaxies = [saved(source.pending[0])];
  source.remote.settings = [saved(source.pending[1])];
  source.pending = [];
  const waiting = gate<typeof source.remote>();
  const entered = gate<void>();
  const write = vi.fn(async (change: PendingChange) => ({
    status: 'applied' as const,
    row: { ...saved(change), updated_at: '2026-10-03T06:03:00Z' },
  }));
  const storage = vi.fn(async () => {});
  const engine = new AccountSyncEngine({
    client,
    cache: source,
    save: storage,
    write,
    read: async () => {
      entered.resolve();
      return waiting.promise;
    },
  });
  const refresh = engine.refresh();
  expect(engine.refresh()).toBe(refresh);
  await entered.promise;
  const universe = engine.snapshot().cache.universe;
  universe.galaxies[0].name = 'local edit';
  await engine.update(universe);
  const upload = engine.flush();
  expect(write).not.toHaveBeenCalled();
  const remote = structuredClone(source.remote);
  remote.galaxies[0].payload.name = 'remote edit';
  remote.galaxies[0].updated_at = '2026-10-03T06:02:00Z';
  waiting.resolve(remote);
  await refresh;
  expect(engine.snapshot().cache.universe.galaxies.map((galaxy) => galaxy.name)).toEqual(
    expect.arrayContaining(['local edit', 'remote edit']),
  );
  await upload;
  expect(engine.snapshot().status).toBe('synced');
  expect(storage).toHaveBeenCalled();
});

test('stopping during a refresh leaves that account cache untouched by the late remote result', async () => {
  const source = cache();
  const waiting = gate<typeof source.remote>();
  const entered = gate<void>();
  const save = vi.fn(async () => {});
  const states = vi.fn();
  const engine = new AccountSyncEngine({
    client,
    cache: source,
    save,
    onState: states,
    read: async () => {
      entered.resolve();
      return waiting.promise;
    },
  });
  const refresh = engine.refresh();
  await entered.promise;
  engine.stop();
  waiting.resolve(source.remote);
  await refresh;
  expect(save).not.toHaveBeenCalled();
  expect(states).not.toHaveBeenCalled();
  expect(engine.snapshot().cache).toEqual(source);
});
