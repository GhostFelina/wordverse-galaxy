import { expect, it } from 'vitest';
import { createRenderQuality } from '../src/render-quality.js';

it('respects explicit quality, resize reads and device limits without adaptive drift', () => {
  const quality = createRenderQuality({ maximum: 1.5 });
  quality.setMode('low');
  for (let i = 0; i < 300; i++) quality.sample(16);
  expect(quality.ratio).toBe(0.75);
  quality.setMode('high');
  for (let i = 0; i < 32; i++) quality.sample(100);
  expect(quality.ratio).toBe(1.5);
  quality.setMode('auto');
  for (let i = 0; i < 8; i++) quality.sample(100);
  expect(quality.ratio).toBeLessThan(1.5);
  const small = createRenderQuality({ maximum: 0.5 });
  for (let i = 0; i < 32; i++) small.sample(100);
  expect(small.ratio).toBeLessThanOrEqual(0.5);
});

it('does not count interrupted frame streaks across a paused render loop', () => {
  const quality = createRenderQuality({ maximum: 1.5 });
  for (let i = 0; i < 7; i++) quality.sample(100);
  quality.resetTiming();
  expect(quality.sample(100)).toBe(1.5);
  expect(quality.sample(NaN)).toBe(1.5);
});

it('reduces sustained slow frames, ignores an isolated hitch and recovers with hysteresis', () => {
  const changed = [];
  const quality = createRenderQuality({ maximum: 1.5, onChange: (ratio) => changed.push(ratio) });
  quality.sample(500);
  expect(quality.sample(16)).toBe(1.5);
  for (let i = 0; i < 32; i++) quality.sample(70);
  const reduced = changed.at(-1);
  expect(reduced).toBeLessThan(1);
  for (let i = 0; i < 100; i++) quality.sample(16);
  expect(changed.at(-1)).toBe(reduced);
  for (let i = 0; i < 200; i++) quality.sample(16);
  expect(changed.at(-1)).toBeGreaterThan(reduced);
});
