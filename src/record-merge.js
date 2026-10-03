// Compare JSON content independently of property insertion order.
function stable(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stable(item) ?? 'null').join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

function copyContent(record, kind) {
  const copy = { ...record };
  delete copy.id;
  if (kind === 'galaxies') copy.meaningLanguage ||= 'tr';
  return comparable(copy, kind);
}

function comparable(record, kind) {
  const copy = structuredClone(record);
  if (kind === 'galaxies') delete copy.createdAt;
  return stable(copy);
}

function uniqueId(ids, makeId) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const id = makeId();
    if (typeof id === 'string' && id && !ids.has(id)) return id;
  }
  throw new Error('Could not allocate a unique sync ID');
}

function remapSnapshot(snapshot, galaxyIds, wordIds, eventType) {
  if (!snapshot || typeof snapshot !== 'object') return snapshot;
  const copy = structuredClone(snapshot);
  if (galaxyIds.has(copy.galaxyId)) copy.galaxyId = galaxyIds.get(copy.galaxyId);
  if (wordIds.has(copy.wordId)) copy.wordId = wordIds.get(copy.wordId);
  const snapshotIds = eventType?.startsWith('galaxy.') ? galaxyIds : wordIds;
  if (snapshotIds.has(copy.id)) copy.id = snapshotIds.get(copy.id);
  return copy;
}

// Keep the current identity; copy conflicting incoming records and remap children.
// Backup imports may reuse an unchanged conflict copy on subsequent imports.
export function mergeRecords(guest, cloud, makeId = () => crypto.randomUUID(), reuseCopies = false) {
  const merged = structuredClone(guest);
  const summary = { added: { galaxies: 0, words: 0, events: 0 }, conflicts: [] };
  const galaxyIds = new Map();
  const wordIds = new Map();

  for (const kind of ['galaxies', 'words', 'events']) {
    const ids = new Set(merged[kind].map((record) => record.id));
    const existing = new Map(merged[kind].map((record) => [record.id, record]));
    const copies = new Map(merged[kind].map((record) => [copyContent(record, kind), record.id]));
    for (const source of cloud[kind]) {
      if (!source || typeof source.id !== 'string' || !source.id) throw new Error(`Invalid ${kind} record for sync`);
      const record = structuredClone(source);
      if (kind !== 'galaxies') {
        if (galaxyIds.has(record.galaxyId)) record.galaxyId = galaxyIds.get(record.galaxyId);
      }
      if (kind === 'events') {
        if (wordIds.has(record.wordId)) record.wordId = wordIds.get(record.wordId);
        record.before = remapSnapshot(record.before, galaxyIds, wordIds, record.type);
        record.after = remapSnapshot(record.after, galaxyIds, wordIds, record.type);
      }
      const match = existing.get(record.id);
      if (match && copyContent(match, kind) === copyContent(record, kind)) continue;
      if (match) {
        const originalId = record.id;
        const previousCopy = reuseCopies && copies.get(copyContent(record, kind));
        if (previousCopy) {
          if (kind === 'galaxies') galaxyIds.set(originalId, previousCopy);
          if (kind === 'words') wordIds.set(originalId, previousCopy);
          continue;
        }
        record.id = uniqueId(ids, makeId);
        summary.conflicts.push({ kind, originalId, copiedId: record.id });
        if (kind === 'galaxies') galaxyIds.set(originalId, record.id);
        if (kind === 'words') wordIds.set(originalId, record.id);
      }
      merged[kind].push(record);
      ids.add(record.id);
      existing.set(record.id, record);
      copies.set(copyContent(record, kind), record.id);
      summary.added[kind] += 1;
    }
  }
  if (!merged.galaxies.some((galaxy) => galaxy.id === merged.activeGalaxyId)) {
    merged.activeGalaxyId = galaxyIds.get(cloud.activeGalaxyId) || cloud.activeGalaxyId || merged.galaxies[0]?.id;
  }
  return { universe: merged, summary };
}
