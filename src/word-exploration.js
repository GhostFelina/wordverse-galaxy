import { entryKind } from './universe-data.js';

const compareId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function recentRecords(records, limit = Infinity) {
  return records
    .filter((record) => record && !record.deletedAt)
    .map((record, index) => ({ record, index }))
    .sort((a, b) => {
      const first = Date.parse(a.record.createdAt) || 0;
      const second = Date.parse(b.record.createdAt) || 0;
      return second - first || b.index - a.index;
    })
    .slice(0, Math.max(0, limit))
    .map(({ record }) => record);
}

export function neighboringRecord(records, currentId, direction) {
  if (!records.length) return null;
  const index = records.findIndex((record) => record.id === currentId);
  if (index < 0) return null;
  return records[(index + (direction < 0 ? -1 : 1) + records.length) % records.length];
}

export function randomWord(records, currentId, random = Math.random) {
  const words = records.filter((record) => record && !record.deletedAt && entryKind(record) === 'word');
  const candidates = words.length > 1 ? words.filter((record) => record.id !== currentId) : words;
  if (!candidates.length) return null;
  const value = random();
  const fraction = Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0;
  return candidates[Math.floor(fraction * candidates.length)];
}

// A bounded geometric forest for the active galaxy, never a semantic relationship.
// Stable sorting and copied positions keep presentation independent of record order.
export function constellationEdges(
  records,
  { positionOf = (record) => [record.x, record.y, record.z], maxSpan = 240 } = {},
) {
  const scope = records.find((record) => record && !record.deletedAt)?.galaxyId;
  const seen = new Set();
  const nodes = records
    .filter(
      (record) =>
        record &&
        !record.deletedAt &&
        record.galaxyId === scope &&
        entryKind(record) === 'word' &&
        typeof record.id === 'string',
    )
    .map((record) => ({ id: record.id, position: [...positionOf(record)] }))
    .filter(({ id, position }) => {
      if (seen.has(id) || position.length !== 3 || !position.every(Number.isFinite)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => compareId(a.id, b.id))
    .slice(0, 96);
  const candidates = [];
  const bound = Number.isFinite(maxSpan) ? Math.max(0, Math.min(240, maxSpan)) : 240;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const distance = Math.hypot(...nodes[i].position.map((value, axis) => value - nodes[j].position[axis]));
      if (distance > 0.001 && distance <= bound) candidates.push({ i, j, distance });
    }
  }
  candidates.sort((a, b) => a.distance - b.distance || a.i - b.i || a.j - b.j);
  const roots = nodes.map((_, index) => index);
  const degrees = nodes.map(() => 0);
  const root = (index) => {
    while (roots[index] !== index) {
      roots[index] = roots[roots[index]];
      index = roots[index];
    }
    return index;
  };
  const edges = [];
  for (const { i, j } of candidates) {
    const first = root(i),
      second = root(j);
    if (first === second || degrees[i] >= 3 || degrees[j] >= 3) continue;
    roots[first] = second;
    degrees[i]++;
    degrees[j]++;
    edges.push({ from: nodes[i].id, to: nodes[j].id, start: nodes[i].position, end: nodes[j].position });
  }
  return edges;
}

export function visibleLabelIds(candidates, { width, height, limit = 24 } = {}) {
  const placed = [];
  const selected = new Set();
  for (const item of [...candidates].sort(
    (a, b) => Number(b.priority) - Number(a.priority) || a.depth - b.depth || compareId(a.id, b.id),
  )) {
    const box = { x: item.x + 16, y: item.y - 28, width: Math.min(220, 22 + String(item.word).length * 7), height: 30 };
    if (box.x < 8 || box.y < 8 || box.x + box.width > width - 8 || box.y + box.height > height - 8) continue;
    if (
      placed.some(
        (other) =>
          box.x < other.x + other.width + 12 &&
          box.x + box.width + 12 > other.x &&
          box.y < other.y + other.height + 10 &&
          box.y + box.height + 10 > other.y,
      )
    )
      continue;
    selected.add(item.id);
    placed.push(box);
    if (selected.size >= Math.max(1, Math.min(24, limit))) break;
  }
  return selected;
}
