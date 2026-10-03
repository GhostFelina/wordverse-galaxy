import { expect, test } from 'vitest';
import { planSyncChanges, acknowledgeSyncWrite } from '../src/sync-queue';
import type { AccountCache } from '../src/account-cache';
import type { CloudRow } from '../src/cloud-universe';

const at = '2026-10-03T06:00:00Z';
const row = (id: string, payload: Record<string, unknown>, extra = {}): CloudRow => ({
  user_id: 'a',
  id,
  payload,
  updated_at: at,
  deleted_at: null,
  ...extra,
});
const cache = (): AccountCache => ({
  version: 1,
  ownerId: 'a',
  universe: {
    version: 4,
    activeGalaxyId: 'g',
    galaxies: [{ id: 'g' }],
    words: [{ id: 'w', galaxyId: 'g', word: 'sun' }],
    events: [],
  },
  remote: {
    galaxies: [row('g', { id: 'g' })],
    words: [row('w', { id: 'w', galaxyId: 'g', word: 'sun' }, { galaxy_id: 'g' })],
    events: [],
    settings: [{ user_id: 'a', payload: { version: 4, activeGalaxyId: 'g' }, updated_at: at, deleted_at: null }],
  },
  pending: [],
  lastSyncedAt: at,
});

test('unchanged state produces no writes even if property order differs', () => {
  const source = cache();
  source.universe.words[0] = { word: 'sun', galaxyId: 'g', id: 'w' };
  expect(planSyncChanges(source, source.universe).pending).toEqual([]);
});

test('JSON-omitted optional fields acknowledge without confusing missing with explicit null', () => {
  const source = cache();
  source.universe.words[0] = {
    ...source.universe.words[0],
    word: 'moon',
    planetType: undefined,
    optional: { note: undefined, tags: [undefined] },
  };
  const queued = planSyncChanges(source, source.universe);
  const sent = queued.pending[0];
  const saved = {
    ...sent.row,
    payload: JSON.parse(JSON.stringify(sent.row.payload)),
    updated_at: '2026-10-03T06:01:00Z',
  };
  expect(acknowledgeSyncWrite(queued, sent, saved).pending).toEqual([]);
  expect(planSyncChanges(acknowledgeSyncWrite(queued, sent, saved), source.universe).pending).toEqual([]);
  expect(() =>
    acknowledgeSyncWrite(queued, sent, { ...saved, payload: { ...saved.payload, planetType: null } }),
  ).toThrow('Acknowledgement does not match');
});

test('repeated offline edits keep the last confirmed server revision', () => {
  const source = cache();
  const universe = structuredClone(source.universe);
  universe.words[0].word = 'moon';
  const first = planSyncChanges(source, universe, '2026-10-03T06:01:00Z');
  universe.words[0].word = 'orbit';
  const second = planSyncChanges(first, universe, '2026-10-03T06:02:00Z');
  expect(second.pending).toHaveLength(1);
  expect(second.pending[0]).toMatchObject({
    expectedUpdatedAt: at,
    row: { payload: { word: 'orbit' }, updated_at: '2026-10-03T06:02:00Z' },
  });
  expect(source.universe.words[0].word).toBe('sun');
});

test('removed records become durable tombstones with their full payload', () => {
  const source = cache();
  const universe = structuredClone(source.universe);
  universe.words = [];
  const first = planSyncChanges(source, universe, '2026-10-03T06:01:00Z');
  const second = planSyncChanges(first, universe, '2026-10-03T06:02:00Z');
  expect(second.pending).toHaveLength(1);
  expect(second.pending[0]).toMatchObject({
    expectedUpdatedAt: at,
    row: { deleted_at: '2026-10-03T06:01:00Z', payload: { id: 'w', word: 'sun', galaxyId: 'g' } },
  });
});

test('a new offline entry removed before acknowledgement still queues a tombstone', () => {
  const source = cache();
  const universe = structuredClone(source.universe);
  universe.words.push({ id: 'new', galaxyId: 'g', word: 'orbit' });
  const created = planSyncChanges(source, universe, '2026-10-03T06:01:00Z');
  universe.words = universe.words.filter((word) => word.id !== 'new');
  const removed = planSyncChanges(created, universe, '2026-10-03T06:02:00Z');
  expect(removed.pending[0]).toMatchObject({
    expectedUpdatedAt: null,
    row: { id: 'new', deleted_at: '2026-10-03T06:02:00Z' },
  });
});

test('reverting a queued edit still sends the desired contents until the request is acknowledged', () => {
  const source = cache();
  const universe = structuredClone(source.universe);
  universe.words[0].word = 'moon';
  const queued = planSyncChanges(source, universe);
  universe.words[0].word = 'sun';
  const reverted = planSyncChanges(queued, universe);
  expect(reverted.pending).toHaveLength(1);
  expect(reverted.pending[0].row.payload.word).toBe('sun');
});

test('acknowledgement advances the baseline without dropping a newer offline edit', () => {
  const source = cache();
  const universe = structuredClone(source.universe);
  universe.words[0].word = 'moon';
  const queued = planSyncChanges(source, universe);
  const sent = queued.pending[0];
  universe.words[0].word = 'orbit';
  const newer = planSyncChanges(queued, universe);
  const saved = { ...sent.row, updated_at: '2026-10-03T07:00:00Z' };
  const acknowledged = acknowledgeSyncWrite(newer, sent, saved);
  expect(acknowledged.pending[0]).toMatchObject({
    expectedUpdatedAt: saved.updated_at,
    row: { payload: { word: 'orbit' } },
  });
  expect(acknowledged.remote.words[0].payload.word).toBe('moon');
  const completed = acknowledgeSyncWrite(queued, sent, saved);
  expect(completed.pending).toEqual([]);
  expect(completed.lastSyncedAt).toBe(saved.updated_at);
});
