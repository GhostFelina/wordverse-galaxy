import { expect, it } from 'vitest';
import { queryAtlas } from '../src/collection-atlas.js';

const records = Object.freeze([
  Object.freeze({ id: 'recent', word: 'İnce', meaning: 'déjà vu', createdAt: '2026-10-10', kind: 'word' }),
  Object.freeze({ id: 'old', word: 'Atlas 2', meaning: 'Map', createdAt: '2026-10-01' }),
  Object.freeze({ id: 'invalid', word: 'Atlas 10', createdAt: 'invalid' }),
  Object.freeze({
    id: 'conjunction',
    word: 'However',
    meaning: 'Bununla birlikte',
    kind: 'conjunction',
    createdAt: '2026-10-05',
  }),
  Object.freeze({ id: 'deleted', word: 'Gone', deletedAt: '2026-10-11', createdAt: '2026-10-11' }),
]);

it('sorts imported records by real dates with unknown dates last, retaining original records and order', () => {
  const before = JSON.stringify(records);
  expect(queryAtlas(records).map((record) => record.id)).toEqual(['recent', 'conjunction', 'old', 'invalid']);
  expect(queryAtlas(records, { sort: 'oldest' }).map((record) => record.id)).toEqual([
    'old',
    'conjunction',
    'recent',
    'invalid',
  ]);
  expect(queryAtlas(records)[0]).toBe(records[0]);
  expect(JSON.stringify(records)).toBe(before);
});

it('combines type filtering with locale aware and Unicode normalized word or meaning search', () => {
  expect(queryAtlas(records, { query: ' İNCE ', kind: 'word' }).map((record) => record.id)).toEqual(['recent']);
  expect(queryAtlas(records, { query: 'de\u0301ja\u0300', locale: 'en' }).map((record) => record.id)).toEqual([
    'recent',
  ]);
  expect(queryAtlas(records, { query: 'birlikte', kind: 'conjunction' }).map((record) => record.id)).toEqual([
    'conjunction',
  ]);
  expect(queryAtlas(records, { query: 'birlikte', kind: 'word' })).toEqual([]);
});

it('uses natural alphabetical order and stable ordering for equal names', () => {
  expect(
    queryAtlas(records, { sort: 'alphabetical', locale: 'en' })
      .slice(0, 2)
      .map((record) => record.id),
  ).toEqual(['old', 'invalid']);
  const repeated = [
    { id: 'first', word: 'Same' },
    { id: 'second', word: 'Same' },
  ];
  expect(queryAtlas(repeated, { sort: 'alphabetical' }).map((record) => record.id)).toEqual(['first', 'second']);
});
