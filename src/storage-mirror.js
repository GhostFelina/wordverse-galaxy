import { LEGACY_KEY, UNIVERSE_KEY, loadUniverse } from './universe-data.js';

const DATABASE = 'wordverse-local-backup';
const STORE = 'snapshots';
const ARCHIVE = 'pre-migration';
const SNAPSHOT = 'universe-v3';
export const SCHEMA_VERSION_KEY = 'wordverse.schema.version';
let openPromise;

function openDatabase() {
  if (!openPromise) {
    openPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return; }
      const request = indexedDB.open(DATABASE, 2);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
        if (!request.result.objectStoreNames.contains(ARCHIVE)) request.result.createObjectStore(ARCHIVE);
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => { database.close(); openPromise = null; };
        resolve(database);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('IndexedDB blocked'));
    }).catch(error => { openPromise = null; throw error; });
  }
  return openPromise;
}

// Keep the original bytes before loadUniverse or persist can change a legacy record.
// An archive is written only once per source key so later launches cannot replace it.
export async function archiveBeforeMigration(storage) {
  const sources = [LEGACY_KEY, UNIVERSE_KEY]
    .map(key => ({ key, raw: storage.getItem(key) }))
    .filter(item => item.raw !== null);
  if (!sources.length) return { archived: false, schemaVersion: 3 };
  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(ARCHIVE, 'readwrite');
    const archive = transaction.objectStore(ARCHIVE);
    for (const source of sources) {
      const request = archive.get(source.key);
      request.onsuccess = () => {
        if (request.result === undefined) archive.put({ raw: source.raw, capturedAt: new Date().toISOString() }, source.key);
      };
    }
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  storage.setItem(SCHEMA_VERSION_KEY, '3');
  return { archived: true, schemaVersion: 3 };
}

export async function readMigrationArchive(key) {
  if (key !== LEGACY_KEY && key !== UNIVERSE_KEY) throw new Error('Unknown archive key');
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(ARCHIVE, 'readonly').objectStore(ARCHIVE).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function readUniverseMirror() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(SNAPSHOT);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function writeUniverseMirror(snapshot) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(snapshot, SNAPSHOT);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function validUniverse(value) {
  return value?.version === 3 && Array.isArray(value.galaxies) && value.galaxies.length > 0 && Array.isArray(value.words) && Array.isArray(value.events);
}

export async function recoverUniverse(storage, readMirror = readUniverseMirror) {
  let primary = null;
  let legacy = null;
  try { primary = JSON.parse(storage.getItem(UNIVERSE_KEY) || 'null'); } catch { /* Try the mirror. */ }
  try { legacy = JSON.parse(storage.getItem(LEGACY_KEY) || 'null'); } catch { /* Try the mirror. */ }
  if (validUniverse(primary) || (Array.isArray(legacy) && legacy.length > 0)) return { universe: loadUniverse(storage), recovered: false };

  let timer;
  try {
    const snapshot = await Promise.race([readMirror(), new Promise(resolve => { timer = setTimeout(() => resolve(null), 1200); })]);
    if (validUniverse(snapshot)) {
      const mirrorStorage = { getItem: key => key === UNIVERSE_KEY ? JSON.stringify(snapshot) : null };
      return { universe: loadUniverse(mirrorStorage), recovered: true };
    }
  } catch { /* The primary storage remains usable. */ }
  finally { clearTimeout(timer); }
  return { universe: loadUniverse(storage), recovered: false };
}
