import { test, expect } from 'vitest';
import { indexedDB } from 'fake-indexeddb';
import { LEGACY_KEY, PREVIOUS_UNIVERSE_KEY, loadUniverse, mergeUniverse } from '../src/universe-data.js';
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
  expect(browserStorage.getItem(SCHEMA_VERSION_KEY)).toBe('4');
  await expect(readMigrationArchive(LEGACY_KEY)).resolves.toMatchObject({ raw: original });
  expect(loadUniverse(browserStorage).words[0].meaning).toBe('hevesli');
  browserStorage.setItem(LEGACY_KEY, '[]');
  await archiveBeforeMigration(browserStorage);
  expect((await readMigrationArchive(LEGACY_KEY)).raw).toBe(original);
});

test('archives an existing v3 record exactly before writing v4', async () => {
  const raw = JSON.stringify({
    version: 3,
    galaxies: [{ id: 'en' }],
    activeGalaxyId: 'en',
    words: [{ id: 'one', galaxyId: 'en' }],
    events: [],
  });
  const browserStorage = storage({ [PREVIOUS_UNIVERSE_KEY]: raw });
  await archiveBeforeMigration(browserStorage);
  expect((await readMigrationArchive(PREVIOUS_UNIVERSE_KEY)).raw).toBe(raw);
  expect(loadUniverse(browserStorage).words).toHaveLength(1);
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

test('conflicting backup trees preserve both versions and repeated imports reuse the same copies', () => {
  const current = {
    version: 4,
    activeGalaxyId: 'g',
    galaxies: [{ id: 'g', name: 'Current', language: 'English', meaningLanguage: 'tr' }],
    words: [{ id: 'w', galaxyId: 'g', word: 'sun', meaning: 'güneş', createdAt: '2026-01-01' }],
    events: [
      { id: 'e', type: 'word.created', galaxyId: 'g', wordId: 'w', after: { id: 'w', galaxyId: 'g', word: 'sun' } },
    ],
  };
  const backup = {
    version: 3,
    activeGalaxyId: 'g',
    galaxies: [{ id: 'g', name: 'Historic', language: 'Spanish' }],
    words: [{ id: 'w', galaxyId: 'g', word: 'luna', meaning: 'ay', createdAt: '2025-01-01', x: 7 }],
    events: [
      {
        id: 'e',
        type: 'word.created',
        galaxyId: 'g',
        wordId: 'w',
        before: null,
        after: { id: 'w', galaxyId: 'g', word: 'luna' },
      },
    ],
  };
  const original = structuredClone(current);
  const source = JSON.stringify(backup);
  mergeUniverse(current, backup);
  const restored = structuredClone(current);
  const galaxy = current.galaxies[1];
  const word = current.words[1];
  expect(current.galaxies[0]).toEqual(original.galaxies[0]);
  expect(current.words[0]).toEqual(original.words[0]);
  expect(word).toMatchObject({ galaxyId: galaxy.id, word: 'luna', meaning: 'ay', createdAt: '2025-01-01', x: 7 });
  expect(current.events[1]).toMatchObject({
    galaxyId: galaxy.id,
    wordId: word.id,
    after: { id: word.id, galaxyId: galaxy.id },
  });
  expect(current.activeGalaxyId).toBe('g');
  mergeUniverse(current, JSON.parse(source));
  expect(current).toEqual(restored);
  expect(JSON.stringify(backup)).toBe(source);
});

test('a changed word in an unchanged galaxy is kept alongside the current word, without property-order duplicates', () => {
  const current = {
    version: 4,
    activeGalaxyId: 'g',
    galaxies: [{ id: 'g', name: 'English', language: 'English', meaningLanguage: 'tr' }],
    words: [{ id: 'w', galaxyId: 'g', word: 'light', meaning: 'new meaning' }],
    events: [],
  };
  const backup = {
    version: 3,
    galaxies: [{ language: 'English', name: 'English', id: 'g' }],
    words: [{ meaning: 'old meaning', word: 'light', galaxyId: 'g', id: 'w' }],
    events: [],
  };
  mergeUniverse(current, backup);
  mergeUniverse(current, backup);
  expect(current.galaxies).toHaveLength(1);
  expect(current.words).toHaveLength(2);
  expect(current.words.map((w) => w.meaning)).toEqual(['new meaning', 'old meaning']);
  expect(current.words.every((w) => w.galaxyId === 'g')).toBe(true);
});

test('duplicate IDs reject a malformed backup without partially importing it', () => {
  const current = { version: 4, galaxies: [], words: [], events: [] };
  const before = structuredClone(current);
  expect(() =>
    mergeUniverse(current, {
      version: 4,
      galaxies: [{ id: 'g', name: 'English', language: 'English' }],
      words: [
        { id: 'w', galaxyId: 'g', word: 'one', meaning: 'bir' },
        { id: 'w', galaxyId: 'g', word: 'two', meaning: 'iki' },
      ],
      events: [],
    }),
  ).toThrow('Duplicate backup IDs');
  expect(current).toEqual(before);
});
