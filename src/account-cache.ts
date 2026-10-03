import {
  decodeCloudSnapshot,
  validateCloudRows,
  type CloudRow,
  type CloudSnapshot,
  type SyncUniverse,
} from './cloud-universe';

export type PendingChange = {
  table: 'wordverse_galaxies' | 'wordverse_entries' | 'wordverse_events' | 'wordverse_settings';
  row: CloudRow;
  expectedUpdatedAt: string | null;
};
export type AccountCache = {
  version: 1;
  ownerId: string;
  universe: SyncUniverse;
  remote: CloudSnapshot;
  pending: PendingChange[];
  lastSyncedAt: string | null;
};

const DATABASE = 'wordverse-accounts';
const STORE = 'accounts';
const connections = new Map<string, Promise<IDBDatabase>>();

function validate(cache: AccountCache, ownerId: string) {
  if (!ownerId || cache.ownerId !== ownerId) throw new Error('Local account mismatch');
  if (
    cache.version !== 1 ||
    cache.universe?.version !== 4 ||
    !Array.isArray(cache.universe.galaxies) ||
    !Array.isArray(cache.universe.words) ||
    !Array.isArray(cache.universe.events) ||
    !Array.isArray(cache.pending)
  )
    throw new Error('Invalid account cache');
  decodeCloudSnapshot(cache.remote, ownerId);
  if (cache.pending.some((change) => change.row.user_id !== ownerId)) throw new Error('Foreign account in sync queue');
  const tables: Record<string, keyof CloudSnapshot> = {
    wordverse_galaxies: 'galaxies',
    wordverse_entries: 'words',
    wordverse_events: 'events',
    wordverse_settings: 'settings',
  };
  for (const change of cache.pending) {
    if (!Object.hasOwn(tables, change.table)) throw new Error('Invalid sync queue table');
    validateCloudRows([change.row], ownerId, tables[change.table]);
    if (change.expectedUpdatedAt !== null && !Number.isFinite(Date.parse(change.expectedUpdatedAt)))
      throw new Error('Invalid sync queue revision');
  }
  if (cache.lastSyncedAt !== null && !Number.isFinite(Date.parse(cache.lastSyncedAt)))
    throw new Error('Invalid sync time');
}

function openDatabase(name: string): Promise<IDBDatabase> {
  if (!connections.has(name)) {
    const opening = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Account cache blocked'));
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          connections.delete(name);
        };
        resolve(database);
      };
    }).catch((error) => {
      connections.delete(name);
      throw error;
    });
    connections.set(name, opening);
  }
  return connections.get(name)!;
}

export async function loadAccountCache(ownerId: string, name = DATABASE): Promise<AccountCache | null> {
  if (!ownerId) throw new Error('Missing account identity');
  const database = await openDatabase(name);
  const cache = await new Promise<AccountCache | null>((resolve, reject) => {
    const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(ownerId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  if (cache) validate(cache, ownerId);
  return cache;
}

// A single transaction stores the visible state and the retry queue together.
// Guest storage and Supabase auth credentials are never touched here.
export async function saveAccountCache(cache: AccountCache, name = DATABASE): Promise<void> {
  validate(cache, cache.ownerId);
  const copy = structuredClone(cache);
  const database = await openDatabase(name);
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(copy, copy.ownerId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
