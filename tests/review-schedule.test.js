import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEIGHTS,
  durationParts,
  intervalDays,
  isDue,
  isMature,
  normalizeCard,
  previewIntervals,
  retrievability,
  review,
} from '../src/review-schedule.js';
import { buildReviewQueue, createReviewSession } from '../src/review-session.js';
import { createReviewStore, localDay, reviewSummary, sanitizeReviewState, streakDays } from '../src/review-store.js';

const DAY = 86_400_000;
const start = new Date('2026-11-01T09:00:00Z');
const later = (days) => new Date(start.getTime() + days * DAY);

describe('FSRS scheduling', () => {
  it('matches the FSRS forgetting curve at the target retention', () => {
    expect(retrievability(0, 5)).toBe(1);
    expect(retrievability(5, 5)).toBeCloseTo(0.9, 6);
    expect(intervalDays(5)).toBe(5);
    expect(intervalDays(0.01)).toBe(1);
    expect(intervalDays(1e9)).toBe(36500);
  });

  it('initializes new cards from the default stability per grade', () => {
    const good = review(null, 'good', start);
    expect(good.stability).toBeCloseTo(DEFAULT_WEIGHTS[2], 3);
    expect(good.state).toBe('review');
    expect(Date.parse(good.due) - start.getTime()).toBe(intervalDays(DEFAULT_WEIGHTS[2]) * DAY);
    const again = review(null, 'again', start);
    expect(again.state).toBe('learning');
    expect(Date.parse(again.due) - start.getTime()).toBe(10 * 60_000);
    expect(review(null, 'easy', start).difficulty).toBeLessThan(review(null, 'hard', start).difficulty);
  });

  it('grows intervals with successful reviews and shrinks them after a lapse', () => {
    let card = review(null, 'good', start);
    const first = card.stability;
    card = review(card, 'good', card.due);
    expect(card.stability).toBeGreaterThan(first);
    expect(card.reps).toBe(2);
    const beforeLapse = card.stability;
    const lapsed = review(card, 'again', card.due);
    expect(lapsed.stability).toBeLessThan(beforeLapse);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.state).toBe('relearning');
  });

  it('keeps preview intervals ordered and never mutates the input card', () => {
    const card = Object.freeze(review(null, 'good', start));
    const preview = previewIntervals(card, later(3));
    expect(preview.again).toBeLessThan(preview.hard);
    expect(preview.hard).toBeLessThanOrEqual(preview.good);
    expect(preview.good).toBeLessThan(preview.easy);
    expect(() => review(card, 'nope', start)).toThrow();
  });

  it('rejects corrupt stored cards and reports due/mature state', () => {
    expect(normalizeCard({ due: 'x' })).toBeNull();
    expect(normalizeCard({ due: start, lastReview: start, stability: 2, difficulty: 11 })).toBeNull();
    const card = review(null, 'good', start);
    expect(isDue(card, start)).toBe(false);
    expect(isDue(card, card.due)).toBe(true);
    expect(isDue(null, start)).toBe(true);
    expect(isMature(card)).toBe(false);
    expect(isMature({ ...card, stability: 30 })).toBe(true);
  });

  it('formats compact durations', () => {
    expect(durationParts(10 * 60_000)).toEqual({ value: 10, unit: 'minute' });
    expect(durationParts(3 * DAY)).toEqual({ value: 3, unit: 'day' });
    expect(durationParts(90 * DAY)).toEqual({ value: 3, unit: 'month' });
    expect(durationParts(730 * DAY)).toEqual({ value: 2, unit: 'year' });
  });
});

const records = [
  { id: 'n2', word: 'Newer', meaning: 'm', createdAt: '2026-10-03' },
  { id: 'n1', word: 'Older', meaning: 'm', createdAt: '2026-10-01' },
  { id: 'd1', word: 'Due late', meaning: 'm', createdAt: '2026-09-01' },
  { id: 'd2', word: 'Due early', meaning: 'm', createdAt: '2026-09-02' },
  { id: 'f', word: 'Future', meaning: 'm', createdAt: '2026-09-03' },
  { id: 'x', word: 'Deleted', meaning: 'm', deletedAt: '2026-10-05' },
];
const stored = {
  d1: { ...review(null, 'good', later(-10)), due: later(-1).toISOString() },
  d2: { ...review(null, 'good', later(-10)), due: later(-5).toISOString() },
  f: review(null, 'easy', start),
};

