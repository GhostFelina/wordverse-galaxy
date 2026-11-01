import { describe, expect, it } from 'vitest';
import { review } from '../src/review-schedule.js';
import { createReviewStore } from '../src/review-store.js';
import { syncReviewProgress } from '../src/review-sync.js';

const OWNER = '22222222-2222-4222-8222-222222222222';
const at = (iso) => new Date(iso);

function memoryStorage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)) };
}

// In-memory stand-in for Supabase with the migration's conditional-write semantics.
function fakeBackend({ owner = OWNER, beforeWrite } = {}) {
  let row = null;
  let tick = 0;
  const calls = { reads: 0, writes: 0, conflicts: 0 };
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: owner } }, error: null }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            calls.reads++;
            return { data: row && structuredClone(row), error: null };
          },
        }),
      }),
    }),
    rpc: async (_name, input) => {
      await beforeWrite?.();
      if ((row?.updated_at ?? null) !== input.p_expected_updated_at) {
        calls.conflicts++;
        return { data: { status: 'conflict', row: row && structuredClone(row) }, error: null };
      }
      calls.writes++;
      row = {
        user_id: input.p_owner_id,
        payload: structuredClone(input.p_payload),
        updated_at: new Date(Date.UTC(2026, 10, 1, 12, 0, ++tick)).toISOString(),
      };
      return { data: { status: 'applied', row: structuredClone(row) }, error: null };
    },
  };
  return {
    client,
    calls,
    row: () => row,
    setRow: (value) => {
      row = value;
    },
  };
}

describe('review progress sync', () => {
  it('uploads local progress, then reports unchanged without another write', async () => {
    const backend = fakeBackend();
    const store = createReviewStore(memoryStorage(), `personal:${OWNER}`);
    store.record('a', review(null, 'good', at('2026-11-01T09:00:00Z')), 'good', at('2026-11-01T09:00:00Z'));
    await expect(syncReviewProgress({ client: backend.client, ownerId: OWNER, store })).resolves.toMatchObject({
      status: 'synced',
    });
    expect(Object.keys(backend.row().payload.cards)).toEqual(['a']);
    await expect(syncReviewProgress({ client: backend.client, ownerId: OWNER, store })).resolves.toMatchObject({
      status: 'unchanged',
    });
    expect(backend.calls.writes).toBe(1);
  });

  it('merges two devices so neither loses a review', async () => {
    const backend = fakeBackend();
    const laptop = createReviewStore(memoryStorage(), `personal:${OWNER}`);
    const phone = createReviewStore(memoryStorage(), `personal:${OWNER}`);
    laptop.record('a', review(null, 'good', at('2026-11-01T09:00:00Z')), 'good', at('2026-11-01T09:00:00Z'));
    phone.record('b', review(null, 'easy', at('2026-11-01T10:00:00Z')), 'easy', at('2026-11-01T10:00:00Z'));
    // A newer review of the same word on the phone must win over the laptop's older one.
    phone.record('a', review(null, 'hard', at('2026-11-01T11:00:00Z')), 'hard', at('2026-11-01T11:00:00Z'));
    await syncReviewProgress({ client: backend.client, ownerId: OWNER, store: laptop });
    await syncReviewProgress({ client: backend.client, ownerId: OWNER, store: phone });
    await syncReviewProgress({ client: backend.client, ownerId: OWNER, store: laptop });
    for (const store of [laptop, phone]) {
      expect(store.card('b')).not.toBeNull();
      expect(store.card('a').lastReview).toBe('2026-11-01T11:00:00.000Z');
    }
    expect(Object.keys(backend.row().payload.cards).sort()).toEqual(['a', 'b']);
  });

  it('retries after a concurrent write and keeps both changes', async () => {
    let interfered = false;
    const backend = fakeBackend({
      beforeWrite: async () => {
        if (interfered) return;
        interfered = true;
        const other = createReviewStore(memoryStorage(), 'other-device');
        other.record('z', review(null, 'good', at('2026-11-01T08:00:00Z')), 'good', at('2026-11-01T08:00:00Z'));
        backend.setRow({ user_id: OWNER, payload: other.export(), updated_at: '2026-11-01T11:59:59.000Z' });
      },
    });
    const store = createReviewStore(memoryStorage(), `personal:${OWNER}`);
    store.record('a', review(null, 'good', at('2026-11-01T09:00:00Z')), 'good', at('2026-11-01T09:00:00Z'));
    await syncReviewProgress({ client: backend.client, ownerId: OWNER, store });
    expect(backend.calls.conflicts).toBe(1);
    expect(Object.keys(backend.row().payload.cards).sort()).toEqual(['a', 'z']);
    expect(store.card('z')).not.toBeNull();
  });

  it('refuses another account and keeps local progress on failure', async () => {
    const store = createReviewStore(memoryStorage(), `personal:${OWNER}`);
    store.record('a', review(null, 'good', at('2026-11-01T09:00:00Z')), 'good', at('2026-11-01T09:00:00Z'));
    const switched = fakeBackend({ owner: 'someone-else' });
    await expect(syncReviewProgress({ client: switched.client, ownerId: OWNER, store })).rejects.toThrow('changed');
    const foreign = fakeBackend();
    foreign.setRow({ user_id: 'someone-else', payload: { version: 1, cards: {}, days: {} }, updated_at: '2026-11-01' });
    await expect(syncReviewProgress({ client: foreign.client, ownerId: OWNER, store })).rejects.toThrow('mismatch');
    const broken = fakeBackend();
    broken.client.rpc = async () => ({ data: null, error: { message: 'offline' } });
    await expect(syncReviewProgress({ client: broken.client, ownerId: OWNER, store })).rejects.toThrow('write failed');
    expect(store.card('a').reps).toBe(1);
    await expect(syncReviewProgress({ client: null, ownerId: OWNER, store })).rejects.toThrow('unavailable');
  });
});
