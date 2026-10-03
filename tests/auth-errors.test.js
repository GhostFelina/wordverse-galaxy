import { expect, test } from 'vitest';
import { authErrorKey } from '../src/supabase-client.js';

test('auth errors map to translated messages without exposing server details', () => {
  expect(authErrorKey({ code: 'invalid_credentials', message: 'private server detail' })).toBe('invalid');
  expect(authErrorKey({ code: 'email_not_confirmed' })).toBe('unconfirmed');
  expect(authErrorKey({ status: 429 })).toBe('rateLimit');
  expect(authErrorKey(new TypeError('network detail'))).toBe('network');
  expect(authErrorKey({ code: 'unknown' })).toBe('error');
});
