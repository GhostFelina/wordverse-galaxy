import { expect, it } from 'vitest';
import { worldUnitsPerPixel, pinchRatio } from '../src/camera-input.js';

it('keeps drag distance consistent with the projected camera scale and viewport', () => {
  const world = worldUnitsPerPixel(142, 75, 900) * 100;
  const projectedPixels = (world / (2 * 142 * Math.tan((75 * Math.PI) / 360))) * 900;
  expect(projectedPixels).toBeCloseTo(100);
  expect(worldUnitsPerPixel(71, 75, 900)).toBeCloseTo(worldUnitsPerPixel(142, 75, 900) / 2);
  expect(worldUnitsPerPixel(142, 75, 1800)).toBeCloseTo(worldUnitsPerPixel(142, 75, 900) / 2);
});

it('makes incremental pinch updates reversible and independent of event frequency', () => {
  const fragmented = pinchRatio(100, 120) * pinchRatio(120, 160) * pinchRatio(160, 200);
  expect(fragmented).toBeCloseTo(pinchRatio(100, 200));
  expect(fragmented * pinchRatio(200, 100)).toBeCloseTo(1);
  expect(Number.isFinite(pinchRatio(0, 0))).toBe(true);
});
