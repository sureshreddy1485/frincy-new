import { TransactionRepository } from '../repositories/transaction.repository';
import { Prisma, TransactionType } from '@prisma/client';

export class TransactionService {
  private repository: TransactionRepository;

  constructor() {
    this.repository = new TransactionRepository();
  }

  async createTransaction(data: Omit<Prisma.TransactionUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'version'>, tags?: string[]) {
    return this.repository.create(data, tags);
  }

  async getTransaction(id: string, ledgerId: string) {
    const transaction = await this.repository.findById(id, ledgerId);
    if (!transaction) throw Object.assign(new Error('Transaction not found'), { statusCode: 404 });
    return transaction;
  }

  async getTransactions(ledgerId: string, filters: { startDate?: string, endDate?: string, type?: TransactionType }, lastSyncAt?: string) {
    const updatedAfter = lastSyncAt ? new Date(lastSyncAt) : undefined;
    
    const parsedFilters = {
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      type: filters.type
    };

    return this.repository.findAll(ledgerId, parsedFilters, updatedAfter);
  }

  async updateTransaction(id: string, ledgerId: string, data: Prisma.TransactionUncheckedUpdateInput, tags?: string[]) {
    const result = await this.repository.update(id, ledgerId, data, tags);
    if (result.count === 0) {
      throw Object.assign(new Error('Transaction not found or not authorized'), { statusCode: 404 });
    }
    return this.repository.findById(id, ledgerId);
  }

  async deleteTransaction(id: string, ledgerId: string) {
    const result = await this.repository.softDelete(id, ledgerId);
    if (result.count === 0) {
      throw Object.assign(new Error('Transaction not found or not authorized'), { statusCode: 404 });
    }
    return { success: true, id };
  }
}
