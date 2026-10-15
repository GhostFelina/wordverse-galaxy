import { expect, it } from 'vitest';
import { Group, Vector3 } from 'three';
import { coreOrbit, setGalacticPivot } from '../src/local-galaxy-layout.js';

it('keeps the word universe in the galactic core without changing stored coordinates', () => {
  const entry = Object.freeze({ x: 12000, y: -4500, z: 22, id: 'existing' });
  const before = JSON.stringify(entry);
  const orbit = coreOrbit(entry, 6);
  expect(orbit.radius).toBeGreaterThan(4);
  expect(orbit.radius).toBeLessThanOrEqual(14 + Math.sqrt(6) * 3.6);
  expect(Number.isFinite(orbit.phase)).toBe(true);
  expect(JSON.stringify(entry)).toBe(before);
  expect(coreOrbit({}, 6)).toEqual({ radius: 4, phase: 0 });
  expect(coreOrbit({ x: Infinity, y: NaN }, 6)).toEqual({ radius: 4, phase: 0 });
});

it('holds the galactic center fixed while the galaxy grows and rotates', () => {
  const group = new Group();
  for (const extent of [0.1, 0.6, 1, 1.8])
    for (const angle of [0, 0.4, 2, 5]) {
      setGalacticPivot(group, extent, angle);
      group.updateMatrixWorld();
      const center = new Vector3(31, 0, 0).applyMatrix4(group.matrixWorld);
      expect(center.x).toBeCloseTo(31, 9);
      expect(center.y).toBeCloseTo(0, 9);
    }
});
