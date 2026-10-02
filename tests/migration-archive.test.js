import { test, expect } from 'vitest';
import { indexedDB } from 'fake-indexeddb';
import { LEGACY_KEY, loadUniverse, mergeUniverse } from '../src/universe-data.js';
import { archiveBeforeMigration, readMigrationArchive, SCHEMA_VERSION_KEY } from '../src/storage-mirror.js';

globalThis.indexedDB = indexedDB;

const storage = (entries) => {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
};

test('archives exact v2 bytes before migration and never overwrites them', async () => {
  const original = JSON.stringify([{ id: 'old', word: 'eager', meaning: 'hevesli', createdAt: '2025-01-01' }]);
  const browserStorage = storage({ [LEGACY_KEY]: original });
  await archiveBeforeMigration(browserStorage);
  expect(browserStorage.getItem(SCHEMA_VERSION_KEY)).toBe('3');
  await expect(readMigrationArchive(LEGACY_KEY)).resolves.toMatchObject({ raw: original });
  expect(loadUniverse(browserStorage).words[0].meaning).toBe('hevesli');
  browserStorage.setItem(LEGACY_KEY, '[]');
  await archiveBeforeMigration(browserStorage);
  expect((await readMigrationArchive(LEGACY_KEY)).raw).toBe(original);
});

test('existing v3 JSON backups remain importable without replacing words', () => {
  const oldBackup = {
    version: 3,
    galaxies: [{ id: 'galaxy-english', name: 'İngilizce Galaksisi', language: 'İngilizce' }],
    activeGalaxyId: 'galaxy-english',
    words: [{ id: 'historic', galaxyId: 'galaxy-english', word: 'light', meaning: 'ışık' }],
    events: [],
    exportedAt: '2026-09-01T00:00:00.000Z',
  };
  const current = { version: 3, galaxies: oldBackup.galaxies, activeGalaxyId: 'galaxy-english', words: [], events: [] };
  mergeUniverse(current, JSON.parse(JSON.stringify(oldBackup)));
  mergeUniverse(current, oldBackup);
  expect(current.words).toHaveLength(1);
  expect(current.words[0].meaning).toBe('ışık');
});

test('legacy v2 word arrays remain importable without losing dates or meanings', () => {
  const oldBackup = [{ id: 'historic-v2', word: 'serene', meaning: 'sakin', createdAt: '2025-01-01T00:00:00.000Z' }];
  const current = {
    version: 3,
    galaxies: [{ id: 'galaxy-english', name: 'İngilizce Galaksisi', language: 'İngilizce' }],
    activeGalaxyId: 'galaxy-english',
    words: [],
    events: [],
  };
  mergeUniverse(current, oldBackup);
  expect(current.words[0]).toMatchObject({
    id: 'historic-v2',
    meaning: 'sakin',
    createdAt: oldBackup[0].createdAt,
    galaxyId: 'galaxy-english',
  });
});
