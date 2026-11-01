// Persistent spaced-repetition scheduling based on the published FSRS-4.5 model.
// Pure functions only: callers own storage, clocks and record identity.
// Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm

export const GRADES = Object.freeze({ again: 1, hard: 2, good: 3, easy: 4 });
export const GRADE_NAMES = Object.freeze(['again', 'hard', 'good', 'easy']);
export const DEFAULT_RETENTION = 0.9;
export const MAX_INTERVAL_DAYS = 36500;
export const RELEARN_MINUTES = 10;
// FSRS-4.5 default parameters trained on a large public review corpus.
export const DEFAULT_WEIGHTS = Object.freeze([
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587,
  0.2272, 2.8755,
]);
const DECAY = -0.5;
const FACTOR = 19 / 81;
const DAY = 86_400_000;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value, fallback) => (Number.isFinite(value) ? value : fallback);

export function gradeValue(grade) {
  const value = typeof grade === 'string' ? GRADES[grade] : grade;
  if (![1, 2, 3, 4].includes(value)) throw new Error(`Unknown review grade: ${grade}`);
  return value;
}

/** Probability of recall after `elapsedDays` for a memory with `stability` days. */
export function retrievability(elapsedDays, stability) {
  if (!(stability > 0)) return 0;
  return (1 + (FACTOR * Math.max(0, elapsedDays)) / stability) ** DECAY;
}

/** Days until retrievability falls to the requested retention. */
export function intervalDays(stability, retention = DEFAULT_RETENTION) {
  const days = (stability / FACTOR) * (retention ** (1 / DECAY) - 1);
  return clamp(Math.round(days), 1, MAX_INTERVAL_DAYS);
}

const initialStability = (g, w) => Math.max(0.1, w[g - 1]);
const initialDifficulty = (g, w) => clamp(w[4] - (g - 3) * w[5], 1, 10);

function nextDifficulty(d, g, w) {
  const shifted = d - w[6] * (g - 3);
  return clamp(w[7] * initialDifficulty(4, w) + (1 - w[7]) * shifted, 1, 10);
}

function recallStability(d, s, r, g, w) {
  const hardPenalty = g === 2 ? w[15] : 1;
  const easyBonus = g === 4 ? w[16] : 1;
  return s * (1 + Math.exp(w[8]) * (11 - d) * s ** -w[9] * (Math.exp(w[10] * (1 - r)) - 1) * hardPenalty * easyBonus);
}

function forgetStability(d, s, r, w) {
  const next = w[11] * d ** -w[12] * ((s + 1) ** w[13] - 1) * Math.exp(w[14] * (1 - r));
  return Math.max(0.1, Math.min(next, s));
}

/** Validate and normalize a stored card; returns null for unusable data. */
export function normalizeCard(card) {
  if (!card || typeof card !== 'object') return null;
  const due = Date.parse(card.due);
  const last = Date.parse(card.lastReview);
  const stability = Number(card.stability);
  const difficulty = Number(card.difficulty);
  if (!Number.isFinite(due) || !Number.isFinite(last) || !(stability > 0) || !(difficulty >= 1 && difficulty <= 10))
    return null;
  return {
    due: new Date(due).toISOString(),
    lastReview: new Date(last).toISOString(),
    stability,
    difficulty,
    reps: Math.max(0, Math.floor(finite(Number(card.reps), 0))),
    lapses: Math.max(0, Math.floor(finite(Number(card.lapses), 0))),
    state: ['learning', 'review', 'relearning'].includes(card.state) ? card.state : 'review',
  };
}

/**
 * Apply one review. `card` is null for a word that has never been reviewed.
 * Returns a new card; the input is never mutated.
 */
export function review(
  card,
  grade,
  now = new Date(),
  { retention = DEFAULT_RETENTION, weights = DEFAULT_WEIGHTS } = {},
) {
  const g = gradeValue(grade);
  const at = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(at)) throw new Error('Invalid review time');
  const previous = normalizeCard(card);
  let stability, difficulty;
  if (!previous) {
    stability = initialStability(g, weights);
    difficulty = initialDifficulty(g, weights);
  } else {
    const elapsed = Math.max(0, (at - Date.parse(previous.lastReview)) / DAY);
    const r = retrievability(elapsed, previous.stability);
    difficulty = nextDifficulty(previous.difficulty, g, weights);
    stability =
      g === 1
        ? forgetStability(previous.difficulty, previous.stability, r, weights)
        : recallStability(previous.difficulty, previous.stability, r, g, weights);
  }
  const reps = (previous?.reps || 0) + 1;
  const lapses = (previous?.lapses || 0) + (g === 1 && previous ? 1 : 0);
  let dueAt, state;
  if (g === 1) {
    dueAt = at + RELEARN_MINUTES * 60_000;
    state = previous && previous.state !== 'learning' ? 'relearning' : 'learning';
  } else {
    dueAt = at + intervalDays(stability, retention) * DAY;
    state = 'review';
  }
  return {
    due: new Date(dueAt).toISOString(),
    lastReview: new Date(at).toISOString(),
    stability: Number(stability.toFixed(4)),
    difficulty: Number(difficulty.toFixed(4)),
    reps,
    lapses,
    state,
  };
}

/**
 * Preview the next interval for every grade, keeping hard ≤ good < easy so the
 * buttons never show a confusing order.
 */
export function previewIntervals(card, now = new Date(), options) {
  const at = now instanceof Date ? now.getTime() : Date.parse(now);
  const result = {};
  for (const name of GRADE_NAMES) result[name] = Date.parse(review(card, name, now, options).due) - at;
  if (result.hard > result.good) result.hard = result.good;
  if (result.easy <= result.good) result.easy = result.good + DAY;
  return result;
}

export const isDue = (card, now = new Date()) => {
  const normalized = normalizeCard(card);
  return !normalized || Date.parse(normalized.due) <= (now instanceof Date ? now.getTime() : Date.parse(now));
};

/** A memory counts as mature once its stability reaches three weeks (the common SRS convention). */
export const isMature = (card) => (normalizeCard(card)?.stability || 0) >= 21;

/** Compact, locale-neutral duration parts for button labels. */
export function durationParts(ms) {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return { value: minutes, unit: 'minute' };
  const hours = Math.round(minutes / 60);
  if (hours < 24) return { value: hours, unit: 'hour' };
  const days = Math.round(hours / 24);
  if (days < 31) return { value: days, unit: 'day' };
  if (days < 365) return { value: Math.round(days / 30), unit: 'month' };
  return { value: Number((days / 365).toFixed(1)), unit: 'year' };
}
