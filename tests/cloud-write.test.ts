import { expect, test } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendingChange } from '../src/account-cache';
import { writeCloudChange } from '../src/cloud-write';

const change: PendingChange = {
  table: 'wordverse_galaxies',
  expectedUpdatedAt: '2026-10-03T06:00:00Z',
  row: {
    user_id: 'a',
    id: 'g',
    payload: { id: 'g', name: 'Keep' },
    updated_at: '2026-10-03T06:01:00Z',
    deleted_at: null,
  },
};

test('conditional writes send an expected account and revision without client-controlled server time', async () => {
  let parameters: Record<string, unknown> = {};
  const client = {
    rpc: async (_name: string, args: Record<string, unknown>) => {
      parameters = args;
      return { data: { status: 'applied', row: { ...change.row, updated_at: '2026-10-03T07:00:00Z' } }, error: null };
    },
  } as unknown as SupabaseClient;
  const result = await writeCloudChange(client, 'a', change);
  expect(result.status).toBe('applied');
  expect(parameters.p_owner_id).toBe('a');
  expect(parameters.p_expected_updated_at).toBe(change.expectedUpdatedAt);
  expect(parameters).not.toHaveProperty('updated_at');
});

test('foreign owners are rejected before network writes and in server responses', async () => {
  let requests = 0;
  const client = {
    rpc: async () => {
      requests += 1;
      return { data: { status: 'applied', row: { ...change.row, user_id: 'b' } }, error: null };
    },
  } as unknown as SupabaseClient;
  await expect(writeCloudChange(client, 'b', change)).rejects.toThrow('account mismatch');
  expect(requests).toBe(0);
  await expect(writeCloudChange(client, 'a', change)).rejects.toThrow('account mismatch');
});

test('server conflicts are returned without being mistaken for successful acknowledgements', async () => {
  const client = {
    rpc: async () => ({
      data: { status: 'conflict', row: { ...change.row, payload: { id: 'g', name: 'Other device' } } },
      error: null,
    }),
  } as unknown as SupabaseClient;
  expect((await writeCloudChange(client, 'a', change)).status).toBe('conflict');
});
