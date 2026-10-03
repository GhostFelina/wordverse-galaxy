import type { AccountCache } from './account-cache';
import { decodeCloudSnapshot, type CloudRow, type CloudSnapshot, type Payload } from './cloud-universe';
import { planSyncChanges, syncKindFor } from './sync-queue';

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable((value as Payload)[key])}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
const identity = (row: CloudRow, kind: keyof CloudSnapshot) => (kind === 'settings' ? 'settings' : row.id!);
const sameContent = (a: CloudRow, b: CloudRow) =>
  stable(a.payload) === stable(b.payload) &&
  (a.deleted_at === b.deleted_at ||
    (a.deleted_at !== null && b.deleted_at !== null && Date.parse(a.deleted_at) === Date.parse(b.deleted_at)));

// A three-way refresh: untouched local rows follow the cloud, pending rows keep
// their desired contents, and differing live remote versions become visible
// copies. Deleted remote rows stay in the baseline as tombstones.
export function reconcileAccount(
  cache: AccountCache,
  remote: CloudSnapshot,
  makeId: () => string = () => crypto.randomUUID(),
) {
  planSyncChanges(cache, cache.universe); // Validate the existing owner/queue.
  const cloud = decodeCloudSnapshot(remote, cache.ownerId);
  const result = structuredClone(cloud);
  const allocated = new Set(
    [
      ...cache.universe.galaxies,
      ...cache.universe.words,
      ...cache.universe.events,
      ...cloud.galaxies,
      ...cloud.words,
      ...cloud.events,
    ].map((record) => record.id),
  );
  const allocate = () => {
    for (let attempt = 0; attempt < 100; attempt++) {
      const id = makeId();
      if (typeof id === 'string' && id && !allocated.has(id)) {
        allocated.add(id);
        return id;
      }
    }
    throw new Error('Could not allocate sync conflict identity');
  };
  const maps = {
    galaxies: new Map<string, string>(),
    words: new Map<string, string>(),
    events: new Map<string, string>(),
  };
  const conflicts: { kind: keyof CloudSnapshot; originalId: string; copiedId: string | null }[] = [];
  const fresh = Object.fromEntries(
    (['galaxies', 'words', 'events', 'settings'] as const).map((kind) => [
      kind,
      new Map(remote[kind].map((row) => [identity(row, kind), row])),
    ]),
  ) as Record<keyof CloudSnapshot, Map<string, CloudRow>>;
  const acknowledged = new Set<string>();
  for (const pending of cache.pending) {
    const kind = syncKindFor(pending.table);
    const id = identity(pending.row, kind);
    const row = fresh[kind].get(id);
    if (row && sameContent(row, pending.row)) {
      acknowledged.add(`${kind}:${id}`);
      continue;
    }
    if ((row?.updated_at ?? null) === pending.expectedUpdatedAt) continue;
    const copiedId = kind !== 'settings' && row?.deleted_at === null ? allocate() : null;
    if (kind !== 'settings' && copiedId) maps[kind].set(id, copiedId);
    conflicts.push({ kind, originalId: id, copiedId });
  }
  // A conflicting live entry can be hidden by a remotely deleted parent.
  // Copy that parent too so the retained remote entry remains reachable.
  for (const [id] of maps.words) {
    const row = fresh.words.get(id);
    const parent = row?.galaxy_id && fresh.galaxies.get(row.galaxy_id);
    if (!row || !parent || cloud.galaxies.some((galaxy) => galaxy.id === parent.id)) continue;
    cloud.galaxies.push(structuredClone(parent.payload));
    cloud.words.push(structuredClone(row.payload));
    if (!maps.galaxies.has(parent.id!)) maps.galaxies.set(parent.id!, allocate());
  }
  // A copied galaxy needs its own remote children. Keep original local children
  // with the local version, even when those child rows weren't themselves edited.
  for (const word of cloud.words) {
    const galaxyId = String(word.galaxyId);
    if (maps.galaxies.has(galaxyId) && !maps.words.has(String(word.id))) maps.words.set(String(word.id), allocate());
  }
  const remapSnapshot = (value: unknown, galaxyEvent: boolean) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    const copy = structuredClone(value) as Payload;
    if (typeof copy.galaxyId === 'string' && maps.galaxies.has(copy.galaxyId))
      copy.galaxyId = maps.galaxies.get(copy.galaxyId);
    if (typeof copy.wordId === 'string' && maps.words.has(copy.wordId)) copy.wordId = maps.words.get(copy.wordId);
    const ids = galaxyEvent ? maps.galaxies : maps.words;
    if (typeof copy.id === 'string' && ids.has(copy.id)) copy.id = ids.get(copy.id);
    return copy;
  };
  const eventAffected = (event: Payload) =>
    maps.galaxies.has(String(event.galaxyId)) ||
    maps.words.has(String(event.wordId)) ||
    [event.before, event.after].some(
      (value) =>
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        (maps.galaxies.has(String((value as Payload).galaxyId)) ||
          maps.words.has(String((value as Payload).wordId)) ||
          (String(event.type).startsWith('galaxy.') ? maps.galaxies : maps.words).has(String((value as Payload).id))),
    );
  for (const event of cloud.events)
    if (eventAffected(event) && !maps.events.has(String(event.id))) maps.events.set(String(event.id), allocate());
  result.galaxies = cloud.galaxies.map((galaxy) => ({
    ...galaxy,
    id: maps.galaxies.get(String(galaxy.id)) || galaxy.id,
  }));
  result.words = cloud.words.map((word) => ({
    ...word,
    id: maps.words.get(String(word.id)) || word.id,
    galaxyId: maps.galaxies.get(String(word.galaxyId)) || word.galaxyId,
  }));
  result.events = cloud.events.map((event) => ({
    ...event,
    id: maps.events.get(String(event.id)) || event.id,
    ...(typeof event.galaxyId === 'string' ? { galaxyId: maps.galaxies.get(event.galaxyId) || event.galaxyId } : {}),
    ...(typeof event.wordId === 'string' ? { wordId: maps.words.get(event.wordId) || event.wordId } : {}),
    ...(event.before !== undefined
      ? { before: remapSnapshot(event.before, String(event.type).startsWith('galaxy.')) }
      : {}),
    ...(event.after !== undefined
      ? { after: remapSnapshot(event.after, String(event.type).startsWith('galaxy.')) }
      : {}),
  }));
  const put = (kind: 'galaxies' | 'words' | 'events', payload: Payload) => {
    result[kind] = result[kind].filter((record) => record.id !== payload.id).concat(structuredClone(payload));
  };
  for (const galaxy of cache.universe.galaxies) if (maps.galaxies.has(String(galaxy.id))) put('galaxies', galaxy);
  for (const word of cache.universe.words) if (maps.galaxies.has(String(word.galaxyId))) put('words', word);
  for (const event of cache.universe.events) if (eventAffected(event)) put('events', event);
  let localSettings = false;
  for (const pending of cache.pending) {
    const kind = syncKindFor(pending.table);
    const id = identity(pending.row, kind);
    if (acknowledged.has(`${kind}:${id}`)) continue;
    if (kind === 'settings') {
      localSettings = true;
      continue;
    }
    result[kind] = result[kind].filter((record) => record.id !== id);
    if (pending.row.deleted_at === null) {
      put(kind, pending.row.payload);
      if (kind === 'words' && !result.galaxies.some((galaxy) => galaxy.id === pending.row.payload.galaxyId)) {
        const localParent = cache.universe.galaxies.find((galaxy) => galaxy.id === pending.row.payload.galaxyId);
        if (!localParent) throw new Error('Missing local conflict galaxy');
        put('galaxies', localParent);
      }
    }
  }
  // A local edit may revive a remotely deleted galaxy; retain its local children.
  const revived = new Set(
    result.galaxies
      .filter((galaxy) => !cloud.galaxies.some((item) => item.id === galaxy.id))
      .map((galaxy) => galaxy.id),
  );
  for (const word of cache.universe.words) if (revived.has(word.galaxyId)) put('words', word);
  if (localSettings) {
    const settings = structuredClone(cache.universe) as Payload;
    delete settings.galaxies;
    delete settings.words;
    delete settings.events;
    Object.assign(result, settings);
  }
  const settingsConflict = conflicts.some((conflict) => conflict.kind === 'settings');
  if (settingsConflict)
    result.syncSettingsConflicts = [
      ...(Array.isArray(cache.universe.syncSettingsConflicts) ? cache.universe.syncSettingsConflicts : []),
      { capturedAt: new Date().toISOString(), payload: structuredClone(remote.settings[0]?.payload || {}) },
    ];
  if (!result.galaxies.some((galaxy) => galaxy.id === result.activeGalaxyId))
    result.activeGalaxyId = typeof result.galaxies[0]?.id === 'string' ? result.galaxies[0].id : null;
  const galaxyIds = new Set(result.galaxies.map((galaxy) => galaxy.id));
  result.words = result.words.filter((word) => galaxyIds.has(word.galaxyId));
  const baseline = {
    ...structuredClone(cache),
    remote: structuredClone(remote),
    pending: cache.pending.filter(
      (pending) =>
        !acknowledged.has(`${syncKindFor(pending.table)}:${identity(pending.row, syncKindFor(pending.table))}`),
    ),
  };
  return { cache: planSyncChanges(baseline, result), conflicts };
}
