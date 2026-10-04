import { expect, it } from 'vitest';
import { PerspectiveCamera, Vector3, Group, Data3DTexture } from 'three';
import { placeWordStar, starApproach } from '../src/word-star-placement.js';
import { createStarTransmission } from '../src/star-nebula-transmission.js';

it('places random stars in the current visible frame at varied depths without moving earlier records', () => {
  const camera = new PerspectiveCamera(75, 1440 / 900, 0.1, 100000);
  camera.position.z = 160;
  camera.updateMatrixWorld();
  let seed = 317;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const records = [Object.freeze({ x: 31, y: 0, z: 18 })],
    before = JSON.stringify(records);
  const added = [];
  for (let i = 0; i < 20; i++) {
    const point = placeWordStar(camera, records, { random });
    const projected = new Vector3(point.x, point.y, point.z).project(camera);
    expect(projected.x).toBeGreaterThanOrEqual(-0.18);
    expect(projected.x).toBeLessThanOrEqual(0.74);
    expect(Math.abs(projected.y)).toBeLessThanOrEqual(0.57);
    added.push(point);
    records.push(Object.freeze(point));
  }
  expect(JSON.stringify(records.slice(0, 1))).toBe(before);
  expect(added.some((p) => p.z < -1600)).toBe(true);
  expect(added.some((p) => p.z > -600)).toBe(true);
  expect(new Set(added.map((p) => p.z)).size).toBe(20);
});
it('defines the reference55 as logarithmic distance progress and clamps both boundaries', () => {
  const far = 142,
    near = 0.45 * 1.35;
  expect(starApproach(far, far)).toBe(0);
  expect(starApproach(near, far)).toBe(1);
  expect(starApproach(far * Math.pow(near / far, 0.55), far)).toBeCloseTo(0.55);
  expect(starApproach(far * 2, far)).toBe(0);
  expect(starApproach(0, far)).toBe(1);
});
it('transmits foreground and empty sightlines while dimming background stars through gas', () => {
  const group = new Group(),
    density = new Data3DTexture(new Uint8Array(64).fill(255), 4, 4, 4);
  const transmission = createStarTransmission({ group, density });
  const camera = new PerspectiveCamera();
  camera.position.set(0, -0.4, 3);
  expect(transmission(new Vector3(0, -0.4, 2), camera)).toBe(1);
  const behind = transmission(new Vector3(0, -0.4, -3), camera);
  expect(behind).toBeGreaterThan(0);
  expect(behind).toBeLessThan(0.8);
  camera.position.x = 3;
  expect(transmission(new Vector3(3, -0.4, -3), camera)).toBe(1);
  density.dispose();
});
