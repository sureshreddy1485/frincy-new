import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { SyncService } from './sync.service';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';

const BACKGROUND_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Retry with Exponential Backoff ─────────────────────────────────────────

let retryCount = 0;
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

async function syncWithRetry(forceFull = false): Promise<void> {
  try {
    await SyncService.runSync({ forceFullSync: forceFull });
    retryCount = 0; // reset on success
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
      retryCount++;

      useSyncStore.getState().addLog({
        timestamp: Date.now(),
        event: 'RETRY_ATTEMPTED',
        message: `Retry attempt ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s`,
      });

      setTimeout(() => syncWithRetry(forceFull), delay);
    } else {
      retryCount = 0; // reset so user can try manually
    }
  }
}

// ─── Network Monitor ─────────────────────────────────────────────────────────

function startNetworkMonitor(onConnected: () => void): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const online = !!(state.isConnected && state.isInternetReachable);
    useSyncStore.getState().setOnline(online);
    if (online) {
      onConnected();
    }
  });
  return unsubscribe;
}

// ─── App State Monitor ────────────────────────────────────────────────────────

function startAppStateMonitor(onForeground: () => void): () => void {
  const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      onForeground();
    }
  });
  return () => subscription.remove();
}

// ─── SyncManager Hook ─────────────────────────────────────────────────────────
/**
 * Call this once at the root layout. It wires up:
 * - Session restore → load last sync timestamp
 * - Network reconnect → auto sync
 * - App foreground → auto sync
 * - Periodic background sync
 */
export function useSyncManager() {
  const { user } = useAuthStore();
  const { loadLastSyncedAt } = useSyncStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadLastSyncedAt();
  }, []);

  useEffect(() => {
    if (!user) {
      // Clear any running interval when logged out
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Initial sync on login / session restore
    NetInfo.fetch().then((state) => {
      const online = !!(state.isConnected && state.isInternetReachable);
      useSyncStore.getState().setOnline(online);
      if (online) {
        syncWithRetry();
      }
    });

    // Re-sync when internet comes back
    const stopNetwork = startNetworkMonitor(() => syncWithRetry());

    // Re-sync when app returns to foreground
    const stopAppState = startAppStateMonitor(() => syncWithRetry());

    // Periodic background sync
    intervalRef.current = setInterval(() => {
      const { isOnline, status } = useSyncStore.getState();
      if (isOnline && status !== 'Syncing') {
        syncWithRetry();
      }
    }, BACKGROUND_SYNC_INTERVAL_MS);

    return () => {
      stopNetwork();
      stopAppState();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);
}

// ─── Manual / Force sync ─────────────────────────────────────────────────────

export const manualSync = () => syncWithRetry(false);
export const forceFullSync = () => syncWithRetry(true);
