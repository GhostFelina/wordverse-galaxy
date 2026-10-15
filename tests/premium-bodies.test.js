import { expect, it } from 'vitest';
import { Scene, PerspectiveCamera, SphereGeometry } from 'three';
import { createPremiumBodies } from '../src/premium-bodies.js';

it('single-star adapters contain no planets and leave borrowed geometry alive', () => {
  const scene = new Scene();
  const geometry = new SphereGeometry(1, 16, 12);
  let disposed = 0;
  geometry.addEventListener('dispose', () => disposed++);
  const bodies = createPremiumBodies(scene, { kind: 'star', radius: 2, geometry });
  expect(bodies.root.children.some((child) => child.name.includes('planet'))).toBe(false);
  const camera = new PerspectiveCamera(50, 1, 0.1, 100000);
  camera.position.z = 50000;
  bodies.update(0, camera);
  expect(bodies.visiblePointCount()).toBe(1);
  expect(bodies.visibleDetailCount()).toBe(0);
  bodies.dispose();
  expect(scene.children).toHaveLength(0);
  expect(disposed).toBe(0);
  geometry.dispose();
  expect(disposed).toBe(1);
});

it('keeps procedural scene ownership bounded through ten mounts and disposes shared resources once', () => {
  const scene = new Scene();
  for (let i = 0; i < 10; i++) {
    const bodies = createPremiumBodies(scene);
    const geometry = bodies.star.geometry;
    let geometryDisposed = 0;
    let materialsDisposed = 0;
    geometry.addEventListener('dispose', () => geometryDisposed++);
    for (const child of bodies.root.children) child.material.addEventListener('dispose', () => materialsDisposed++);
    bodies.update(i);
    expect(scene.children).toHaveLength(1);
    bodies.dispose();
    bodies.dispose();
    expect(scene.children).toHaveLength(0);
    expect(geometryDisposed).toBe(1);
    expect(materialsDisposed).toBe(5);
  }
});

it('replaces subpixel surfaces with small points and restores detail smoothly on approach', () => {
  const scene = new Scene();
  const bodies = createPremiumBodies(scene);
  const camera = new PerspectiveCamera(50, 1, 0.1, 100000);
  camera.position.z = 50000;
  bodies.update(0, camera, 1080, 2);
  const point = bodies.root.getObjectByName('showcase-star-surface-distant-point');
  expect(bodies.star.visible).toBe(false);
  expect(point.visible).toBe(true);
  expect(point.material.uniforms.size.value).toBe(4.4);
  camera.position.z = 5000;
  bodies.update(0, camera, 1080, 1);
  expect(bodies.star.material.uniforms.detailBlend.value).toBeGreaterThan(0);
  expect(bodies.star.material.uniforms.detailBlend.value).toBeLessThan(1);
  expect(point.material.uniforms.alpha.value + bodies.star.material.uniforms.detailBlend.value).toBe(1);
  camera.position.z = 120;
  bodies.update(0, camera, 1080, 1);
  expect(bodies.star.visible).toBe(true);
  expect(point.visible).toBe(false);
  bodies.dispose();
});
