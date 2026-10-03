import { expect, test } from 'vitest';
import { profileStatistics } from '../src/profile-statistics.js';

test('statistics include every live galaxy, group entries and return isolated chronological copies', () => {
  const universe = {
    galaxies: [{ id: 'a', language: 'English' }, { id: 'b', language: 'Spanish' }, { id: 'c' }],
    words: [
      { id: '2', galaxyId: 'a', word: 'new', createdAt: '2026-10-02', kind: 'conjunction' },
      { id: '1', galaxyId: 'a', word: 'old', createdAt: '2026-10-01' },
      { id: '3', galaxyId: 'b', word: 'bad date', createdAt: 'invalid' },
      { id: '4', galaxyId: 'missing', word: 'orphan', createdAt: '2026-10-01' },
      { id: '5', galaxyId: 'a', word: 'deleted', createdAt: '2020-01-01', deleted_at: '2026-10-01' },
    ],
  };
  const before = structuredClone(universe);
  const stats = profileStatistics(universe, Date.parse('2026-10-03'));
  expect(stats).toMatchObject({ stars: 3, planets: 1, galaxies: 3, oldest: { word: 'old' } });
  expect(stats.languages).toEqual([
    { language: 'English', count: 2 },
    { language: 'Spanish', count: 1 },
    { language: null, count: 1 },
  ]);
  expect(stats.recent.map((row) => row.word)).toEqual(['new', 'orphan', 'old']);
  stats.oldest.word = 'changed';
  stats.recent[0].word = 'changed';
  expect(universe).toEqual(before);
});

test('empty, invalid and future dates never fabricate a dated record', () => {
  expect(profileStatistics({})).toMatchObject({ stars: 0, planets: 0, galaxies: 0, oldest: null, recent: [] });
  expect(profileStatistics({ words: [{ id: 'future', createdAt: '2100-01-01' }] }, 0)).toMatchObject({
    stars: 1,
    oldest: null,
    recent: [],
  });
});
