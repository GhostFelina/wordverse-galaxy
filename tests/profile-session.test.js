import { expect, test, vi } from 'vitest';
import { profileSessionListener } from '../src/profile-ui.js';

test('late initial guest notification and same-owner refresh do not close the profile', () => {
  const close = vi.fn();
  const onSession = vi.fn(() => 'forwarded');
  const listener = profileSessionListener({ close }, onSession);
  expect(listener(null)).toBe('forwarded');
  expect(close).not.toHaveBeenCalled();
  listener({ user: { id: 'a' } });
  expect(close).toHaveBeenCalledTimes(1);
  listener({ user: { id: 'a' }, access_token: 'test-only-new-token' });
  expect(close).toHaveBeenCalledTimes(1);
  expect(onSession).toHaveBeenCalledTimes(3);
});

test('account switch and sign-out close the previous owner view before forwarding', () => {
  const actions = [];
  const listener = profileSessionListener({ close: () => actions.push('close') }, () => actions.push('session'));
  listener({ user: { id: 'a' } });
  listener({ user: { id: 'b' } });
  listener(null);
  expect(actions).toEqual(['close', 'session', 'close', 'session', 'close', 'session']);
});
