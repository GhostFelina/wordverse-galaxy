import type { SupabaseClient } from '@supabase/supabase-js';
import { saveAccountCache, type AccountCache, type PendingChange } from './account-cache';
import { readCloudSnapshot, type SyncUniverse, type CloudRow, type CloudSnapshot } from './cloud-universe';
import { writeCloudChange, type WriteResult } from './cloud-write';
import { acknowledgeSyncWrite, planSyncChanges, syncKindFor } from './sync-queue';
import { reconcileAccount } from './sync-reconcile';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'offline' | 'conflict' | 'error';
export type SyncState = {
  status: SyncStatus;
  localSaved: boolean;
  cache: AccountCache;
  conflict?: { sent: PendingChange; remote: CloudRow | null };
};
type Options = {
  client: SupabaseClient;
  cache: AccountCache;
  online?: () => boolean;
  save?: (cache: AccountCache) => Promise<void>;
  write?: (change: PendingChange) => Promise<WriteResult>;
  read?: () => Promise<CloudSnapshot>;
  onState?: (state: SyncState) => void;
  onUniverse?: (universe: SyncUniverse) => void;
  onMerged?: (conflicts: ReturnType<typeof reconcileAccount>['conflicts']) => void;
};

// One instance belongs to exactly one account. Stop it immediately when the
// auth identity changes. Late responses cannot publish into the next account.
export class AccountSyncEngine {
  private cache: AccountCache;
  private active = true;
  private dirty = false;
  private mutations: Promise<unknown> = Promise.resolve();
  private flushing: Promise<void> | null = null;
  private refreshing: Promise<void> | null = null;
  private readonly online: () => boolean;
  private readonly save: (cache: AccountCache) => Promise<void>;
  private readonly write: (change: PendingChange) => Promise<WriteResult>;
  private readonly read: () => Promise<CloudSnapshot>;
  private readonly onState: (state: SyncState) => void;
  private readonly onUniverse: (universe: SyncUniverse) => void;
  private readonly onMerged: (conflicts: ReturnType<typeof reconcileAccount>['conflicts']) => void;
  private status: SyncStatus;
  private conflict: SyncState['conflict'];

  constructor(options: Options) {
    this.cache = structuredClone(options.cache);
    // Validate the baseline and every queued owner before any request.
    planSyncChanges(this.cache, this.cache.universe);
    this.online = options.online || (() => typeof navigator === 'undefined' || navigator.onLine !== false);
    this.save = options.save || saveAccountCache;
    this.write = options.write || ((change) => writeCloudChange(options.client, this.cache.ownerId, change));
    this.read = options.read || (() => readCloudSnapshot(options.client, this.cache.ownerId));
    this.onState = options.onState || (() => {});
    this.onUniverse = options.onUniverse || (() => {});
    this.onMerged = options.onMerged || (() => {});
    this.status = this.cache.pending.length ? 'pending' : 'synced';
  }

  snapshot(): SyncState {
    return structuredClone({
      status: this.status,
      localSaved: !this.dirty,
      cache: this.cache,
      ...(this.conflict ? { conflict: this.conflict } : {}),
    });
  }

  stop() {
    this.active = false;
  }

  private publish(status: SyncStatus) {
    this.status = status;
    if (this.active) this.onState(this.snapshot());
  }

  private serial<T>(action: () => Promise<T>): Promise<T> {
    const next = this.mutations.catch(() => {}).then(action);
    this.mutations = next;
    return next;
  }

  private async persist(next: AccountCache) {
    this.cache = next;
    this.dirty = true;
    await this.save(structuredClone(next));
    this.dirty = false;
  }

  async update(universe: SyncUniverse): Promise<void> {
    const copy = structuredClone(universe);
    return this.serial(async () => {
      if (!this.active) throw new Error('Sync account stopped');
      try {
        await this.persist(planSyncChanges(this.cache, copy));
        this.conflict = undefined;
        this.publish(this.online() ? (this.cache.pending.length ? 'pending' : 'synced') : 'offline');
      } catch (error) {
        this.publish('error');
        throw error;
      }
    });
  }

  // Call after a local update, reconnect or explicit retry. Concurrent calls
  // share a single drain; network waits never block local durable mutations.
  flush(): Promise<void> {
    if (this.refreshing) return this.refreshing.then(() => this.flush());
    if (this.flushing) return this.flushing;
    const running = this.drain();
    this.flushing = running.finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  // Pause new outgoing writes while obtaining a fresh baseline. Local edits
  // still persist during this read and participate in the three-way merge.
  refresh(): Promise<void> {
    if (this.refreshing) return this.refreshing;
    const previousDrain = this.flushing;
    const running = Promise.resolve().then(async () => {
      try {
        if (previousDrain) await previousDrain;
        if (!this.active) return;
        if (!this.online()) {
          this.publish('offline');
          return;
        }
        const remote = await this.read();
        if (!this.active) return;
        await this.serial(async () => {
          if (!this.active) return;
          const reconciled = reconcileAccount(this.cache, remote);
          // Publish the new visible model synchronously before awaiting IDB.
          // Any next edit therefore includes newly preserved conflict copies.
          this.onUniverse(structuredClone(reconciled.cache.universe));
          await this.persist(reconciled.cache);
          if (this.active && reconciled.conflicts.length) this.onMerged(structuredClone(reconciled.conflicts));
          this.conflict = undefined;
          this.publish(this.cache.pending.length ? 'pending' : 'synced');
        });
      } catch {
        this.publish('error');
      }
    });
    this.refreshing = running.finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async drain() {
    try {
      while (this.active) {
        const sent = await this.serial(async () => {
          if (!this.active) return null;
          if (this.dirty) await this.persist(structuredClone(this.cache));
          if (!this.online()) {
            this.publish('offline');
            return null;
          }
          const order = ['galaxies', 'words', 'events', 'settings'];
          const next = [...this.cache.pending].sort(
            (a, b) => order.indexOf(syncKindFor(a.table)) - order.indexOf(syncKindFor(b.table)),
          )[0];
          this.publish(next ? 'syncing' : 'synced');
          return next ? structuredClone(next) : null;
        });
        if (!sent || !this.active) return;
        const result = await this.write(sent);
        if (!this.active) return;
        const accepted = await this.serial(async () => {
          if (!this.active) return false;
          let next: AccountCache;
          if (result.status === 'conflict') {
            // A lost response can leave an already committed request queued.
            // Only byte-equivalent payload/tombstone contents count as its ack.
            try {
              if (!result.row) throw new Error('Missing conflict record');
              next = acknowledgeSyncWrite(this.cache, sent, result.row);
            } catch {
              this.conflict = { sent, remote: result.row };
              this.publish('conflict');
              return false;
            }
          } else next = acknowledgeSyncWrite(this.cache, sent, result.row);
          await this.persist(next);
          this.conflict = undefined;
          this.publish(this.cache.pending.length ? 'pending' : 'synced');
          return true;
        });
        if (!accepted) return;
      }
    } catch {
      // Keep the queue for reconnect/retry; never report success on a failed
      // network request or failed IndexedDB transaction.
      this.publish('error');
    }
  }
}
