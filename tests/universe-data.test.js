import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_KEY, UNIVERSE_KEY, loadUniverse, starAge, mergeUniverse } from '../src/universe-data.js';

function storage(entries) {
  const values = new Map(Object.entries(entries));
  return { getItem: key => values.get(key) ?? null };
}

test('older words migrate into the English galaxy without losing their dates or meaning', () => {
  const legacy = [{ id: 'old-1', word: 'eager', meaning: 'hevesli', createdAt: '2025-01-01T00:00:00.000Z', x: 31, y: 2, z: 17 }];
  const universe = loadUniverse(storage({ [LEGACY_KEY]: JSON.stringify(legacy) }));
  assert.equal(universe.galaxies.length, 2);
  assert.equal(universe.galaxies[1].language, 'İspanyolca');
  assert.equal(universe.words.filter(w => w.galaxyId === universe.galaxies[1].id).length, 0);
  assert.equal(universe.words[0].galaxyId, universe.activeGalaxyId);
  assert.equal(universe.words[0].meaning, 'hevesli');
  assert.equal(universe.words[0].createdAt, legacy[0].createdAt);
  assert.equal(universe.events[0].type, 'word.imported');
});

test('existing multi galaxy data remains intact', () => {
  const state = { version: 3, activeGalaxyId: 'es', galaxies: [{ id: 'en' }, { id: 'es' }], words: [{ id: 'luz', galaxyId: 'es' }], events: [{ id: 'event-1' }] };
  assert.deepEqual(loadUniverse(storage({ [UNIVERSE_KEY]: JSON.stringify(state) })), state);
});

test('star light follows the compressed age stages', () => {
  const now = Date.parse('2026-10-02T12:00:00.000Z');
  assert.match(starAge(new Date(now).toISOString(), now).stage, /beyaz/);
  assert.match(starAge(new Date(now - 100 * 86400000).toISOString(), now).stage, /Kızıl dev/);
  assert.match(starAge(new Date(now - 400 * 86400000).toISOString(), now).stage, /Beyaz cüce/);
});

test('backup merge preserves existing words and does not duplicate imported events', () => {
  const target = { version: 3, galaxies: [{ id: 'en', name: 'English', language: 'English' }], words: [{ id: 'first', galaxyId: 'en', word: 'light', meaning: 'ışık' }], events: [{ id: 'event-1', type: 'word.created' }] };
  const backup = { version: 3, galaxies: [{ id: 'es', name: 'Español', language: 'İspanyolca' }], words: [{ id: 'second', galaxyId: 'es', word: 'luz', meaning: 'ışık' }], events: [{ id: 'event-2', type: 'word.created' }] };
  mergeUniverse(target, backup);
  mergeUniverse(target, backup);
  assert.equal(target.galaxies.length, 2);
  assert.equal(target.words.length, 2);
  assert.equal(target.events.length, 2);
  assert.equal(target.words[0].word, 'light');
});
