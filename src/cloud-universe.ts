import type { SupabaseClient } from '@supabase/supabase-js';

export type Payload = Record<string, unknown>;
export type CloudRow = {
  user_id: string;
  id?: string;
  galaxy_id?: string | null;
  payload: Payload;
  updated_at: string;
  deleted_at: string | null;
};
export type CloudSnapshot = {
  galaxies: CloudRow[];
  words: CloudRow[];
  events: CloudRow[];
  settings: CloudRow[];
};
export type SyncUniverse = Payload & {
  version: 4;
  activeGalaxyId: string | null;
  galaxies: Payload[];
  words: Payload[];
  events: Payload[];
};

export function validateCloudRows(rows: CloudRow[], ownerId: string, kind: keyof CloudSnapshot) {
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.user_id !== ownerId) throw new Error('Cloud account mismatch');
    if (!row.payload || typeof row.payload !== 'object' || Array.isArray(row.payload))
      throw new Error('Invalid cloud payload');
    if (
      !Number.isFinite(Date.parse(row.updated_at)) ||
      (row.deleted_at !== null && !Number.isFinite(Date.parse(row.deleted_at)))
    )
      throw new Error('Invalid cloud timestamp');
    if (kind === 'settings') continue;
    if (!row.id || row.payload.id !== row.id || ids.has(row.id)) throw new Error('Invalid cloud record identity');
    ids.add(row.id);
    if (kind === 'words' && (typeof row.galaxy_id !== 'string' || row.payload.galaxyId !== row.galaxy_id))
      throw new Error('Invalid cloud galaxy reference');
  }
}

// Read-only conversion: keep tombstones in the snapshot, but do not resurrect
// them in the visible universe. Unknown payload fields survive unchanged.
export function decodeCloudSnapshot(snapshot: CloudSnapshot, ownerId: string): SyncUniverse {
  for (const kind of ['galaxies', 'words', 'events', 'settings'] as const)
    validateCloudRows(snapshot[kind], ownerId, kind);
  if (snapshot.settings.length > 1) throw new Error('Multiple cloud settings records');
  const settings = snapshot.settings.find((row) => row.deleted_at === null)?.payload || {};
  if (settings.version !== undefined && settings.version !== 4) throw new Error('Unsupported cloud schema');
  const allGalaxyIds = new Set(snapshot.galaxies.map((row) => row.id));
  const galaxies = snapshot.galaxies
    .filter((row) => row.deleted_at === null)
    .map((row) => structuredClone(row.payload));
  const galaxyIds = new Set(galaxies.map((galaxy) => galaxy.id));
  const words = snapshot.words
    .filter((row) => {
      if (row.deleted_at !== null) return false;
      if (!allGalaxyIds.has(row.galaxy_id || '')) throw new Error('Missing cloud galaxy');
      return galaxyIds.has(row.galaxy_id);
    })
    .map((row) => structuredClone(row.payload));
  return {
    ...structuredClone(settings),
    version: 4,
    activeGalaxyId:
      typeof settings.activeGalaxyId === 'string' && galaxyIds.has(settings.activeGalaxyId)
        ? settings.activeGalaxyId
        : typeof galaxies[0]?.id === 'string'
          ? galaxies[0].id
          : null,
    galaxies,
    words,
    events: snapshot.events.filter((row) => row.deleted_at === null).map((row) => structuredClone(row.payload)),
  };
}

export async function readCloudSnapshot(client: SupabaseClient, ownerId: string): Promise<CloudSnapshot> {
  const readRows = async (table: string): Promise<CloudRow[]> => {
    const rows: CloudRow[] = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq('user_id', ownerId)
        .order('id')
        .range(offset, offset + pageSize - 1);
      if (error || !data) throw new Error('Cloud read failed');
      rows.push(...(data as CloudRow[]));
      if (data.length < pageSize) return rows;
    }
  };
  const [galaxies, words, events, settingsResult] = await Promise.all([
    readRows('wordverse_galaxies'),
    readRows('wordverse_entries'),
    readRows('wordverse_events'),
    client.from('wordverse_settings').select('*').eq('user_id', ownerId).maybeSingle(),
  ]);
  if (settingsResult.error) throw new Error('Cloud settings read failed');
  const snapshot = { galaxies, words, events, settings: settingsResult.data ? [settingsResult.data as CloudRow] : [] };
  // Validate before exposing the snapshot to any future merge/write action.
  decodeCloudSnapshot(snapshot, ownerId);
  return snapshot;
}
