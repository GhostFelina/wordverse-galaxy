import type { AccountCache, PendingChange } from './account-cache';
import {
  validateCloudRows,
  decodeCloudSnapshot,
  type CloudRow,
  type CloudSnapshot,
  type Payload,
  type SyncUniverse,
} from './cloud-universe';

const tables = {
  galaxies: 'wordverse_galaxies',
  words: 'wordverse_entries',
  events: 'wordverse_events',
  settings: 'wordverse_settings',
} as const;
const idOf = (row: CloudRow, kind: keyof CloudSnapshot) => (kind === 'settings' ? 'settings' : row.id!);

export function syncKindFor(table: string): keyof CloudSnapshot {
  const kind = (Object.keys(tables) as (keyof CloudSnapshot)[]).find((key) => tables[key] === table);
  if (!kind) throw new Error('Invalid sync table');
  return kind;
}

function validateCacheOwner(cache: AccountCache) {
  if (!cache.ownerId) throw new Error('Missing sync account');
  decodeCloudSnapshot(cache.remote, cache.ownerId);
  for (const change of cache.pending) validateCloudRows([change.row], cache.ownerId, syncKindFor(change.table));
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable((value as Payload)[key])}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

function settingsOf(universe: SyncUniverse): Payload {
  const copy: Payload = structuredClone(universe);
  delete copy.galaxies;
  delete copy.words;
  delete copy.events;
  return copy;
}

// Recompute the durable queue from the latest local state and last confirmed
// server baseline. Repeated offline edits retain the original expected revision.
export function planSyncChanges(
  cache: AccountCache,
  universe: SyncUniverse,
  changedAt = new Date().toISOString(),
): AccountCache {
  if (!Number.isFinite(Date.parse(changedAt))) throw new Error('Invalid change time');
  if (universe.version !== 4) throw new Error('Unsupported local schema');
  validateCacheOwner(cache);
  const pending: PendingChange[] = [];
  for (const kind of ['galaxies', 'words', 'events', 'settings'] as const) {
    const baseline = new Map(cache.remote[kind].map((row) => [idOf(row, kind), row]));
    const queued = new Map(
      cache.pending.filter((change) => change.table === tables[kind]).map((change) => [idOf(change.row, kind), change]),
    );
    const payloads = kind === 'settings' ? [settingsOf(universe)] : universe[kind];
    const activeIds = new Set<string>();
    for (const payload of payloads) {
      const id = kind === 'settings' ? 'settings' : payload.id;
      if (typeof id !== 'string' || !id || activeIds.has(id)) throw new Error('Invalid local sync identity');
      activeIds.add(id);
      const remote = baseline.get(id);
      const previous = queued.get(id);
      if (!previous && remote && remote.deleted_at === null && stable(remote.payload) === stable(payload)) continue;
      const unchanged = previous?.row.deleted_at === null && stable(previous.row.payload) === stable(payload);
      const row: CloudRow = {
        user_id: cache.ownerId,
        ...(kind === 'settings' ? {} : { id }),
        ...(kind === 'words'
          ? { galaxy_id: String(payload.galaxyId || '') }
          : kind === 'events'
            ? { galaxy_id: typeof payload.galaxyId === 'string' ? payload.galaxyId : null }
            : {}),
        payload: structuredClone(payload),
        updated_at: unchanged ? previous!.row.updated_at : changedAt,
        deleted_at: null,
      };
      validateCloudRows([row], cache.ownerId, kind);
      pending.push({ table: tables[kind], row, expectedUpdatedAt: remote?.updated_at || null });
    }
    if (kind === 'settings') continue;
    const missing = new Map([...baseline, ...[...queued].map(([id, change]) => [id, change.row] as const)]);
    for (const [id, record] of missing) {
      if (activeIds.has(id)) continue;
      const remote = baseline.get(id);
      const previous = queued.get(id);
      // A deleted cloud parent hides live children in the visible universe.
      // That visibility rule is not an instruction to delete those children.
      if (
        kind === 'words' &&
        remote &&
        !previous &&
        cache.remote.galaxies.some((galaxy) => galaxy.id === remote.galaxy_id && galaxy.deleted_at !== null)
      )
        continue;
      if (remote?.deleted_at !== null && remote?.deleted_at !== undefined && !previous) continue;
      const deletedAt = previous?.row.deleted_at || changedAt;
      const row = {
        ...structuredClone(record),
        user_id: cache.ownerId,
        updated_at: previous?.row.deleted_at ? previous.row.updated_at : changedAt,
        deleted_at: deletedAt,
      };
      validateCloudRows([row], cache.ownerId, kind);
      pending.push({ table: tables[kind], row, expectedUpdatedAt: remote?.updated_at || null });
    }
  }
  return { ...structuredClone(cache), universe: structuredClone(universe), pending };
}

const sameContent = (left: CloudRow, right: CloudRow) =>
  stable(left.payload) === stable(right.payload) &&
  ((left.deleted_at === null && right.deleted_at === null) ||
    (left.deleted_at !== null &&
      right.deleted_at !== null &&
      Date.parse(left.deleted_at) === Date.parse(right.deleted_at)));

// Accept only a successful response for the exact sent contents. An edit made
// while the network request was in flight remains queued against the new revision.
export function acknowledgeSyncWrite(cache: AccountCache, sent: PendingChange, saved: CloudRow): AccountCache {
  validateCacheOwner(cache);
  const kind = syncKindFor(sent.table);
  validateCloudRows([sent.row], cache.ownerId, kind);
  validateCloudRows([saved], cache.ownerId, kind);
  const id = idOf(sent.row, kind);
  if (idOf(saved, kind) !== id || !sameContent(sent.row, saved))
    throw new Error('Acknowledgement does not match sent change');
  const existing = cache.remote[kind].find((row) => idOf(row, kind) === id);
  if (existing && Date.parse(existing.updated_at) > Date.parse(saved.updated_at))
    throw new Error('Outdated cloud acknowledgement');
  const result = structuredClone(cache);
  result.remote[kind] = result.remote[kind].filter((row) => idOf(row, kind) !== id).concat(structuredClone(saved));
  result.pending = result.pending.flatMap((change) => {
    if (change.table !== sent.table || idOf(change.row, kind) !== id) return [change];
    if (sameContent(change.row, sent.row)) return [];
    return [{ ...change, expectedUpdatedAt: saved.updated_at }];
  });
  if (!result.pending.length) result.lastSyncedAt = saved.updated_at;
  return result;
}
