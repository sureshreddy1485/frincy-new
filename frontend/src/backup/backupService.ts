import { database } from '../database';
import { schemaTables } from '../database/schema';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { strFromU8, strToU8, zlibSync, unzlibSync } from 'fflate';
import CryptoJS from 'crypto-js';

// Hardcoded 32-byte key for local backups. In a production app, this would be derived securely.
const RAW_KEY = CryptoJS.enc.Utf8.parse('frincy-offline-secure-key-123456'); // 32 chars
const RAW_IV = CryptoJS.enc.Utf8.parse('1234567890123456'); // 16 chars

export interface BackupMetadata {
  version: number;
  timestamp: string;
  recordCount: number;
  tables: string[];
}

export interface BackupPayload {
  metadata: BackupMetadata;
  data: Record<string, any[]>;
}

export class BackupService {
  /**
   * Generates a complete backup of the SQLite database
   */
  static async createLocalBackup(): Promise<string> {
    const payload = await this.extractDatabase();
    
    // 1. Serialize to JSON
    const jsonString = JSON.stringify(payload);
    
    // 2. Compress (zlib)
    const compressed = zlibSync(strToU8(jsonString));
    
    // 3. Encrypt (AES-256-CBC via crypto-js)
    // Convert Uint8Array to WordArray for CryptoJS
    const compressedBase64 = this.uint8ArrayToBase64(compressed);
    const encrypted = CryptoJS.AES.encrypt(compressedBase64, RAW_KEY, { iv: RAW_IV }).toString();

    // 4. Save to filesystem
    const filename = `frincy_backup_${Date.now()}.fdb`;
    const path = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(path, encrypted, {
      encoding: FileSystem.EncodingType.UTF8
    });

    return path;
  }

  /**
   * Restores the database from a backup file path
   */
  static async restoreLocalBackup(path: string): Promise<void> {
    // 1. Read file
    const encrypted = await FileSystem.readAsStringAsync(path, {
      encoding: FileSystem.EncodingType.UTF8
    });

    // 2. Decrypt
    const decryptedBytes = CryptoJS.AES.decrypt(encrypted, RAW_KEY, { iv: RAW_IV });
    const compressedBase64 = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!compressedBase64) throw new Error('Invalid or corrupted backup file (Decryption failed)');

    // 3. Decompress
    const compressed = this.base64ToUint8Array(compressedBase64);
    const jsonString = strFromU8(unzlibSync(compressed));

    // 4. Parse JSON
    const payload: BackupPayload = JSON.parse(jsonString);

    if (!payload.metadata || !payload.data) {
      throw new Error('Invalid backup format');
    }

    // 5. Restore Database (Wipe and Insert)
    await this.restoreDatabase(payload);
  }

  /**
   * Shares the backup file via OS share sheet
   */
  static async shareBackup(path: string) {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(path, { mimeType: 'application/octet-stream' });
    }
  }

  // ─── Internal DB Operations ───────────────────────────────────────────────

  private static async extractDatabase(): Promise<BackupPayload> {
    const data: Record<string, any[]> = {};
    const tableNames = Object.keys(schemaTables);
    let recordCount = 0;

    for (const tableName of tableNames) {
      const tableDef = schemaTables[tableName];
      const records = await database.select().from(tableDef);
      data[tableName] = records;
      recordCount += records.length;
    }

    return {
      metadata: {
        version: 2, // Drizzle format
        timestamp: new Date().toISOString(),
        recordCount,
        tables: tableNames
      },
      data
    };
  }

  private static async restoreDatabase(payload: BackupPayload): Promise<void> {
    await database.transaction(async (tx) => {
      const tableNames = Object.keys(schemaTables);
      
      // We process table by table
      for (const tableName of tableNames) {
        const tableDef = schemaTables[tableName];
        
        // 1. Wipe the table completely
        await tx.delete(tableDef);
        
        // 2. Insert records if they exist in the backup
        const records = payload.data[tableName];
        if (records && records.length > 0) {
          // Insert in chunks to avoid SQLite max variable limits
          const CHUNK_SIZE = 50; 
          for (let i = 0; i < records.length; i += CHUNK_SIZE) {
            const chunk = records.slice(i, i + CHUNK_SIZE);
            await tx.insert(tableDef).values(chunk);
          }
        }
      }
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private static uint8ArrayToBase64(bytes: Uint8Array): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let base64 = '';
    let i = 0;
    const len = bytes.byteLength;
    for (i = 0; i < len - 2; i += 3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }
    if (len % 3 === 2) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[(bytes[i + 1] & 15) << 2];
      base64 += '=';
    } else if (len % 3 === 1) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[(bytes[i] & 3) << 4];
      base64 += '==';
    }
    return base64;
  }

  private static base64ToUint8Array(base64: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }
    
    let bufferLength = base64.length * 0.75,
      len = base64.length, i, p = 0,
      encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === '=') bufferLength--;
    if (base64[base64.length - 2] === '=') bufferLength--;

    const bytes = new Uint8Array(bufferLength);

    for (i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      if (encoded3 !== 64) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      if (encoded4 !== 64) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return bytes;
  }
}
