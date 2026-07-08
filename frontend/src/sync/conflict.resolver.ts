import { ConflictResolution } from './sync.types';

export class ConflictResolver {
  /**
   * Resolves a conflict between a local record and a server record.
   * Default strategy: Last Write Wins based on 'updatedAt' timestamp, 
   * falling back to 'version' comparison.
   */
  static resolve(localRecord: any, serverRecord: any): ConflictResolution {
    // If no local record exists, server naturally wins
    if (!localRecord) {
      return { resolvedRecord: serverRecord, strategy: 'SERVER_WINS' };
    }

    // Version-based conflict resolution
    if (serverRecord.version > localRecord.version) {
      return { resolvedRecord: serverRecord, strategy: 'SERVER_WINS' };
    }
    
    if (localRecord.version > serverRecord.version) {
      return { resolvedRecord: localRecord, strategy: 'LOCAL_WINS' };
    }

    // Fallback to timestamp Last Write Wins
    if (serverRecord.updatedAt >= localRecord.updatedAt) {
      return { resolvedRecord: serverRecord, strategy: 'SERVER_WINS' };
    }

    return { resolvedRecord: localRecord, strategy: 'LOCAL_WINS' };
  }
}
