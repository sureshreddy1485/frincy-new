import { database } from '../database';
import { syncQueue, schemaTables } from '../database/schema';
import { eq, asc, and, sql } from 'drizzle-orm';
import { QueueItem } from './sync.types';
import { RetryManager } from './retry.manager';

export class QueueProcessor {
  /**
   * Fetch all pending queue items sorted by creation time
   */
  static async getPendingItems(): Promise<QueueItem[]> {
    const rawItems = await database
      .select()
      .from(syncQueue)
      .orderBy(asc(syncQueue.createdAt));
      
    // Filter out items that are not ready for retry
    return (rawItems as QueueItem[]).filter(item => RetryManager.canRetry(item));
  }

  /**
   * Mark an item as successfully synced and remove from queue
   */
  static async markSuccess(item: QueueItem): Promise<void> {
    await database.transaction(async (tx) => {
      // Remove from queue
      await tx.delete(syncQueue).where(eq(syncQueue.id, item.id));

      // Update the actual record's syncStatus to SYNCED (1)
      const tableDef = schemaTables[item.tableName];
      if (tableDef) {
        await tx.update(tableDef)
          .set({ syncStatus: 1 }) // 1 = SYNCED
          .where(eq(tableDef.id, item.recordId));
      }
    });
  }

  /**
   * Mark an item as failed, increment retry, calculate next retry time
   */
  static async markFailure(item: QueueItem, errorMessage: string): Promise<void> {
    const newRetryCount = item.retryCount + 1;
    const nextRetryAt = RetryManager.calculateNextRetry(newRetryCount);
    
    await database.update(syncQueue)
      .set({
        retryCount: newRetryCount,
        nextRetryAt: nextRetryAt,
        lastError: errorMessage,
      })
      .where(eq(syncQueue.id, item.id));
  }
}
