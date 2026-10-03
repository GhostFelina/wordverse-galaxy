import type { SupabaseClient } from '@supabase/supabase-js';

export const AVATAR_BUCKET = 'wordverse-avatars';
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const ownerPattern = new RegExp(`^${uuid}$`, 'i');
const pathPattern = new RegExp(`^(${uuid})/avatar-${uuid}\\.(jpg|png|webp)$`, 'i');
export type AvatarErrorCode =
  | 'file-type'
  | 'file-size'
  | 'file-content'
  | 'invalid-path'
  | 'session-changed'
  | 'upload-failed'
  | 'download-failed'
  | 'remove-failed';

export class AvatarStorageError extends Error {
  constructor(public readonly code: AvatarErrorCode) {
    super(code);
    this.name = 'AvatarStorageError';
  }
}

export function assertAvatarPath(ownerId: string, path: string): void {
  if (!ownerPattern.test(ownerId) || pathPattern.exec(path)?.[1] !== ownerId)
    throw new AvatarStorageError('invalid-path');
}

export async function validateAvatar(file: Blob): Promise<string> {
  const extension = extensions[file.type];
  if (!extension) throw new AvatarStorageError('file-type');
  if (!file.size || file.size > AVATAR_MAX_BYTES) throw new AvatarStorageError('file-size');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const starts = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  const valid =
    file.type === 'image/png'
      ? starts(137, 80, 78, 71, 13, 10, 26, 10)
      : file.type === 'image/jpeg'
        ? starts(255, 216, 255)
        : starts(82, 73, 70, 70) &&
          bytes.slice(8, 12).every((value, index) => value === [87, 69, 66, 80][index]) &&
          bytes.length === 12;
  if (!valid) throw new AvatarStorageError('file-content');
  return extension;
}

async function assertOwner(client: SupabaseClient, ownerId: string): Promise<void> {
  if (!ownerPattern.test(ownerId)) throw new AvatarStorageError('session-changed');
  try {
    const { data, error } = await client.auth.getUser();
    if (error || data.user?.id !== ownerId) throw new AvatarStorageError('session-changed');
  } catch {
    throw new AvatarStorageError('session-changed');
  }
}

// Callers persist only this private object path, never an expiring URL or auth token.
export async function uploadAvatar(
  client: SupabaseClient,
  ownerId: string,
  file: Blob,
  existingPath?: string,
): Promise<string> {
  const extension = await validateAvatar(file);
  const path = existingPath ?? `${ownerId}/avatar-${crypto.randomUUID()}.${extension}`;
  assertAvatarPath(ownerId, path);
  if (!path.endsWith(`.${extension}`)) throw new AvatarStorageError('invalid-path');
  await assertOwner(client, ownerId);
  try {
    const { data, error } = await client.storage.from(AVATAR_BUCKET).upload(path, file, {
      upsert: Boolean(existingPath),
      contentType: file.type,
      cacheControl: '0',
    });
    if (error || data?.path !== path) throw new AvatarStorageError('upload-failed');
  } catch {
    throw new AvatarStorageError('upload-failed');
  }
  await assertOwner(client, ownerId);
  return path;
}

// Authenticated download keeps the bucket private and does not create bearer URLs.
// A profile view may create an object URL for this Blob; revoke it when replacing/leaving.
export async function downloadAvatar(client: SupabaseClient, ownerId: string, path: string): Promise<Blob> {
  assertAvatarPath(ownerId, path);
  await assertOwner(client, ownerId);
  let blob: Blob;
  try {
    const { data, error } = await client.storage.from(AVATAR_BUCKET).download(path, {}, { cache: 'no-store' });
    if (error || !(data instanceof Blob)) throw new AvatarStorageError('download-failed');
    blob = data;
  } catch {
    throw new AvatarStorageError('download-failed');
  }
  await validateAvatar(blob);
  await assertOwner(client, ownerId);
  return blob;
}

// Removes exactly one verified owner's avatar; never lists or bulk-deletes a folder.
export async function removeAvatar(client: SupabaseClient, ownerId: string, path: string): Promise<void> {
  assertAvatarPath(ownerId, path);
  await assertOwner(client, ownerId);
  try {
    const { error } = await client.storage.from(AVATAR_BUCKET).remove([path]);
    if (error) throw new AvatarStorageError('remove-failed');
  } catch {
    throw new AvatarStorageError('remove-failed');
  }
  await assertOwner(client, ownerId);
}
