import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_KEY, UNIVERSE_KEY } from '../src/universe-data.js';
import { recoverUniverse } from '../src/storage-mirror.js';

const snapshot = { version: 3, galaxies: [{ id: 'en', name: 'English', language: 'İngilizce' }], activeGalaxyId: 'en', words: [{ id: 'word-1', galaxyId: 'en', word: 'light', meaning: 'ışık' }], events: [] };
const storage = entries => ({ getItem: key => entries[key] ?? null });

test('valid primary data wins over an older mirror', async () => {
  const primary = { ...snapshot, words: [{ ...snapshot.words[0], word: 'newer' }] };
  let mirrorRead = false;
  const result = await recoverUniverse(storage({ [UNIVERSE_KEY]: JSON.stringify(primary) }), async () => { mirrorRead = true; return snapshot; });
  assert.equal(result.universe.words[0].word, 'newer');
  assert.equal(result.recovered, false);
  assert.equal(mirrorRead, false);
});

test('damaged primary data recovers its words from the mirror', async () => {
  const result = await recoverUniverse(storage({ [UNIVERSE_KEY]: '{broken' }), async () => snapshot);
  assert.equal(result.recovered, true);
  assert.equal(result.universe.words[0].meaning, 'ışık');
});

test('legacy words take precedence over a previous mirror', async () => {
  const legacy = [{ id: 'old', word: 'eager', meaning: 'hevesli' }];
  const result = await recoverUniverse(storage({ [LEGACY_KEY]: JSON.stringify(legacy) }), async () => snapshot);
  assert.equal(result.recovered, false);
  assert.equal(result.universe.words[0].word, 'eager');
});

test('mirror failure still permits an empty universe to open', async () => {
  const result = await recoverUniverse(storage({}), async () => { throw new Error('IndexedDB unavailable'); });
  assert.equal(result.recovered, false);
  assert.equal(result.universe.galaxies.length, 2);
});
