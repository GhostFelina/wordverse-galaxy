export const UNIVERSE_KEY = 'wordverse.universe.v4';
export const PREVIOUS_UNIVERSE_KEY = 'wordverse.universe.v3';
export const LEGACY_KEY = 'wordverse.words.v2';
export const SCHEMA_VERSION = 4;
export const entryKind = item => item?.kind === 'conjunction' ? 'conjunction' : 'word';
export const PLANET_TYPES = Object.freeze(['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']);
export const GALAXY_STYLES = Object.freeze(['spiral', 'barred', 'flocculent']);
export function galaxyStyle(galaxy) {
  if (GALAXY_STYLES.includes(galaxy?.visualStyle)) return galaxy.visualStyle;
  if (galaxy?.id === 'galaxy-english') return 'spiral';
  if (galaxy?.id === 'galaxy-spanish') return 'barred';
  let hash = 0; for (const char of galaxy?.id || '') hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return GALAXY_STYLES[hash % GALAXY_STYLES.length];
}
export function nextGalaxyStyle(galaxies, draw = Math.random()) {
  const counts = new Map(GALAXY_STYLES.map(style => [style, 0]));
  for (const galaxy of galaxies) counts.set(galaxyStyle(galaxy), counts.get(galaxyStyle(galaxy)) + 1);
  const least = Math.min(...counts.values());
  const choices = GALAXY_STYLES.filter(style => counts.get(style) === least);
  return choices[Math.min(choices.length - 1, Math.floor(Math.max(0, draw) * choices.length))];
}
export function nextPlanetType(entries, galaxyId, draw = Math.random()) {
  const counts = new Map(PLANET_TYPES.map(type => [type, 0]));
  for (const item of entries) if (item.galaxyId === galaxyId && entryKind(item) === 'conjunction' && counts.has(item.planetType)) counts.set(item.planetType, counts.get(item.planetType) + 1);
  const least = Math.min(...counts.values());
  const candidates = PLANET_TYPES.filter(type => counts.get(type) === least);
  return candidates[Math.min(candidates.length - 1, Math.floor(Math.max(0, draw) * candidates.length))];
}

const initialGalaxy = () => ({ id: 'galaxy-english', name: 'İngilizce Galaksisi', language: 'İngilizce', meaningLanguage: 'tr', createdAt: new Date().toISOString() });
const secondGalaxy = () => ({ id: 'galaxy-spanish', name: 'İspanyolca Galaksisi', language: 'İspanyolca', meaningLanguage: 'tr', createdAt: new Date().toISOString() });

export function migrateUniverseV3(existing) {
  if (existing?.version !== 3 || !Array.isArray(existing.galaxies) || !Array.isArray(existing.words) || !Array.isArray(existing.events)) throw new Error('Invalid v3 universe');
  return { ...existing, version: SCHEMA_VERSION, galaxies: existing.galaxies.map(galaxy => ({ ...galaxy, meaningLanguage: galaxy.meaningLanguage || 'tr' })) };
}

export function loadUniverse(storage) {
  let current = null;
  let previous = null;
  try { current = JSON.parse(storage.getItem(UNIVERSE_KEY) || 'null'); } catch { /* Try the previous version. */ }
  try { previous = JSON.parse(storage.getItem(PREVIOUS_UNIVERSE_KEY) || 'null'); } catch { /* Try legacy words. */ }
  try {
    const currentValid = current?.version === SCHEMA_VERSION && Array.isArray(current.galaxies) && current.galaxies.length && Array.isArray(current.words) && Array.isArray(current.events);
    const existing = currentValid ? current : migrateUniverseV3(previous);
    if (existing && existing.version === SCHEMA_VERSION && Array.isArray(existing.galaxies) && Array.isArray(existing.words) && Array.isArray(existing.events) && existing.galaxies.length) {
      if (existing.galaxies.length === 1 && existing.galaxies[0].id === 'galaxy-english') {
        const galaxy = secondGalaxy(); existing.galaxies.push(galaxy);
        existing.events.push({ id: 'seed-galaxy-spanish', type: 'galaxy.seeded', galaxyId: galaxy.id, wordId: null, at: galaxy.createdAt, before: null, after: { ...galaxy } });
      }
      return { ...existing, activeGalaxyId: existing.galaxies.some(g => g.id === existing.activeGalaxyId) ? existing.activeGalaxyId : existing.galaxies[0].id };
    }
  } catch { /* Start from a recoverable legacy state. */ }

  const galaxy = initialGalaxy();
  let legacy = [];
  try {
    const parsed = JSON.parse(storage.getItem(LEGACY_KEY) || '[]');
    if (Array.isArray(parsed)) legacy = parsed.filter(w => w && typeof w.word === 'string' && typeof w.meaning === 'string');
  } catch { /* Empty universe. */ }
  const words = legacy.map(w => ({ ...w, galaxyId: galaxy.id }));
  const events = words.map(w => ({ id: `import-${w.id}`, type: 'word.imported', galaxyId: galaxy.id, wordId: w.id, at: w.createdAt || galaxy.createdAt, before: null, after: { ...w } }));
  const spanish = secondGalaxy();
  events.push({ id: 'seed-galaxy-spanish', type: 'galaxy.seeded', galaxyId: spanish.id, wordId: null, at: spanish.createdAt, before: null, after: { ...spanish } });
  return { version: SCHEMA_VERSION, galaxies: [galaxy, spanish], activeGalaxyId: galaxy.id, words, events };
}

