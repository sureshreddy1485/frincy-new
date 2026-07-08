import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type SyncStatus =
  | 'Offline'
  | 'Synced'
  | 'Syncing'
  | 'Pending Changes'
  | 'Sync Failed';

export interface SyncLogEntry {
  id: string;
  timestamp: number;
  event:
    | 'SYNC_STARTED'
    | 'SYNC_COMPLETED'
    | 'SYNC_FAILED'
    | 'CONFLICT_DETECTED'
    | 'RETRY_ATTEMPTED'
    | 'PUSH_COMPLETED'
    | 'PULL_COMPLETED';
  message: string;
  durationMs?: number;
  records?: { uploaded?: number; downloaded?: number; conflicts?: number };
}

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  pendingCount: number;
  failedCount: number;
  logs: SyncLogEntry[];
  isOnline: boolean;

  // Actions
  setStatus: (status: SyncStatus) => void;
  setOnline: (online: boolean) => void;
  setLastSyncedAt: (timestamp: number) => Promise<void>;
  setPendingCount: (count: number) => void;
  setFailedCount: (count: number) => void;
  addLog: (entry: Omit<SyncLogEntry, 'id'>) => void;
  clearLogs: () => void;
  loadLastSyncedAt: () => Promise<void>;
  reset: () => void;
}

const MAX_LOG_ENTRIES = 100;

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'Synced',
  lastSyncedAt: null,
  pendingCount: 0,
  failedCount: 0,
  logs: [],
  isOnline: true,

  setStatus: (status) => set({ status }),

  setOnline: (online) => {
    set({ isOnline: online });
    if (!online) {
      set({ status: 'Offline' });
    } else if (get().status === 'Offline') {
      // Back online — surface pending state if needed
      const pending = get().pendingCount;
      set({ status: pending > 0 ? 'Pending Changes' : 'Synced' });
    }
  },

  setLastSyncedAt: async (timestamp) => {
    await SecureStore.setItemAsync('frincy_last_synced_at', timestamp.toString());
    set({ lastSyncedAt: timestamp });
  },

  setPendingCount: (count) => {
    set({ pendingCount: count });
    const current = get().status;
    if (count > 0 && current !== 'Syncing' && current !== 'Offline') {
      set({ status: 'Pending Changes' });
    }
  },

  setFailedCount: (count) => set({ failedCount: count }),

  addLog: (entry) => {
    const newLog: SyncLogEntry = { ...entry, id: `${Date.now()}-${Math.random()}` };
    set((state) => ({
      logs: [newLog, ...state.logs].slice(0, MAX_LOG_ENTRIES),
    }));
  },

  clearLogs: () => set({ logs: [] }),

  loadLastSyncedAt: async () => {
    const val = await SecureStore.getItemAsync('frincy_last_synced_at');
    if (val) {
      set({ lastSyncedAt: parseInt(val, 10) });
    }
  },

  reset: () =>
    set({
      status: 'Synced',
      lastSyncedAt: null,
      pendingCount: 0,
      failedCount: 0,
      logs: [],
    }),
}));
