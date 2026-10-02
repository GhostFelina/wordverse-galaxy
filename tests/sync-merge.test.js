import { describe, expect, it } from 'vitest';
import { mergeGuestAndCloud } from '../src/sync-merge.js';

const universe = (galaxies, words = [], events = []) => ({
  version: 4,
  galaxies,
  activeGalaxyId: galaxies[0]?.id,
  words,
  events,
});

describe('first sign-in merge', () => {
  it('keeps both sides when IDs collide with different content and remaps cloud references', () => {
    const guest = universe(
      [{ id: 'g', name: 'Guest', language: 'English', meaningLanguage: 'tr' }],
      [{ id: 'w', galaxyId: 'g', word: 'sun', meaning: 'güneş' }],
      [{ id: 'e', galaxyId: 'g', wordId: 'w', type: 'word.added', after: { id: 'w', galaxyId: 'g', word: 'sun' } }],
    );
    const cloud = universe(
      [{ id: 'g', name: 'Cloud', language: 'Spanish', meaningLanguage: 'en' }],
      [{ id: 'w', galaxyId: 'g', word: 'luna', meaning: 'moon' }],
      [{ id: 'e', galaxyId: 'g', wordId: 'w', type: 'word.added', after: { id: 'w', galaxyId: 'g', word: 'luna' } }],
    );
    const ids = ['cloud-g', 'cloud-w', 'cloud-e'];
    const { universe: merged, summary } = mergeGuestAndCloud(guest, cloud, () => ids.shift());
    expect(merged.galaxies).toHaveLength(2);
    expect(merged.words).toHaveLength(2);
    expect(merged.events).toHaveLength(2);
    expect(merged.words[1]).toMatchObject({ id: 'cloud-w', galaxyId: 'cloud-g', word: 'luna' });
    expect(merged.events[1]).toMatchObject({
      id: 'cloud-e',
      galaxyId: 'cloud-g',
      wordId: 'cloud-w',
      after: { id: 'cloud-w', galaxyId: 'cloud-g' },
    });
    expect(summary.conflicts).toHaveLength(3);
    expect(guest.galaxies[0].name).toBe('Guest');
    expect(cloud.words[0].id).toBe('w');
  });

  it('deduplicates unchanged records and adds independent cloud entries', () => {
    const guest = universe([{ id: 'g', name: 'English', createdAt: '2026-01-01' }]);
    const cloud = universe(
      [{ id: 'g', name: 'English', createdAt: '2026-02-01' }],
      [{ id: 'w2', galaxyId: 'g', word: 'star', meaning: 'yıldız' }],
    );
    const { universe: merged, summary } = mergeGuestAndCloud(guest, cloud);
    expect(merged.galaxies).toHaveLength(1);
    expect(merged.words).toHaveLength(1);
    expect(summary).toEqual({ added: { galaxies: 0, words: 1, events: 0 }, conflicts: [] });
  });

  it('rejects invalid input before changing either source', () => {
    expect(() => mergeGuestAndCloud(universe([{ id: 'g' }]), { version: 3 })).toThrow('Invalid universe for sync');
  });
});
