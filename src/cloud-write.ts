import type { SupabaseClient } from '@supabase/supabase-js';
import type { PendingChange } from './account-cache';
import { validateCloudRows, type CloudRow } from './cloud-universe';
import { syncKindFor } from './sync-queue';

export type WriteResult = { status: 'applied'; row: CloudRow } | { status: 'conflict'; row: CloudRow | null };

export async function writeCloudChange(
  client: SupabaseClient,
  ownerId: string,
  change: PendingChange,
): Promise<WriteResult> {
  const kind = syncKindFor(change.table);
  validateCloudRows([change.row], ownerId, kind);
  const { data, error } = await client.rpc('wordverse_write_change', {
    p_owner_id: ownerId,
    p_table: change.table,
    p_id: change.row.id || null,
    p_payload: change.row.payload,
    p_galaxy_id: change.row.galaxy_id || null,
    p_deleted_at: change.row.deleted_at,
    p_expected_updated_at: change.expectedUpdatedAt,
  });
  if (error || !data || !['applied', 'conflict'].includes(data.status)) throw new Error('Cloud write failed');
  if (data.row) {
    validateCloudRows([data.row], ownerId, kind);
    if (kind !== 'settings' && data.row.id !== change.row.id) throw new Error('Cloud write identity mismatch');
  } else if (data.status === 'applied') throw new Error('Cloud write returned no record');
  return data as WriteResult;
}
