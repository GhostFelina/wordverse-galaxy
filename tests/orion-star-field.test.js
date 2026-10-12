import { expect, it } from 'vitest';
import { Vector3 } from 'three';
import { createOrionStarField } from '../src/orion-star-field.js';
import { layoutNebulae, ORION_DEPTH_SCALE } from '../src/nebula-layout.js';
import images from '../src/data/nebula-images.json';

it('fits every archive star into Orion, preserves directions and reverses without mutating records', () => {
  const entries = Array.from({ length: 5000 }, (_, i) => ({
    id: String(i),
    x: i * 3 - 500,
    y: Math.sin(i) * 600,
    z: -i * 11,
    createdAt: '2026-10-12T00:00:00Z',
  }));
  const before = JSON.stringify(entries),
    [nebula] = layoutNebulae(images, 8042026, 1.6);
  const field = createOrionStarField(entries, nebula),
    center = new Vector3(...nebula.position);
  for (const entry of entries) {
    const p = field.position(entry),
      delta = p.clone().sub(center);
    expect(Math.abs(delta.x)).toBeLessThan((nebula.radius * nebula.dimensions[0]) / nebula.dimensions[1]);
    expect(Math.abs(delta.y)).toBeLessThan(nebula.radius);
    expect(Math.abs(delta.z)).toBeLessThan(nebula.radius * ORION_DEPTH_SCALE);
    expect(field.stored(p).distanceTo(new Vector3(entry.x, entry.y, entry.z))).toBeLessThan(1e-8);
  }
  const original = new Vector3(
    entries[1].x - entries[0].x,
    entries[1].y - entries[0].y,
    entries[1].z - entries[0].z,
  ).normalize();
  expect(field.position(entries[1]).sub(field.position(entries[0])).normalize().distanceTo(original)).toBeLessThan(
    1e-10,
  );
  expect(JSON.stringify(entries)).toBe(before);
});

it('keeps empty and single-star entry frames finite and independent of insertion order', () => {
  const [nebula] = layoutNebulae(images),
    record = { id: 'single', x: 31, y: 0, z: 18 };
  expect(
    createOrionStarField([], nebula)
      .stored(new Vector3(...nebula.position))
      .toArray()
      .every(Number.isFinite),
  ).toBe(true);
  expect(createOrionStarField([record], nebula).position(record).toArray()).toEqual(nebula.position);
  const others = [record, { id: 'second', x: -80, y: 10, z: -2000 }];
  expect(createOrionStarField(others, nebula).position(record).toArray()).toEqual(
    createOrionStarField([...others].reverse(), nebula)
      .position(record)
      .toArray(),
  );
});
