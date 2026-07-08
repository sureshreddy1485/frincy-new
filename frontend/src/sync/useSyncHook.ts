import { useSyncStore } from '../store/syncStore';
import { manualSync, forceFullSync } from './sync.manager';

// ─── useSync ─────────────────────────────────────────────────────────────────

/**
 * Convenience hook for accessing sync state and actions from any component.
 */
export function useSync() {
  const { status, lastSyncedAt, pendingCount, failedCount, logs, isOnline } = useSyncStore();

  const lastSyncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString()
    : 'Never';

  return {
    status,
    isOnline,
    lastSyncedAt,
    lastSyncLabel,
    pendingCount,
    failedCount,
    logs,
    sync: manualSync,
    forceFullSync,
  };
}
