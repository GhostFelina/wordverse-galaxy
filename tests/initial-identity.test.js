import { afterEach, expect, it, vi } from 'vitest';
import { createInitialIdentityGate } from '../src/initial-identity.js';
afterEach(() => vi.useRealTimers());
it('offers the guest view once on a stalled refresh without blocking late identity', () => {
  vi.useFakeTimers();
  const fallback = vi.fn();
  const gate = createInitialIdentityGate(fallback);
  vi.advanceTimersByTime(3999);
  expect(fallback).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(fallback).toHaveBeenCalledTimes(1);
  gate.resolve();
  vi.advanceTimersByTime(10000);
  expect(fallback).toHaveBeenCalledTimes(1);
});
it('never overrides an identity that resolved before the deadline', () => {
  vi.useFakeTimers();
  const fallback = vi.fn();
  const gate = createInitialIdentityGate(fallback);
  gate.resolve();
  vi.advanceTimersByTime(10000);
  expect(fallback).not.toHaveBeenCalled();
});
