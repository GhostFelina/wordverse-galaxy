import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { UNIVERSE_KEY } from '../src/universe-data.js';
import { LOCAL_REVISION_KEY, loadLocalUniverse, persistLocalUniverse } from '../src/local-primary.js';

const initial = {
  version: 4,
  galaxies: [{ id: 'g', name: 'English', language: 'English', meaningLanguage: 'tr' }],
  activeGalaxyId: 'g',
  words: [{ id: 'w', galaxyId: 'g', word: 'light', meaning: 'ışık' }],
  events: [],
};
const storage = (entries) => {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};
const databaseName = () => `wordverse-offline-test-${crypto.randomUUID()}`;

describe('IndexedDB primary universe', () => {
  it('copies an existing v4 guest universe and recovers it if localStorage disappears', async () => {
    const local = storage({ [UNIVERSE_KEY]: JSON.stringify(initial) });
    const name = databaseName();
    const migrated = await loadLocalUniverse(local, name);
    expect(migrated.source).toBe('localstorage');
    local.removeItem(UNIVERSE_KEY);
    const recovered = await loadLocalUniverse(local, name);
    expect(recovered).toMatchObject({ source: 'indexeddb', recovered: true });
    expect(recovered.universe.words[0].meaning).toBe('ışık');
    expect(JSON.parse(local.getItem(UNIVERSE_KEY)).words[0].word).toBe('light');
  });

  it('uses the synchronous local copy while an IndexedDB write is pending', async () => {
    const local = storage({ [UNIVERSE_KEY]: JSON.stringify(initial) });
    const name = databaseName();
    await loadLocalUniverse(local, name);
    const newer = structuredClone(initial);
    newer.words.push({ id: 'w2', galaxyId: 'g', word: 'moon', meaning: 'ay' });
    const write = persistLocalUniverse(newer, local, name);
    expect(write.localSaved).toBe(true);
    expect(Number(local.getItem(LOCAL_REVISION_KEY))).toBeGreaterThan(0);
    const loaded = await loadLocalUniverse(local, name);
    expect(loaded.universe.words).toHaveLength(2);
    await write.writePrimary();
  });

  it('keeps an IndexedDB copy when localStorage is unavailable', async () => {
    const name = databaseName();
    const local = storage({});
    local.setItem = () => {
      throw new Error('quota');
    };
    const write = persistLocalUniverse(initial, local, name);
    expect(write.localSaved).toBe(false);
    await write.writePrimary();
    local.getItem = () => {
      throw new Error('blocked');
    };
    const recovered = await loadLocalUniverse(local, name);
    expect(recovered.source).toBe('indexeddb');
    expect(recovered.universe.words).toHaveLength(1);
  });
});
