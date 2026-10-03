import { expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { decodeCloudSnapshot, readCloudSnapshot, type CloudRow, type CloudSnapshot } from '../src/cloud-universe';

const owner = 'user-a';
const row = (id: string, payload = { id } as Record<string, unknown>, extra = {}): CloudRow => ({
  user_id: owner,
  id,
  payload,
  updated_at: '2026-10-03T06:00:00Z',
  deleted_at: null,
  ...extra,
});
const snapshot = (extra = {}): CloudSnapshot => ({
  galaxies: [row('g')],
  words: [],
  events: [],
  settings: [],
  ...extra,
});

test('cloud decoding retains future entry fields and settings without mutating records', () => {
  const source = snapshot({
    words: [
      row(
        'w',
        { id: 'w', galaxyId: 'g', content: { notes: ['keep'] }, review_state: { due: 'later' } },
        { galaxy_id: 'g' },
      ),
    ],
    settings: [row('settings', { version: 4, activeGalaxyId: 'g', futureSetting: true })],
  });
  const universe = decodeCloudSnapshot(source, owner);
  expect(universe.words[0]).toMatchObject({ content: { notes: ['keep'] }, review_state: { due: 'later' } });
  expect(universe.futureSetting).toBe(true);
  (universe.words[0].content as { notes: string[] }).notes.push('new');
  expect(source.words[0].payload.content).toEqual({ notes: ['keep'] });
});

test('deleted galaxies and entries stay hidden while historical events and tombstones remain intact', () => {
  const source = snapshot({
    galaxies: [row('g'), row('deleted-g', { id: 'deleted-g' }, { deleted_at: '2026-10-03T06:01:00Z' })],
    words: [
      row('w', { id: 'w', galaxyId: 'g' }, { galaxy_id: 'g', deleted_at: '2026-10-03T06:01:00Z' }),
      row('child', { id: 'child', galaxyId: 'deleted-g' }, { galaxy_id: 'deleted-g' }),
    ],
    events: [row('e', { id: 'e', type: 'word.deleted', before: { id: 'w' } })],
  });
  const universe = decodeCloudSnapshot(source, owner);
  expect(universe.galaxies).toHaveLength(1);
  expect(universe.words).toHaveLength(0);
  expect(universe.events).toHaveLength(1);
  expect(source.words).toHaveLength(2);
});

test('foreign accounts, identity mismatches, unsupported schemas and dangling entries are rejected', () => {
  expect(() =>
    decodeCloudSnapshot(snapshot({ galaxies: [row('g', { id: 'g' }, { user_id: 'user-b' })] }), owner),
  ).toThrow('account mismatch');
  expect(() => decodeCloudSnapshot(snapshot({ galaxies: [row('g', { id: 'wrong' })] }), owner)).toThrow('identity');
  expect(() => decodeCloudSnapshot(snapshot({ settings: [row('settings', { version: 5 })] }), owner)).toThrow(
    'Unsupported',
  );
  expect(() =>
    decodeCloudSnapshot(
      snapshot({ words: [row('w', { id: 'w', galaxyId: 'missing' }, { galaxy_id: 'missing' })] }),
      owner,
    ),
  ).toThrow('Missing cloud galaxy');
});

test('empty cloud accounts remain empty for the first guest merge', () => {
  expect(decodeCloudSnapshot(snapshot({ galaxies: [] }), owner)).toEqual({
    version: 4,
    activeGalaxyId: null,
    galaxies: [],
    words: [],
    events: [],
  });
});

test('cloud reads page beyond 1000 records and always filter by account', async () => {
  const data = Array.from({ length: 1201 }, (_, index) => row(`g-${index}`));
  const filters: string[] = [];
  const ranges: number[] = [];
  const client = {
    from: (table: string) => ({
      select: () => ({
        eq: (_column: string, id: string) => {
          filters.push(id);
          return {
            maybeSingle: async () => ({ data: null, error: null }),
            order: () => ({
              range: async (start: number, end: number) => {
                if (table === 'wordverse_galaxies') ranges.push(start);
                return { data: table === 'wordverse_galaxies' ? data.slice(start, end + 1) : [], error: null };
              },
            }),
          };
        },
      }),
    }),
  } as unknown as SupabaseClient;
  const result = await readCloudSnapshot(client, owner);
  expect(result.galaxies).toHaveLength(1201);
  expect(ranges).toEqual([0, 500, 1000]);
  expect(filters.every((id) => id === owner)).toBe(true);
});
