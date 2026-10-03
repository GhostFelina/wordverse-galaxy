import { expect, test } from 'vitest';
import type { AccountCache } from '../src/account-cache';
import { decodeCloudSnapshot, type CloudRow, type CloudSnapshot } from '../src/cloud-universe';
import { planSyncChanges } from '../src/sync-queue';
import { reconcileAccount } from '../src/sync-reconcile';

const at = '2026-10-03T06:00:00Z';
const later = '2026-10-03T06:01:00Z';
const row = (id: string, payload: Record<string, unknown>, extra = {}): CloudRow => ({
  user_id: 'a',
  id,
  payload,
  updated_at: at,
  deleted_at: null,
  ...extra,
});
const cloud = (): CloudSnapshot => ({
  galaxies: [row('g', { id: 'g', name: 'original' })],
  words: [row('w', { id: 'w', galaxyId: 'g', word: 'sun' }, { galaxy_id: 'g' })],
  events: [
    row(
      'e',
      { id: 'e', type: 'word.created', galaxyId: 'g', wordId: 'w', after: { id: 'w', galaxyId: 'g', word: 'sun' } },
      { galaxy_id: 'g' },
    ),
  ],
  settings: [{ user_id: 'a', payload: { version: 4, activeGalaxyId: 'g' }, updated_at: at, deleted_at: null }],
});
function cache(): AccountCache {
  const remote = cloud();
  return {
    version: 1,
    ownerId: 'a',
    remote,
    universe: decodeCloudSnapshot(remote, 'a'),
    pending: [],
    lastSyncedAt: at,
  };
}
function ids() {
  let count = 0;
  return () => `copy-${++count}`;
}

test('untouched local records follow remote edits and deletions without resurrecting them', () => {
  const source = cache();
  const remote = cloud();
  remote.words[0].payload.word = 'remote edit';
  remote.words[0].updated_at = later;
  const changed = reconcileAccount(source, remote);
  expect(changed.cache.universe.words[0].word).toBe('remote edit');
  expect(changed.cache.pending).toEqual([]);
  remote.galaxies[0].deleted_at = later;
  remote.galaxies[0].updated_at = later;
  const deleted = reconcileAccount(changed.cache, remote);
  expect(deleted.cache.universe.galaxies).toEqual([]);
  expect(deleted.cache.universe.words).toEqual([]);
  expect(deleted.cache.pending.every((change) => change.table === 'wordverse_settings')).toBe(true);
  expect(deleted.cache.remote.words).toHaveLength(1);
  expect(source.universe.words[0].word).toBe('sun');
});

test('concurrent word edits retain two visible versions and remap copied history', () => {
  const source = cache();
  source.universe.words[0].word = 'local moon';
  const pending = planSyncChanges(source, source.universe);
  const remote = cloud();
  remote.words[0] = {
    ...remote.words[0],
    payload: { ...remote.words[0].payload, word: 'remote orbit' },
    updated_at: later,
  };
  const result = reconcileAccount(pending, remote, ids());
  expect(result.cache.universe.words.map((word) => word.word)).toEqual(
    expect.arrayContaining(['local moon', 'remote orbit']),
  );
  expect(result.cache.universe.words).toHaveLength(2);
  const copy = result.cache.universe.words.find((word) => word.word === 'remote orbit')!;
  expect(result.cache.universe.events).toHaveLength(2);
  expect(
    result.cache.universe.events.some(
      (event) => event.wordId === copy.id && (event.after as Record<string, unknown>).id === copy.id,
    ),
  ).toBe(true);
  expect(result.cache.pending.find((change) => change.row.id === 'w')?.expectedUpdatedAt).toBe(later);
  expect(result.cache.pending.find((change) => change.row.id === copy.id)?.expectedUpdatedAt).toBeNull();
  expect(result.conflicts).toMatchObject([{ kind: 'words', originalId: 'w', copiedId: copy.id }]);
});

test('concurrent galaxy edits preserve both complete galaxy trees', () => {
  const source = cache();
  source.universe.galaxies[0].name = 'local galaxy';
  const pending = planSyncChanges(source, source.universe);
  const remote = cloud();
  remote.galaxies[0].payload.name = 'remote galaxy';
  remote.galaxies[0].updated_at = later;
  remote.words[0].payload.word = 'remote orbit';
  remote.words[0].updated_at = later;
  const result = reconcileAccount(pending, remote, ids());
  expect(result.cache.universe.galaxies).toHaveLength(2);
  expect(result.cache.universe.words).toHaveLength(2);
  const copiedGalaxy = result.cache.universe.galaxies.find((galaxy) => galaxy.name === 'remote galaxy')!;
  expect(result.cache.universe.words.find((word) => word.word === 'remote orbit')?.galaxyId).toBe(copiedGalaxy.id);
  expect(result.cache.universe.words.find((word) => word.word === 'sun')?.galaxyId).toBe('g');
  expect(result.cache.universe.events).toHaveLength(2);
});

