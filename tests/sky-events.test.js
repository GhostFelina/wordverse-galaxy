import { describe, expect, it } from 'vitest';
import { createSkyEventState } from '../src/sky-events.js';

describe('ephemeral sky experiences', () => {
  it('starts quiet, replaces events and bounds elapsed time across pauses', () => {
    const state = createSkyEventState();
    expect(state.snapshot().kind).toBeNull();
    state.select('meteor');
    state.update(300);
    expect(state.snapshot().elapsed).toBe(0.1);
    state.select('supernova');
    expect(state.snapshot().elapsed).toBe(0);
    state.update(NaN);
    state.update(-10);
    expect(state.snapshot().elapsed).toBe(0);
    state.select('unknown');
    expect(state.snapshot().kind).toBeNull();
  });
  it('ends transient events but keeps a chosen black hole until dismissed', () => {
    const state = createSkyEventState();
    state.select('meteor');
    for (let i = 0; i < 62; i++) state.update(0.1);
    expect(state.snapshot().kind).toBeNull();
    state.select('blackhole');
    for (let i = 0; i < 200; i++) state.update(0.1);
    expect(state.snapshot().kind).toBe('blackhole');
    state.select(null);
    expect(state.snapshot().kind).toBeNull();
    state.select('kilonova');
    for (let i = 0; i < 222; i++) state.update(0.1);
    expect(state.snapshot().kind).toBeNull();
  });
  it('holds a representative still instead of animating under reduced motion', () => {
    const state = createSkyEventState({ reducedMotion: true });
    state.select('supernova');
    const before = state.snapshot();
    for (let i = 0; i < 200; i++) state.update(0.1);
    expect(state.snapshot()).toEqual(before);
    expect(before.elapsed).toBe(8);
    state.select('kilonova');
    const merger = state.snapshot();
    for (let i = 0; i < 250; i++) state.update(0.1);
    expect(state.snapshot()).toEqual(merger);
    expect(merger.elapsed).toBe(13);
  });
});
