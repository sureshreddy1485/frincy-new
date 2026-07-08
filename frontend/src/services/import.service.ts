import Papa from 'papaparse';
import * as FileSystem from 'expo-file-system';
import { customerRepository } from '../repository/customer.repository';
import { ledgerRepository } from '../repository/ledger.repository';
import { transactionRepository } from '../repository/transaction.repository';

export type ImportType = 'customers' | 'ledgers' | 'transactions';

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: string[];
}

export class ImportService {
  static async importCSV(fileUri: string, type: ImportType, businessId: string): Promise<ImportResult> {
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      
      return new Promise((resolve) => {
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: async (results: any) => {
            const data = results.data as any[];
            const result = await this.processImportData(data, type, businessId);
            resolve(result);
          },
          error: (error: any) => {
            resolve({ success: false, importedCount: 0, errors: [error.message] });
          }
        });
      });
    } catch (error: any) {
      return { success: false, importedCount: 0, errors: [error.message] };
    }
  }

  static async importJSON(fileUri: string, type: ImportType, businessId: string): Promise<ImportResult> {
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const data = JSON.parse(fileContent);
      
      if (!Array.isArray(data)) {
        return { success: false, importedCount: 0, errors: ['JSON file must contain an array of objects'] };
      }

      return await this.processImportData(data, type, businessId);
    } catch (error: any) {
      return { success: false, importedCount: 0, errors: [error.message] };
    }
  }

  private static async processImportData(data: any[], type: ImportType, businessId: string): Promise<ImportResult> {
    const errors: string[] = [];
    let importedCount = 0;

    for (const row of data) {
      try {
        if (type === 'customers') {
          await customerRepository.create({
            businessId,
            name: row.name || 'Unknown',
            phone: row.phone || '',
            email: row.email || '',
            address: row.address || '',
            balance: Number(row.balance) || 0,
          });
        } else if (type === 'ledgers') {
          await ledgerRepository.create({
            businessId,
            name: row.name || 'Imported Ledger',
            type: row.type || 'general',
          });
        } else if (type === 'transactions') {
          if (!row.ledgerId) {
            throw new Error('ledgerId is required for transactions');
          }
          await transactionRepository.create({
            ledgerId: row.ledgerId,
            amount: Number(row.amount) || 0,
            type: row.type || 'expense',
            date: row.date ? Math.floor(new Date(row.date).getTime() / 1000) : Math.floor(Date.now() / 1000),
            note: row.note || 'Imported',
          });
        }
        importedCount++;
      } catch (err: any) {
        errors.push(`Row error: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      importedCount,
      errors
    };
  }
}
