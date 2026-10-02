import { LEGACY_KEY, UNIVERSE_KEY, loadUniverse } from './universe-data.js';

const DATABASE = 'wordverse-local-backup';
const STORE = 'snapshots';
const SNAPSHOT = 'universe-v3';
let openPromise;

function openDatabase() {
  if (!openPromise) {
    openPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return; }
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
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