test('a local deletion stays deleted while a concurrent live remote version becomes a copy', () => {
  const source = cache();
  source.universe.words = [];
  const pending = planSyncChanges(source, source.universe);
  const remote = cloud();
  remote.words[0].payload.word = 'remote edit';
  remote.words[0].updated_at = later;
  const result = reconcileAccount(pending, remote, ids());
  expect(result.cache.universe.words).toHaveLength(1);
  expect(result.cache.universe.words[0]).toMatchObject({ word: 'remote edit' });
  expect(result.cache.universe.words[0].id).not.toBe('w');
  expect(result.cache.pending.find((change) => change.row.id === 'w')).toMatchObject({
    expectedUpdatedAt: later,
    row: { deleted_at: expect.any(String) },
  });
});

test('a live local edit under a remotely deleted galaxy remains reachable', () => {
  const source = cache();
  source.universe.words[0].word = 'local edit';
  const pending = planSyncChanges(source, source.universe);
  const remote = cloud();
  remote.galaxies[0].deleted_at = later;
  remote.galaxies[0].updated_at = later;
  const result = reconcileAccount(pending, remote, ids());
  expect(result.cache.universe.galaxies.some((galaxy) => galaxy.id === 'g')).toBe(true);
  expect(result.cache.universe.words.find((word) => word.id === 'w')?.word).toBe('local edit');
  expect(result.cache.pending.find((change) => change.row.id === 'g')).toMatchObject({
    expectedUpdatedAt: later,
    row: { deleted_at: null },
  });
});

test('an already committed change is consumed without duplicating its records', () => {
  const source = cache();
  source.universe.words[0].word = 'local edit';
  const pending = planSyncChanges(source, source.universe);
  const remote = cloud();
  remote.words[0].payload.word = 'local edit';
  remote.words[0].updated_at = later;
  const result = reconcileAccount(pending, remote, ids());
  expect(result.cache.pending).toEqual([]);
  expect(result.cache.universe.words).toHaveLength(1);
  expect(result.conflicts).toEqual([]);
});

test('deleting a galaxy locally preserves a concurrently edited remote tree as a separate galaxy', () => {
  const source = cache();
  source.universe.galaxies = [];
  source.universe.words = [];
  source.universe.activeGalaxyId = null;
  const pending = planSyncChanges(source, source.universe);
  const remote = cloud();
  remote.galaxies[0].payload.name = 'remote surviving tree';
  remote.galaxies[0].updated_at = later;
  const result = reconcileAccount(pending, remote, ids());
  expect(result.cache.universe.galaxies).toHaveLength(1);
  expect(result.cache.universe.galaxies[0].id).not.toBe('g');
  expect(result.cache.universe.words).toHaveLength(1);
  expect(result.cache.universe.words[0].galaxyId).toBe(result.cache.universe.galaxies[0].id);
  expect(
    result.cache.pending.find((change) => change.table === 'wordverse_galaxies' && change.row.id === 'g')?.row
      .deleted_at,
  ).not.toBeNull();
});

test('a simultaneous word edit and remote parent deletion retain both edited words with valid parents', () => {
  const source = cache();
  source.universe.words[0].word = 'local edit';
  const pending = planSyncChanges(source, source.universe);
  const remote = cloud();
  remote.galaxies[0].deleted_at = later;
  remote.galaxies[0].updated_at = later;
  remote.words[0].payload.word = 'remote edit';
  remote.words[0].updated_at = later;
  const result = reconcileAccount(pending, remote, ids());
  expect(result.cache.universe.words).toHaveLength(2);
  expect(result.cache.universe.words.map((word) => word.word)).toEqual(
    expect.arrayContaining(['local edit', 'remote edit']),
  );
  expect(
    result.cache.universe.words.every((word) =>
      result.cache.universe.galaxies.some((galaxy) => galaxy.id === word.galaxyId),
    ),
  ).toBe(true);
});

test('foreign refreshes are rejected and concurrent settings are archived without discarding unknown fields', () => {
  const source = cache();
  source.universe.theme = 'local dark';
  const pending = planSyncChanges(source, source.universe);
  const remote = cloud();
  remote.settings[0].payload = { version: 4, activeGalaxyId: 'g', theme: 'remote light', futureSetting: true };
  remote.settings[0].updated_at = later;
  const result = reconcileAccount(pending, remote, ids());
  expect(result.cache.universe.theme).toBe('local dark');
  expect(result.cache.universe.futureSetting).toBe(true);
  expect(result.cache.universe.syncSettingsConflicts).toMatchObject([{ payload: { theme: 'remote light' } }]);
  remote.words[0].user_id = 'b';
  expect(() => reconcileAccount(pending, remote)).toThrow('account mismatch');
});
