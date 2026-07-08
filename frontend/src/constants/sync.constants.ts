export enum SyncStatus {
  PENDING = 0,
  SYNCING = 1,
  SYNCED = 2,
  FAILED = 3,
}

export enum SyncOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
