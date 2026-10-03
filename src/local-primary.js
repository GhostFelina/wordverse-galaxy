import { SCHEMA_VERSION, UNIVERSE_KEY, loadUniverse } from './universe-data.js';
import { recoverUniverse } from './storage-mirror.js';

const DATABASE = 'wordverse-offline';
const STORE = 'state';
const UNIVERSE = 'universe';
export const LOCAL_REVISION_KEY = 'wordverse.local.revision';
const connections = new Map();
const latestRevisions = new Map();

function getItem(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function openDatabase(name) {
  if (!connections.has(name)) {
    const opening = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          connections.delete(name);
        };
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('IndexedDB blocked'));
    }).catch((error) => {
      connections.delete(name);
      throw error;
    });
    connections.set(name, opening);
  }
  return connections.get(name);
}

function validUniverse(value) {
  return (
    value?.version === SCHEMA_VERSION &&
    Array.isArray(value.galaxies) &&
    value.galaxies.length > 0 &&
    Array.isArray(value.words) &&
    Array.isArray(value.events)
  );
}

function revision(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

async function readRecord(name) {
  const database = await openDatabase(name);
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(UNIVERSE);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function writeRecord(name, record) {
  const database = await openDatabase(name);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(record, UNIVERSE);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function loadLocalUniverse(storage, name = DATABASE) {
  let local = null;
  try {
    local = JSON.parse(getItem(storage, UNIVERSE_KEY) || 'null');
  } catch {
    // An intact IndexedDB record or the old backup can recover the data.
  }
  const localRevision = revision(getItem(storage, LOCAL_REVISION_KEY));
  let primary = null;
  try {
    primary = await readRecord(name);
  } catch {
    // Guest mode can still use the existing localStorage and backup path.
  }
  const primaryValid = validUniverse(primary?.universe);
  const localValid = validUniverse(local);
  latestRevisions.set(name, Math.max(localRevision, primaryValid ? revision(primary.revision) : 0));
  const primaryNewer = primaryValid && (!localValid || primary.revision > localRevision);
  const sameCopy =
    primaryValid &&
    localValid &&
    primary.revision === localRevision &&
    JSON.stringify(primary.universe) === JSON.stringify(local);

  if (primaryNewer || sameCopy) {
    try {
      storage.setItem(UNIVERSE_KEY, JSON.stringify(primary.universe));
      storage.setItem(LOCAL_REVISION_KEY, String(primary.revision));
    } catch {
      // IndexedDB remains the primary copy.
    }
    return { universe: structuredClone(primary.universe), recovered: !localValid, source: 'indexeddb' };
  }

  let fallback;
  try {
    fallback = await recoverUniverse(storage);
  } catch {
    fallback = { universe: loadUniverse({ getItem: () => null }), recovered: false };
  }
  const universe = fallback.universe;
  try {
    await writeRecord(name, { revision: localRevision, universe });
  } catch {
    // Preserve the usable localStorage copy if IndexedDB is blocked.
  }
  return { universe, recovered: fallback.recovered, source: localValid ? 'localstorage' : 'legacy' };
}

export function persistLocalUniverse(universe, storage, name = DATABASE) {
  if (!validUniverse(universe)) throw new Error('Invalid universe for local storage');
  const nextRevision = Math.max(
    Date.now(),
    revision(getItem(storage, LOCAL_REVISION_KEY)) + 1,
    (latestRevisions.get(name) || 0) + 1,
  );
  latestRevisions.set(name, nextRevision);
  const snapshot = structuredClone(universe);
  let localSaved = false;
  try {
    storage.setItem(UNIVERSE_KEY, JSON.stringify(snapshot));
    storage.setItem(LOCAL_REVISION_KEY, String(nextRevision));
    localSaved = true;
  } catch {
    // The IndexedDB write may still succeed.
  }
  return { localSaved, writePrimary: () => writeRecord(name, { revision: nextRevision, universe: snapshot }) };
}
