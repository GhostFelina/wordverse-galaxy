import { expect, it } from 'vitest';
import {
  recentRecords,
  randomWord,
  neighboringRecord,
  constellationEdges,
  visibleLabelIds,
} from '../src/word-exploration.js';
const records = Array.from({ length: 120 }, (_, i) => ({
  id: `s-${String(i).padStart(3, '0')}`,
  galaxyId: 'g',
  kind: 'word',
  word: `Star ${i}`,
  createdAt: new Date(2026, 9, 1 + i).toISOString(),
  x: i * 2,
  y: i % 4,
  z: -i,
}));
it('browses and samples live words without mutating records or revealing meanings', () => {
  const before = JSON.stringify(records);
  expect(recentRecords(records, 3).map((r) => r.id)).toEqual(['s-119', 's-118', 's-117']);
  expect(neighboringRecord(records, 's-119', 1).id).toBe('s-000');
  expect(neighboringRecord(records, 'missing', 1)).toBe(null);
  const subset = [records[0], { ...records[1], kind: 'conjunction' }, { ...records[2], deletedAt: 'now' }, records[3]];
  expect(randomWord(subset, 's-000', () => 0).id).toBe('s-003');
  expect(randomWord([], null)).toBe(null);
  expect(JSON.stringify(records)).toBe(before);
});
it('builds a deterministic bounded acyclic forest scoped to one galaxy', () => {
  const edges = constellationEdges([...records, { ...records[0], id: 'other', galaxyId: 'other' }]);
  expect(edges.length).toBeLessThanOrEqual(95);
  expect(edges).toEqual(constellationEdges([...records].reverse()));
  const parents = new Map(),
    degrees = new Map();
  const root = (id) => (parents.has(id) ? root(parents.get(id)) : id);
  for (const edge of edges) {
    expect(root(edge.from)).not.toBe(root(edge.to));
    parents.set(root(edge.from), root(edge.to));
    expect(Math.hypot(...edge.start.map((v, i) => v - edge.end[i]))).toBeLessThanOrEqual(240);
    for (const id of [edge.from, edge.to]) degrees.set(id, (degrees.get(id) || 0) + 1);
  }
  expect(Math.max(...degrees.values())).toBeLessThanOrEqual(3);
  expect(edges.some((e) => e.from === 'other' || e.to === 'other')).toBe(false);
});
it('prioritizes focus and excludes collisions, edges and unbounded label counts', () => {
  const items = [
    { id: 'a', word: 'Alpha', x: 100, y: 100, depth: 0.1, priority: false },
    { id: 'b', word: 'Beta', x: 100, y: 100, depth: 0.9, priority: true },
    { id: 'off', word: 'Off', x: 990, y: 200, depth: 0.2 },
  ];
  expect([...visibleLabelIds(items, { width: 1000, height: 600 })]).toEqual(['b']);
  const many = Array.from({ length: 100 }, (_, i) => ({
    id: String(i),
    word: 'X',
    x: (i % 10) * 100,
    y: 60 + Math.floor(i / 10) * 50,
    depth: 0.5,
  }));
  expect(visibleLabelIds(many, { width: 1100, height: 900 }).size).toBe(24);
});