export function starAge(createdAt, now = Date.now()) {
  const age = Math.max(0, (now - new Date(createdAt).getTime()) / 86400000);
  if (!Number.isFinite(age) || age < 1) return { stage: 'Yeni doğan · beyaz', color: '#ffffff', glow: '#dceaff', size: 1, ageDays: 0 };
  if (age < 7) return { stage: 'Genç · beyaz', color: '#f8fbff', glow: '#c5ddff', size: 1.02, ageDays: Math.floor(age) };
  if (age < 30) return { stage: 'Olgun · sarı beyaz', color: '#fff3d6', glow: '#ffe3a2', size: 1.05, ageDays: Math.floor(age) };
  if (age < 90) return { stage: 'Yaşlanan · kehribar', color: '#ffd9ac', glow: '#ffad6c', size: 1.15, ageDays: Math.floor(age) };
  if (age < 365) return { stage: 'Kızıl dev', color: '#ffb09b', glow: '#ef795d', size: 1.36, ageDays: Math.floor(age) };
  return { stage: 'Beyaz cüce', color: '#e9f5ff', glow: '#a6c9ec', size: .78, ageDays: Math.floor(age) };
}

export function appendEvent(universe, type, galaxyId, wordId = null, before = null, after = null) {
  universe.events.push({ id: crypto.randomUUID(), type, galaxyId, wordId, at: new Date().toISOString(), before: before ? { ...before } : null, after: after ? { ...after } : null });
}

export function normalizeBackup(backup) {
  const legacy = Array.isArray(backup) ? backup : backup?.version === 2 && Array.isArray(backup.words) ? backup.words : null;
  if (!legacy) return backup?.version === 3 ? migrateUniverseV3(backup) : backup;
  if (legacy.length > 100000 || legacy.some(item => !item || typeof item.word !== 'string' || typeof item.meaning !== 'string')) throw new Error('Invalid Wordverse backup');
  const galaxy = { id: 'galaxy-english', name: 'İngilizce Galaksisi', language: 'İngilizce' };
  return {
    version: 3, galaxies: [galaxy], activeGalaxyId: galaxy.id,
    words: legacy.map((item, index) => ({ ...item, id: typeof item.id === 'string' ? item.id : `legacy-${index}-${item.word}`, galaxyId: galaxy.id })),
    events: [],
  };
}

export function mergeUniverse(target, backup) {
  backup = normalizeBackup(backup);
  if (backup?.version === 3) backup = migrateUniverseV3(backup);
  if (backup?.version !== SCHEMA_VERSION || !Array.isArray(backup.galaxies) || !Array.isArray(backup.words) || !Array.isArray(backup.events) || backup.galaxies.length > 1000 || backup.words.length > 100000 || backup.events.length > 200000) throw new Error('Invalid Wordverse backup');
  const galaxyIds = new Set(target.galaxies.map(g => g.id));
  for (const galaxy of backup.galaxies) if (typeof galaxy?.id === 'string' && typeof galaxy.name === 'string' && typeof galaxy.language === 'string' && !galaxyIds.has(galaxy.id)) { target.galaxies.push(galaxy); galaxyIds.add(galaxy.id); }
  const wordIds = new Set(target.words.map(w => w.id));
  for (const word of backup.words) if (typeof word?.id === 'string' && galaxyIds.has(word.galaxyId) && typeof word.word === 'string' && typeof word.meaning === 'string' && !wordIds.has(word.id)) { target.words.push(word); wordIds.add(word.id); }
  const eventIds = new Set(target.events.map(e => e.id));
  for (const entry of backup.events) if (typeof entry?.id === 'string' && typeof entry.type === 'string' && !eventIds.has(entry.id)) { target.events.push(entry); eventIds.add(entry.id); }
  return target;
}
