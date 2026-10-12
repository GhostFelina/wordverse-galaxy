import { describe, expect, it } from 'vitest';
import { createSoundscape, soundscapeMix } from '../src/soundscape.js';

describe('optional scene audio', () => {
  it('keeps audio uninitialized until an explicit gesture, even during scene and event updates', () => {
    let creations = 0;
    const sound = createSoundscape({
      createContext: () => {
        creations++;
        throw new Error('Unavailable');
      },
    });
    sound.update({ depth: 0.8, event: 'blackhole' });
    sound.event('meteor');
    sound.birth();
    sound.setVolume(0.8);
    expect(creations).toBe(0);
    expect(sound.snapshot().enabled).toBe(false);
  });
  it('does not let a pending resume re-enable a muted or disposed controller', async () => {
    let resume;
    const context = {
      state: 'suspended',
      resume: () =>
        new Promise((resolve) => {
          resume = resolve;
        }),
      suspend: async () => {},
      close: async () => {},
    };
    const sound = createSoundscape({ createContext: () => context });
    const pending = sound.toggle();
    await sound.toggle();
    resume();
    await pending;
    expect(sound.snapshot().enabled).toBe(false);
    const second = sound.toggle();
    await sound.dispose();
    resume();
    await second;
    expect(sound.snapshot().enabled).toBe(false);
    expect(sound.snapshot().available).toBe(false);
  });
  it('bounds scene mixes and separates distant sky, nebula and focused stellar atmosphere', () => {
    const quiet = soundscapeMix(),
      deep = soundscapeMix({ depth: 1 });
    expect(deep.air).toBeGreaterThan(quiet.air);
    expect(deep.cutoff).toBeGreaterThan(quiet.cutoff);
    expect(soundscapeMix({ focused: true }).shimmer).toBeGreaterThan(quiet.shimmer);
    expect(soundscapeMix({ event: 'blackhole' }).bass).toBeGreaterThan(deep.bass);
    expect(soundscapeMix({ depth: Infinity })).toEqual(quiet);
    expect(soundscapeMix({ depth: 999 })).toEqual(deep);
  });
});
