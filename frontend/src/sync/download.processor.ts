import { database } from '../database';
import { schemaTables } from '../database/schema';
import { apiClient } from '../api/client';
import { SyncChanges, SyncResponse } from './sync.types';
import { ConflictResolver } from './conflict.resolver';
import { useSyncStore } from '../store/syncStore';
import { eq } from 'drizzle-orm';

export class DownloadProcessor {
  /**
   * Pulls changes from the server and applies them locally
   */
  static async pullChanges(businessId: string | null, lastPulledAt: number, forceFull: boolean = false): Promise<number> {
    const effectiveLastPulledAt = forceFull ? 0 : lastPulledAt;

    const response = await apiClient.get('/sync/pull', {
      params: {
        lastPulledAt: effectiveLastPulledAt,
        businessId: businessId ?? undefined,
      },
    });

    const { changes, timestamp } = response.data as SyncResponse;

    await this.applyChanges(changes);

    const downloaded = this.countChangeset(changes);
    useSyncStore.getState().addLog({
      timestamp: Date.now(),
      event: 'PULL_COMPLETED',
      message: `Pulled ${downloaded} records from server`,
      records: { downloaded },
    });

    return timestamp;
  }

  /**
   * Convert any ISO date strings in a server record to Unix millisecond timestamps,
   * so they match the SQLite INTEGER columns used locally.
   */
  private static normalizeRecord(record: any): any {
    const dateFields = ['createdAt', 'updatedAt', 'deletedAt', 'dueDate', 'date', 'expiresAt'];
    const normalized = { ...record };
    for (const field of dateFields) {
      if (normalized[field] && typeof normalized[field] === 'string') {
        const ms = new Date(normalized[field]).getTime();
        normalized[field] = isNaN(ms) ? null : ms;
      }
    }
    return normalized;
  }

  private static async applyChanges(changes: SyncChanges): Promise<void> {
    await database.transaction(async (tx) => {
      const tableNames = Object.keys(changes);

      for (const tableName of tableNames) {
        const tableDef = schemaTables[tableName];
        if (!tableDef) continue; // Skip unknown tables

        const tableChanges = changes[tableName];

        // 1. Handle DELETED records
        if (tableChanges.deleted && tableChanges.deleted.length > 0) {
          for (const id of tableChanges.deleted) {
            // Hard delete locally to match server state
            await tx.delete(tableDef).where(eq(tableDef.id, id));
          }
        }

        // 2. Handle CREATED records
        if (tableChanges.created && tableChanges.created.length > 0) {
          for (const serverRecord of tableChanges.created) {
            // Ensure syncStatus is SYNCED and dates are normalized
            const recordToInsert = { ...this.normalizeRecord(serverRecord), syncStatus: 1 };
            
            // Check if exists locally
            const existing = await tx.select().from(tableDef).where(eq(tableDef.id, serverRecord.id));
            if (existing.length === 0) {
              await tx.insert(tableDef).values(recordToInsert);
            } else {
              // Exists locally, resolve conflict
              const { resolvedRecord } = ConflictResolver.resolve(existing[0], recordToInsert);
              await tx.update(tableDef).set(resolvedRecord).where(eq(tableDef.id, serverRecord.id));
            }
          }
        }

        // 3. Handle UPDATED records
        if (tableChanges.updated && tableChanges.updated.length > 0) {
          for (const serverRecord of tableChanges.updated) {
            const recordToUpdate = { ...this.normalizeRecord(serverRecord), syncStatus: 1 };

            const existing = await tx.select().from(tableDef).where(eq(tableDef.id, serverRecord.id));
            if (existing.length === 0) {
              // Server says updated, but we don't have it. Just create it.
              await tx.insert(tableDef).values(recordToUpdate);
            } else {
              const { resolvedRecord } = ConflictResolver.resolve(existing[0], recordToUpdate);
              await tx.update(tableDef).set(resolvedRecord).where(eq(tableDef.id, serverRecord.id));
            }
          }
        }
      }
    });
  }

  private static countChangeset(changes: SyncChanges): number {
    return Object.values(changes).reduce((acc, c) => {
      if (c && typeof c === 'object') {
        return acc + (c.created?.length ?? 0) + (c.updated?.length ?? 0) + (c.deleted?.length ?? 0);
      }
      return acc;
    }, 0);
  }
}
