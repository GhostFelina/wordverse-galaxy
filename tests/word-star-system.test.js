import { it, expect } from 'vitest';
import { Group, PerspectiveCamera } from 'three';
import { createWordStarSystem, wordStarPosition, WORD_STAR_RADIUS } from '../src/word-star-system.js';

it('retains exact stored positions including zero depth across additions and movement', () => {
  const parent = new Group(),
    system = createWordStarSystem(parent);
  const entry = Object.freeze({ id: 'one', x: 31, y: 0, z: 0 });
  system.setEntries([entry]);
  const camera = new PerspectiveCamera(50, 1, 0.1, 100000);
  camera.position.set(31, 0, 40);
  camera.updateMatrixWorld();
  system.update(0, camera, 900, 1);
  const before = system.state('one').position.toArray();
  system.setEntries([entry, { id: 'two', x: 55, y: 10, z: 18 }]);
  system.update(60, camera, 900, 1);
  expect(system.state('one').position.toArray()).toEqual(before);
  expect(before).toEqual([31, 0, 0]);
  expect(wordStarPosition(entry).toArray()).toEqual(before);
  system.dispose();
});

it('uses one star family, bounded surfaces for 5000 records, and natural behind-camera culling', () => {
  const parent = new Group(),
    system = createWordStarSystem(parent);
  const records = Array.from({ length: 5000 }, (_, i) => ({ id: String(i), x: 31 + i * 8, y: 0, z: 18 }));
  system.setEntries(records);
  expect(system.root.getObjectByName('word-star-cores-and-optics').geometry.getAttribute('position').count).toBe(5000);
  const surfaces = system.root.children.filter((node) => node.name === 'word-star-photosphere');
  expect(surfaces).toHaveLength(24);
  expect(surfaces.every((mesh) => mesh.scale.x === WORD_STAR_RADIUS)).toBe(true);
  const camera = new PerspectiveCamera(50, 1, 0.1, 100000);
  camera.position.set(31, 0, 50000);
  camera.updateMatrixWorld();
  system.update(0, camera, 900, 1);
  expect(system.detailCount).toBe(0);
  camera.position.z = 19;
  camera.updateMatrixWorld();
  system.update(0, camera, 900, 1);
  expect(system.state('0').blend).toBe(1);
  camera.position.z = 10;
  camera.updateMatrixWorld();
  system.update(0, camera, 900, 1);
  expect(system.state('0').diameter).toBe(0);
  expect(system.detailCount).toBe(0);
  let released = 0;
  surfaces[0].geometry.addEventListener('dispose', () => released++);
  system.dispose();
  system.dispose();
  expect(released).toBe(1);
  expect(parent.children).toHaveLength(0);
});
