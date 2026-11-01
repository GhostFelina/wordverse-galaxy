// A scheduled review session: due words first (most overdue first), then a
// bounded number of new words. "Again" re-queues a card within the session.
import { isDue, previewIntervals, review } from './review-schedule.js';

export const DEFAULT_NEW_LIMIT = 10;
export const DEFAULT_SESSION_LIMIT = 30;
const MAX_REQUEUES = 3;

export function buildReviewQueue(
  records,
  getCard,
  { now = new Date(), newLimit = DEFAULT_NEW_LIMIT, limit = DEFAULT_SESSION_LIMIT } = {},
) {
  const seen = new Set();
  const due = [];
  const fresh = [];
  for (const record of records) {
    if (!record?.id || !record.word || record.deletedAt || seen.has(record.id)) continue;
    seen.add(record.id);
    const card = getCard(record.id);
    const item = {
      id: record.id,
      word: record.word,
      meaning: record.meaning || '',
      example: record.example || '',
      createdAt: record.createdAt || '',
    };
    if (!card) fresh.push(item);
    else if (isDue(card, now)) due.push({ ...item, due: card.due });
  }
  due.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
  fresh.sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  const cap = Math.max(0, Math.floor(limit));
  return [...due, ...fresh.slice(0, Math.max(0, Math.floor(newLimit)))].slice(0, cap).map((item) => ({
    id: item.id,
    word: item.word,
    meaning: item.meaning,
    example: item.example,
    isNew: !getCard(item.id),
  }));
}

export function createReviewSession(records, { getCard, onReview, now = () => new Date(), ...options } = {}) {
  if (typeof getCard !== 'function') throw new Error('createReviewSession requires getCard');
  const queue = buildReviewQueue(records, getCard, { now: now(), ...options });
  const total = queue.length;
  const cards = new Map();
  const requeues = new Map();
  const grades = { again: 0, hard: 0, good: 0, easy: 0 };
  let revealed = false,
    completed = 0;
  const cardOf = (id) => (cards.has(id) ? cards.get(id) : getCard(id));
  const snapshot = () => {
    const current = queue[0];
    return {
      total,
      completed,
      remaining: queue.length,
      done: queue.length === 0,
      revealed,
      grades: { ...grades },
      intervals: current && revealed ? previewIntervals(cardOf(current.id), now()) : null,
      card: current
        ? {
            id: current.id,
            word: current.word,
            isNew: current.isNew,
            meaning: revealed ? current.meaning : null,
            example: revealed ? current.example : null,
          }
        : null,
    };
  };
  return {
    snapshot,
    reveal() {
      if (queue.length) revealed = true;
      return snapshot();
    },
    rate(grade) {
      if (!revealed || !queue.length || !(grade in grades)) return snapshot();
      const item = queue.shift();
      const next = review(cardOf(item.id), grade, now());
      cards.set(item.id, next);
      grades[grade]++;
      onReview?.(item.id, next, grade);
      const count = requeues.get(item.id) || 0;
      if (grade === 'again' && count < MAX_REQUEUES) {
        requeues.set(item.id, count + 1);
        queue.push({ ...item, isNew: false });
      } else completed++;
      revealed = false;
      return snapshot();
    },
  };
}
