import { apiClient } from '../api/client';
import { QueueProcessor } from './queue.processor';
import { SyncChanges } from './sync.types';
import { useSyncStore } from '../store/syncStore';

export class UploadProcessor {
  /**
   * Reads pending queue items, builds a SyncChanges object, and pushes to server
   */
  static async pushPendingChanges(lastPulledAt: number): Promise<void> {
    const pendingItems = await QueueProcessor.getPendingItems();
    if (pendingItems.length === 0) return;

    const changes: SyncChanges = {};

    // Build changes payload
    for (const item of pendingItems) {
      if (!changes[item.tableName]) {
        changes[item.tableName] = { created: [], updated: [], deleted: [] };
      }

      const tableChanges = changes[item.tableName];
      
      if (item.operation === 'DELETE') {
        tableChanges.deleted.push(item.recordId);
      } else {
        const payload = item.payload ? JSON.parse(item.payload) : null;
        if (payload) {
          if (item.operation === 'CREATE') {
            tableChanges.created.push(payload);
          } else if (item.operation === 'UPDATE') {
            tableChanges.updated.push(payload);
          }
        }
      }
    }

    try {
      // Send to server
      const response = await apiClient.post('/sync/push', {
        changes,
        lastPulledAt,
      });

      const { uploaded = 0, conflicts = 0 } = response.data;

      // Mark success
      for (const item of pendingItems) {
        await QueueProcessor.markSuccess(item);
      }

      useSyncStore.getState().addLog({
        timestamp: Date.now(),
        event: 'PUSH_COMPLETED',
        message: `Pushed ${pendingItems.length} changes (${uploaded} processed, ${conflicts} conflicts)`,
        records: { uploaded, conflicts },
      });
      
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ?? error?.message ?? 'Upload failed';
      
      // Mark failure for retry backoff
      for (const item of pendingItems) {
        await QueueProcessor.markFailure(item, errorMessage);
      }

      throw error;
    }
  }
}
