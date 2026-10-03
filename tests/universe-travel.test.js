import { describe, it, expect } from 'vitest';
import { rebaseTravelZoom } from '../src/universe-travel.js';

describe('continuous universe travel', () => {
  it('keeps the absolute target and the wheel delta when leaving a galaxy depth', () => {
    const state = rebaseTravelZoom(1700, -600, 1900);
    expect(state.depth).toBe(0);
    expect(state.value + state.depth).toBe(1900 - 600);
    expect(state.value - state.zoom).toBe(200);
  });
  it('retains the reference while inside a galaxy or before clearing the outer plane', () => {
    expect(rebaseTravelZoom(250, -800, 280)).toEqual({ zoom: 250, depth: -800, value: 280 });
    expect(rebaseTravelZoom(1700, -1000, 1800)).toEqual({ zoom: 1700, depth: -1000, value: 1800 });
  });
});
