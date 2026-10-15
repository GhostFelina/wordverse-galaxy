import { expect, it } from 'vitest';
import { createSkyPlacement } from '../src/sky-event-placement.js';

it('keeps accents in safe sky regions and varies consecutive placement without record input', () => {
  let seed = 329,
    previous;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    const placement = createSkyPlacement({ random, wide: true, previous });
    expect(Math.abs(placement.center[0])).toBeLessThan(0.6);
    expect(placement.center[1]).toBeGreaterThan(-0.25);
    expect(placement.center[1]).toBeLessThan(0.65);
    if (previous)
      expect(Math.hypot(placement.center[0] - previous[0], placement.center[1] - previous[1])).toBeGreaterThan(0.15);
    seen.add(placement.center[0] < 0 ? 'left' : 'right');
    previous = placement.center;
  }
  expect(seen.size).toBe(2);
});

it('leaves the home reading column free even under degenerate random input', () => {
  for (const random of [() => 0, () => 1, () => NaN]) {
    const placement = createSkyPlacement({ random });
    expect(placement.center[0]).toBeGreaterThan(0);
    expect(placement.center[1]).toBeGreaterThan(-0.1);
    expect(placement.scale).toBeGreaterThanOrEqual(0.72);
    expect(placement.scale).toBeLessThan(0.95);
  }
});
