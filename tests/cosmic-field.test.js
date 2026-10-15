import { expect, test } from 'vitest';
import * as THREE from 'three';
import { createCosmicField } from '../src/cosmic-field.js';

test('camera motion preserves world positions, shared cells and buffer allocation', () => {
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera();
  const field = createCosmicField(scene, true);
  const points = scene.children.find((r) => r.name === 'continuous-cosmic-star-field');
  const distant = scene.children.find((r) => r.name === 'world-volume-distant-stars');
  const attribute = points.geometry.attributes.position;
  field.update(camera);
  const shared = () => {
    const found = [];
    for (let i = 0; i < attribute.count; i++) {
      const x = attribute.getX(i),
        y = attribute.getY(i),
        z = attribute.getZ(i);
      if (x >= 0 && x < 600 && y >= 0 && y < 600 && z >= 0 && z < 600) found.push([x, y, z]);
    }
    return found;
  };
  const before = shared();
  expect(before.length).toBeGreaterThan(0);
  camera.position.set(650, 0, 0);
  field.update(camera);
  expect(shared()).toEqual(before);
  expect(points.geometry.attributes.position).toBe(attribute);
  expect(distant.position.toArray()).toEqual([0, 0, 0]);
  const depths = new Set(
    Array.from(distant.geometry.attributes.position.array)
      .filter((_, i) => i % 3 === 2)
      .map((z) => Math.floor(z / 1000)),
  );
  expect(depths.size).toBeGreaterThan(40);
  field.dispose();
  expect(scene.children).toHaveLength(0);
});
