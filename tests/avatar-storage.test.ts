import { expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AVATAR_MAX_BYTES,
  assertAvatarPath,
  validateAvatar,
  uploadAvatar,
  downloadAvatar,
  removeAvatar,
} from '../src/avatar-storage';
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const path = `${owner}/avatar-33333333-3333-4333-8333-333333333333.png`;
const png = () => new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], { type: 'image/png' });
function mock() {
  let active = owner;
  let resultError: unknown = null;
  let afterWrite = () => {};
  const calls: { action: string; path: string; options?: Record<string, unknown> }[] = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: active } }, error: null }) },
    storage: {
      from: (bucket: string) => {
        expect(bucket).toBe('wordverse-avatars');
        return {
          upload: async (key: string, _file: Blob, options: Record<string, unknown>) => {
            calls.push({ action: 'upload', path: key, options });
            afterWrite();
            return { data: { path: key }, error: resultError };
          },
          download: async (key: string) => {
            calls.push({ action: 'download', path: key });
            afterWrite();
            return { data: png(), error: resultError };
          },
          remove: async (keys: string[]) => {
            expect(keys).toHaveLength(1);
            calls.push({ action: 'remove', path: keys[0] });
            afterWrite();
            return { data: [], error: resultError };
          },
        };
      },
    },
  } as unknown as SupabaseClient;
  return {
    client,
    calls,
    active: (id: string) => {
      active = id;
    },
    fail: () => {
      resultError = { message: 'sensitive backend detail' };
    },
    switchDuringRequest: () => {
      afterWrite = () => {
        active = other;
      };
    },
  };
}

test('accepts JPEG, PNG and WebP signatures and rejects empty, oversized, fake MIME and SVG files', async () => {
  await expect(validateAvatar(png())).resolves.toBe('png');
  await expect(validateAvatar(new Blob([new Uint8Array([255, 216, 255, 0])], { type: 'image/jpeg' }))).resolves.toBe(
    'jpg',
  );
  await expect(validateAvatar(new Blob(['RIFF1234WEBP'], { type: 'image/webp' }))).resolves.toBe('webp');
  await expect(validateAvatar(new Blob([], { type: 'image/png' }))).rejects.toThrow('file-size');
  await expect(validateAvatar(new Blob([new Uint8Array(AVATAR_MAX_BYTES + 1)], { type: 'image/png' }))).rejects.toThrow(
    'file-size',
  );
  await expect(validateAvatar(new Blob(['<svg/>'], { type: 'image/svg+xml' }))).rejects.toThrow('file-type');
  await expect(validateAvatar(new Blob(['not a PNG'], { type: 'image/png' }))).rejects.toThrow('file-content');
  const boundary = new Uint8Array(AVATAR_MAX_BYTES);
  boundary.set(new Uint8Array(await png().arrayBuffer()));
  await expect(validateAvatar(new Blob([boundary], { type: 'image/png' }))).resolves.toBe('png');
});

test('rejects foreign folders, traversal, arbitrary filenames and mismatched replacement extensions before storage requests', async () => {
  const setup = mock();
  for (const bad of [
    `${other}/avatar-33333333-3333-4333-8333-333333333333.png`,
    `${owner}/../avatar.png`,
    `${owner}/avatar.png`,
    `https://example.test/${path}`,
    `${path}?token=x`,
  ]) {
    expect(() => assertAvatarPath(owner, bad)).toThrow('invalid-path');
    await expect(downloadAvatar(setup.client, owner, bad)).rejects.toThrow('invalid-path');
    await expect(removeAvatar(setup.client, owner, bad)).rejects.toThrow('invalid-path');
  }
  await expect(uploadAvatar(setup.client, owner, png(), path.replace('.png', '.jpg'))).rejects.toThrow('invalid-path');
  expect(setup.calls).toHaveLength(0);
});

test('new uploads use random owner paths; replacements explicitly upsert and reads return private bytes', async () => {
  const setup = mock();
  const fresh = await uploadAvatar(setup.client, owner, png());
  assertAvatarPath(owner, fresh);
  expect(setup.calls[0].options).toMatchObject({ upsert: false, contentType: 'image/png', cacheControl: '0' });
  expect(await uploadAvatar(setup.client, owner, png(), path)).toBe(path);
  expect(setup.calls[1].options?.upsert).toBe(true);
  expect(await downloadAvatar(setup.client, owner, path)).toBeInstanceOf(Blob);
  await removeAvatar(setup.client, owner, path);
  expect(setup.calls.map((call) => call.action)).toEqual(['upload', 'upload', 'download', 'remove']);
});

test('a foreign or signed-out session cannot start an avatar operation', async () => {
  const setup = mock();
  setup.active(other);
  await expect(uploadAvatar(setup.client, owner, png())).rejects.toThrow('session-changed');
  await expect(downloadAvatar(setup.client, owner, path)).rejects.toThrow('session-changed');
  await expect(removeAvatar(setup.client, owner, path)).rejects.toThrow('session-changed');
  expect(setup.calls).toHaveLength(0);
});

for (const action of ['upload', 'download', 'remove'] as const)
  test(`late ${action} result is discarded after an account switch`, async () => {
    const setup = mock();
    setup.switchDuringRequest();
    const operation =
      action === 'upload'
        ? uploadAvatar(setup.client, owner, png())
        : action === 'download'
          ? downloadAvatar(setup.client, owner, path)
          : removeAvatar(setup.client, owner, path);
    await expect(operation).rejects.toThrow('session-changed');
  });

for (const action of ['upload', 'download', 'remove'] as const)
  test(`${action} errors expose a stable code without backend details`, async () => {
    const setup = mock();
    setup.fail();
    const operation =
      action === 'upload'
        ? uploadAvatar(setup.client, owner, png())
        : action === 'download'
          ? downloadAvatar(setup.client, owner, path)
          : removeAvatar(setup.client, owner, path);
    await expect(operation).rejects.toThrow(action === 'remove' ? 'remove-failed' : `${action}-failed`);
  });
