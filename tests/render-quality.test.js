import { expect, it } from 'vitest';
import { createRenderQuality } from '../src/render-quality.js';

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
