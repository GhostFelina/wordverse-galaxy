export const UNIVERSE_KEY = 'wordverse.universe.v3';
export const LEGACY_KEY = 'wordverse.words.v2';

const initialGalaxy = () => ({ id: 'galaxy-english', name: 'İngilizce Galaksisi', language: 'İngilizce', createdAt: new Date().toISOString() });
const secondGalaxy = () => ({ id: 'galaxy-spanish', name: 'İspanyolca Galaksisi', language: 'İspanyolca', createdAt: new Date().toISOString() });

export function loadUniverse(storage) {
  try {
    const existing = JSON.parse(storage.getItem(UNIVERSE_KEY) || 'null');
    if (existing && existing.version === 3 && Array.isArray(existing.galaxies) && Array.isArray(existing.words) && Array.isArray(existing.events) && existing.galaxies.length) {
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
  return { version: 3, galaxies: [galaxy, spanish], activeGalaxyId: galaxy.id, words, events };
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

export function mergeUniverse(target, backup) {
  if (backup?.version !== 3 || !Array.isArray(backup.galaxies) || !Array.isArray(backup.words) || !Array.isArray(backup.events) || backup.galaxies.length > 1000 || backup.words.length > 100000 || backup.events.length > 200000) throw new Error('Invalid Wordverse backup');
  const galaxyIds = new Set(target.galaxies.map(g => g.id));
  for (const galaxy of backup.galaxies) if (typeof galaxy?.id === 'string' && typeof galaxy.name === 'string' && typeof galaxy.language === 'string' && !galaxyIds.has(galaxy.id)) { target.galaxies.push(galaxy); galaxyIds.add(galaxy.id); }
  const wordIds = new Set(target.words.map(w => w.id));
  for (const word of backup.words) if (typeof word?.id === 'string' && galaxyIds.has(word.galaxyId) && typeof word.word === 'string' && typeof word.meaning === 'string' && !wordIds.has(word.id)) { target.words.push(word); wordIds.add(word.id); }
  const eventIds = new Set(target.events.map(e => e.id));
  for (const entry of backup.events) if (typeof entry?.id === 'string' && typeof entry.type === 'string' && !eventIds.has(entry.id)) { target.events.push(entry); eventIds.add(entry.id); }
  return target;
}
