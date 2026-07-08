import { useSyncStore } from '../store/syncStore';
import { useBusinessStore } from '../store/businessStore';
import { UploadProcessor } from './upload.processor';
import { DownloadProcessor } from './download.processor';

export class SyncService {
  /**
   * Main synchronization orchestrator
   */
  static async runSync(options?: { forceFullSync?: boolean }): Promise<void> {
    const syncStore = useSyncStore.getState();

    // Guard: never run two syncs concurrently
    if (syncStore.status === 'Syncing') return;
    if (!syncStore.isOnline) return;

    const startTime = Date.now();
    syncStore.setStatus('Syncing');
    syncStore.addLog({ timestamp: startTime, event: 'SYNC_STARTED', message: 'Synchronization started' });

    const activeBusinessId = useBusinessStore.getState().activeBusinessId;

    try {
      // 1. Push local changes first
      await UploadProcessor.pushPendingChanges(syncStore.lastSyncedAt ?? 0);

      // 2. Pull server changes
      const newTimestamp = await DownloadProcessor.pullChanges(
        activeBusinessId,
        syncStore.lastSyncedAt ?? 0,
        options?.forceFullSync
      );

      // 3. Complete
      const now = Date.now();
      const duration = now - startTime;

      await syncStore.setLastSyncedAt(newTimestamp);
      syncStore.setStatus('Synced');
      syncStore.setPendingCount(0);
      syncStore.setFailedCount(0);

      syncStore.addLog({
        timestamp: now,
        event: 'SYNC_COMPLETED',
        message: 'Synchronization completed successfully',
        durationMs: duration,
      });
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const message = error?.message ?? 'Unknown sync error';

      syncStore.setStatus('Sync Failed');
      syncStore.setFailedCount(syncStore.failedCount + 1);

      syncStore.addLog({
        timestamp: Date.now(),
        event: 'SYNC_FAILED',
        message: `Sync failed: ${message}`,
        durationMs: duration,
      });

      throw error; // Re-throw for retry handler
    }
  }

  /**
   * Initial sync for a newly loaded business
   */
  static async runInitialSync(businessId: string): Promise<void> {
    const syncStore = useSyncStore.getState();
    syncStore.addLog({
      timestamp: Date.now(),
      event: 'SYNC_STARTED',
      message: `Initial sync started for business ${businessId}`,
    });

    try {
      const newTimestamp = await DownloadProcessor.pullChanges(businessId, 0, true);
      
      await syncStore.setLastSyncedAt(newTimestamp);
      syncStore.addLog({
        timestamp: Date.now(),
        event: 'SYNC_COMPLETED',
        message: 'Initial sync completed',
      });
    } catch (error: any) {
      syncStore.addLog({
        timestamp: Date.now(),
        event: 'SYNC_FAILED',
        message: `Initial sync failed: ${error.message}`,
      });
      throw error;
    }
  }
}
