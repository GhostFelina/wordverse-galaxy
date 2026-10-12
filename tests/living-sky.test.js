import { expect, it } from 'vitest';
import { createLivingSky } from '../src/living-sky.js';

it('directs a shuffled bounded sequence with quiet gaps and smooth finite envelopes', () => {
  let seed = 17;
  const director = createLivingSky({
    random: () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    },
  });
  const started = [],
    stopped = [];
  let kind = null,
    previousStart = -1000,
    previousStop = -1000;
  for (let i = 0; i < 40000; i++) {
    const command = director.tick(0.1, kind);
    expect(director.envelope).toBeGreaterThanOrEqual(0);
    expect(director.envelope).toBeLessThanOrEqual(1);
    if (!command) continue;
    kind = command.kind;
    if (kind) {
      if (started.length) {
        expect(kind).not.toBe(started.at(-1));
        expect(i - previousStop).toBeGreaterThanOrEqual(449);
      }
      started.push(kind);
      previousStart = i;
      expect(director.envelope).toBe(0);
    } else {
      stopped.push(i);
      expect(i - previousStart).toBeLessThanOrEqual(451);
      previousStop = i;
    }
  }
  expect(new Set(started)).toEqual(new Set(['meteor', 'supernova', 'blackhole', 'kilonova']));
  expect(stopped.length).toBeGreaterThan(20);
});

it('pauses idle direction during learning, prioritizes manual choices and honors quiet mode', () => {
  const director = createLivingSky({ random: () => 0 });
  for (let i = 0; i < 3000; i++) expect(director.tick(0.1, null, true)).toBeNull();
  for (let i = 0; i < 119; i++) expect(director.tick(0.1)).toBeNull();
  const first = director.tick(0.1);
  expect(first?.kind).toBe('meteor');
  director.manual('blackhole');
  for (let i = 0; i < 3000; i++) expect(director.tick(0.1, 'blackhole')).toBeNull();
  for (let i = 0; i < 899; i++) expect(director.tick(0.1)).toBeNull();
  expect(director.tick(0.1)?.kind).toBeTruthy();
  director.manual(null);
  expect(director.enabled).toBe(false);
  for (let i = 0; i < 5000; i++) expect(director.tick(0.1)).toBeNull();
  director.reset();
  expect(director.enabled).toBe(false);
  director.setEnabled(true);
  expect(director.enabled).toBe(true);
});

it('does not jump through events on invalid deltas or resume gaps', () => {
  const director = createLivingSky({ random: () => 0 });
  for (const delta of [Infinity, NaN, -5, 100000]) expect(director.tick(delta)).toBeNull();
  expect(director.active).toBeNull();
});
