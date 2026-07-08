export interface SyncMetadata {
  lastPulledAt: number;
}

export interface SyncResponse {
  success: boolean;
  changes: SyncChanges;
  timestamp: number;
}

export interface SyncChanges {
  [tableName: string]: {
    created: any[];
    updated: any[];
    deleted: string[];
  };
}

export interface ConflictResolution {
  resolvedRecord: any;
  strategy: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGED';
}

export interface QueueItem {
  id: string;
  tableName: string;
  recordId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: string | null;
  retryCount: number;
  nextRetryAt: number | null;
  lastError: string | null;
  createdAt: number;
}
