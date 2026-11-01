// Account synchronization for spaced-repetition progress.
// Merge is commutative (latest review per card, larger daily count), so the
// client reads, merges and writes with optimistic concurrency; a conflict means
// another device wrote first, and the loop merges that newer row and retries.
import { sanitizeReviewState } from './review-store.js';

const MAX_ATTEMPTS = 4;

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

function validRow(row, ownerId) {
  if (row === null || row === undefined) return null;
  if (typeof row !== 'object' || row.user_id !== ownerId) throw new Error('Review sync account mismatch');
  if (!Number.isFinite(Date.parse(row.updated_at))) throw new Error('Invalid review sync timestamp');
  return row;
}

/**
 * Two-way sync of one owner's review progress with `wordverse_reviews`.
 * Resolves to { status: 'synced' | 'unchanged', merged } or throws on failure;
 * local progress is never discarded.
 */
export async function syncReviewProgress({ client, ownerId, store }) {
  if (!client || !ownerId || !store) throw new Error('Review sync unavailable');
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || auth?.user?.id !== ownerId) throw new Error('Review sync account changed');
  const read = await client.from('wordverse_reviews').select('*').eq('user_id', ownerId).maybeSingle();
  if (read.error) throw new Error('Review sync read failed');
  let row = validRow(read.data, ownerId);
  let merged = 0;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (row) merged += store.import(row.payload);
    const payload = store.export();
    if (row && stable(sanitizeReviewState(row.payload)) === stable(payload)) return { status: 'unchanged', merged };
    const { data, error } = await client.rpc('wordverse_write_reviews', {
      p_owner_id: ownerId,
      p_payload: payload,
      p_expected_updated_at: row?.updated_at ?? null,
    });
    if (error || !data) throw new Error('Review sync write failed');
    if (data.status === 'applied') return { status: 'synced', merged };
    if (data.status !== 'conflict') throw new Error('Unexpected review sync response');
    row = validRow(data.row, ownerId);
  }
  throw new Error('Review sync kept conflicting');
}
