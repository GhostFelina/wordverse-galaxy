import { describe, expect, it } from 'vitest';
import { createExperienceMode, createSceneSlot } from '../src/experience-mode.js';

describe('experience ownership boundaries', () => {
  it('allows explicit guest recovery during account load and returns to the correct owner when ready', () => {
    const mode = createExperienceMode({ guestCount: 2 });
    mode.session('pending-owner');
    expect(mode.snapshot().ready).toBe(false);
    expect(mode.enterGuest()).toBe(true);
    expect(mode.snapshot()).toMatchObject({ mode: 'guest-personal', ready: true });
    expect(mode.contentReady('stale-owner')).toBe(false);
    mode.contentReady('pending-owner');
    expect(mode.snapshot()).toMatchObject({ mode: 'personal', ownerId: 'pending-owner', ready: true });
  });
  it('does not flash demo during initialization or another owner during replacement', () => {
    const changes = [];
    const mode = createExperienceMode({ guestCount: 13, onChange: (value) => changes.push(value) });
    expect(mode.snapshot().mode).toBeNull();
    mode.session('owner-a');
    expect(mode.snapshot()).toMatchObject({ mode: 'personal', ready: false });
    mode.contentReady('owner-a');
    mode.session('owner-a');
    expect(mode.snapshot().ready).toBe(true);
    mode.session('owner-b');
    expect(mode.contentReady('owner-a')).toBe(false);
    expect(mode.snapshot().ready).toBe(false);
    expect(mode.enterDemo()).toBe(false);
    mode.contentReady('owner-b');
    mode.session(null);
    expect(mode.snapshot()).toMatchObject({ mode: 'guest-personal', ownerId: null, ready: true });
    expect(changes.filter((value) => value.mode === 'showcase-demo')).toHaveLength(0);
  });

  it('keeps an explicit demo preview until guest continuation, without discarding guest presence', () => {
    const mode = createExperienceMode({ guestCount: 1 });
    mode.session(null);
    mode.enterDemo();
    expect(mode.snapshot().mode).toBe('showcase-demo');
    mode.enterGuest();
    expect(mode.snapshot().mode).toBe('guest-personal');
    mode.session('empty-owner');
    mode.contentReady('empty-owner');
    expect(mode.snapshot().mode).toBe('personal');
  });
});

it('disposes a delayed scene after replacement and stops pending mounts', async () => {
  const slot = createSceneSlot();
  const disposed = [];
  let release;
  const old = slot.replace(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  await slot.replace(async () => ({ dispose: () => disposed.push('new') }));
  release({ dispose: () => disposed.push('old') });
  expect(await old).toBeNull();
  slot.clear();
  slot.clear();
  expect(disposed).toEqual(['old', 'new']);
});
