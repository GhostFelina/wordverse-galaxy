// Owner-isolated persistence for spaced-repetition state.
// Review progress lives beside, never inside, vocabulary records: record IDs,
// coordinates, dates and sync payloads stay untouched.
import { isDue, isMature, normalizeCard } from './review-schedule.js';

export const REVIEW_KEY_PREFIX = 'wordverse.reviews.v1:';
const MAX_DAYS = 400;

export const localDay = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const emptyState = () => ({ version: 1, cards: {}, days: {} });

export function sanitizeReviewState(value) {
  const state = emptyState();
  if (!value || typeof value !== 'object' || value.version !== 1) return state;
  for (const [id, card] of Object.entries(value.cards || {})) {
    const normalized = normalizeCard(card);
    if (id && normalized) state.cards[id] = normalized;
  }
  for (const [day, entry] of Object.entries(value.days || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !entry || typeof entry !== 'object') continue;
    const reviewed = Math.max(0, Math.floor(Number(entry.reviewed) || 0));
    const again = Math.min(reviewed, Math.max(0, Math.floor(Number(entry.again) || 0)));
    const learned = Math.max(0, Math.floor(Number(entry.learned) || 0));
    if (reviewed || learned) state.days[day] = { reviewed, again, learned };
  }
  const days = Object.keys(state.days).sort();
  for (const day of days.slice(0, Math.max(0, days.length - MAX_DAYS))) delete state.days[day];
  return state;
}

/** Consecutive local days with at least one review, ending today or yesterday. */
export function streakDays(days, today = new Date()) {
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days[localDay(cursor)]?.reviewed) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days[localDay(cursor)]?.reviewed) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Summary for one galaxy's active records. Unknown or deleted words are ignored. */
export function reviewSummary(state, records, now = new Date()) {
  let due = 0,
    fresh = 0,
    learning = 0,
    mature = 0,
    nextDue = null;
  for (const record of records) {
    if (!record?.id || record.deletedAt) continue;
    const card = state.cards[record.id];
    if (!card) {
      fresh++;
      continue;
    }
    if (isDue(card, now)) due++;
    else if (!nextDue || card.due < nextDue) nextDue = card.due;
    if (isMature(card)) mature++;
    else learning++;
  }
  const today = state.days[localDay(now)] || { reviewed: 0, again: 0, learned: 0 };
  return { due, fresh, learning, mature, nextDue, today, streak: streakDays(state.days, now) };
}

export function createReviewStore(storage, ownerKey) {
  const key = REVIEW_KEY_PREFIX + ownerKey;
  let state;
  try {
    state = sanitizeReviewState(JSON.parse(storage.getItem(key) || 'null'));
  } catch {
    state = emptyState();
  }
  const save = () => {
    try {
      storage.setItem(key, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  };
  return {
    ownerKey,
    card: (id) => (state.cards[id] ? { ...state.cards[id] } : null),
    snapshot: () => structuredClone(state),
    summary: (records, now) => reviewSummary(state, records, now),
    /** Record one completed review. Returns whether the browser accepted the write. */
    record(id, card, grade, now = new Date()) {
      const normalized = normalizeCard(card);
      if (!id || !normalized) return false;
      const wasNew = !state.cards[id];
      state.cards[id] = normalized;
      const day = localDay(now);
      const entry = (state.days[day] ||= { reviewed: 0, again: 0, learned: 0 });
      entry.reviewed++;
      if (grade === 'again' || grade === 1) entry.again++;
      if (wasNew) entry.learned++;
      state = sanitizeReviewState(state);
      return save();
    },
    /** Drop progress for words that no longer exist in any galaxy of this owner. */
    prune(existingIds) {
      const keep = new Set(existingIds);
      let changed = false;
      for (const id of Object.keys(state.cards))
        if (!keep.has(id)) {
          delete state.cards[id];
          changed = true;
        }
      return changed ? save() : true;
    },
    export: () => structuredClone(state),
    /** Merge imported progress, keeping the most recent review of each word. */
    import(value, idMap = new Map()) {
      const incoming = sanitizeReviewState(value);
      let merged = 0;
      for (const [sourceId, card] of Object.entries(incoming.cards)) {
        const id = idMap.get(sourceId) ?? sourceId;
        const current = state.cards[id];
        if (!current || card.lastReview > current.lastReview) {
          state.cards[id] = card;
          merged++;
        }
      }
      for (const [day, entry] of Object.entries(incoming.days)) {
        const current = state.days[day];
        if (!current || entry.reviewed > current.reviewed) state.days[day] = entry;
      }
      state = sanitizeReviewState(state);
      save();
      return merged;
    },
  };
}

/**
 * Profile insights over an owner's records: 30-day review history, a 7-day due
 * forecast (overdue cards count today) and 30-day recall rate. Read-only.
 */
export function reviewInsights(state, records, now = new Date(), { historyDays = 30, forecastDays = 7 } = {}) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const shift = (offset) => {
    const day = new Date(today);
    day.setDate(day.getDate() + offset);
    return day;
  };
  const history = [];
  let reviewed = 0,
    again = 0;
  for (let offset = 1 - historyDays; offset <= 0; offset++) {
    const day = localDay(shift(offset));
    const entry = state.days[day] || { reviewed: 0, again: 0 };
    history.push({ day, reviewed: entry.reviewed, again: entry.again });
    reviewed += entry.reviewed;
    again += entry.again;
  }
  const forecast = Array.from({ length: forecastDays }, (_, offset) => ({ day: localDay(shift(offset)), due: 0 }));
  const horizon = shift(forecastDays).getTime();
  const ids = new Set(records.filter((record) => record?.id && !record.deletedAt).map((record) => record.id));
  let reviewedWords = 0,
    mature = 0;
  for (const [id, card] of Object.entries(state.cards)) {
    if (!ids.has(id)) continue;
    reviewedWords++;
    if (isMature(card)) mature++;
    const due = Date.parse(card.due);
    if (due >= horizon) continue;
    const index = due < today.getTime() ? 0 : Math.floor((due - today.getTime()) / 86_400_000);
    // Local midnight shifts with DST; clamp so a 23/25-hour day never escapes the window.
    forecast[Math.min(forecastDays - 1, Math.max(0, index))].due++;
  }
  return {
    history,
    forecast,
    reviewed,
    retention: reviewed ? (reviewed - again) / reviewed : null,
    reviewedWords,
    newWords: ids.size - reviewedWords,
    mature,
    streak: streakDays(state.days, now),
  };
}