describe('review sessions', () => {
  it('orders the most overdue cards first, then oldest new words, within limits', () => {
    const queue = buildReviewQueue(records, (id) => stored[id] || null, { now: start, newLimit: 1 });
    expect(queue.map((item) => item.id)).toEqual(['d2', 'd1', 'n1']);
    expect(queue[2].isNew).toBe(true);
    expect(buildReviewQueue(records, (id) => stored[id] || null, { now: start, limit: 2 })).toHaveLength(2);
  });

  it('reveals before rating, re-queues again and reports every review', () => {
    const reviews = [];
    const session = createReviewSession(records.slice(0, 2), {
      getCard: () => null,
      onReview: (id, card, grade) => reviews.push({ id, grade, state: card.state }),
      now: () => start,
    });
    expect(session.rate('good').completed).toBe(0);
    expect(session.reveal().card.meaning).toBe('m');
    expect(session.snapshot().intervals.good).toBeGreaterThan(0);
    const first = session.snapshot().card.id;
    session.rate('again');
    expect(session.snapshot()).toMatchObject({ completed: 0, remaining: 2, revealed: false });
    session.reveal();
    session.rate('good');
    expect(session.snapshot().card.id).toBe(first);
    session.reveal();
    session.rate('easy');
    expect(session.snapshot()).toMatchObject({ done: true, completed: 2, total: 2 });
    expect(reviews.map((r) => r.grade)).toEqual(['again', 'good', 'easy']);
    expect(reviews[0].state).toBe('learning');
  });

  it('bounds repeated failures so a session always ends', () => {
    const session = createReviewSession([records[0]], { getCard: () => null, now: () => start });
    for (let i = 0; i < 10 && !session.snapshot().done; i++) {
      session.reveal();
      session.rate('again');
    }
    expect(session.snapshot().done).toBe(true);
    expect(session.snapshot().grades.again).toBe(4);
  });
});

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    data,
  };
}

describe('review store', () => {
  it('isolates owners and survives reload', () => {
    const storage = memoryStorage();
    const guest = createReviewStore(storage, 'guest-personal:guest');
    expect(guest.record('n1', review(null, 'good', start), 'good', start)).toBe(true);
    expect(createReviewStore(storage, 'account:owner-b').card('n1')).toBeNull();
    const reloaded = createReviewStore(storage, 'guest-personal:guest');
    expect(reloaded.card('n1').reps).toBe(1);
    expect(reloaded.snapshot().days[localDay(start)]).toEqual({ reviewed: 1, again: 0, learned: 1 });
  });

  it('summarizes due, new, learning and mature words for active records', () => {
    const state = sanitizeReviewState({
      version: 1,
      cards: { ...stored, mature: { ...stored.f, stability: 40 } },
      days: {},
    });
    const summary = reviewSummary(state, [...records, { id: 'mature', word: 'm' }], start);
    expect(summary).toMatchObject({ due: 2, fresh: 2, learning: 3, mature: 1 });
    expect(summary.nextDue).toBe(stored.f.due);
  });

  it('counts streaks ending today or yesterday', () => {
    const day = (offset) => localDay(new Date(2026, 10, 10 + offset));
    const days = { [day(0)]: { reviewed: 2 }, [day(-1)]: { reviewed: 1 }, [day(-3)]: { reviewed: 4 } };
    expect(streakDays(days, new Date(2026, 10, 10, 12))).toBe(2);
    expect(streakDays(days, new Date(2026, 10, 11, 12))).toBe(2);
    expect(streakDays(days, new Date(2026, 10, 13, 12))).toBe(0);
  });

  it('prunes deleted words, tolerates corrupt storage and merges imports by recency', () => {
    const storage = memoryStorage();
    storage.setItem('wordverse.reviews.v1:o', '{broken');
    const store = createReviewStore(storage, 'o');
    store.record('a', review(null, 'good', start), 'good', start);
    store.record('b', review(null, 'good', start), 'good', start);
    store.prune(['a']);
    expect(store.card('b')).toBeNull();
    const older = review(null, 'hard', later(-3));
    const newer = review(null, 'easy', later(2));
    expect(store.import({ version: 1, cards: { a: older, c: newer }, days: {} }, new Map([['c', 'c-copy']]))).toBe(1);
    expect(store.card('a').lastReview).toBe(start.toISOString());
    expect(store.card('c-copy').lastReview).toBe(newer.lastReview);
    expect(store.import({ version: 2 })).toBe(0);
  });

  it('keeps working when the browser refuses writes', () => {
    const store = createReviewStore(
      {
        getItem: () => null,
        setItem: () => {
          throw new Error('quota');
        },
      },
      'o',
    );
    expect(store.record('a', review(null, 'good', start), 'good', start)).toBe(false);
    expect(store.card('a').reps).toBe(1);
  });
});
