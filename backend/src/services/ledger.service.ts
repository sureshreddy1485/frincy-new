import { LedgerRepository } from '../repositories/ledger.repository';
import { Prisma } from '@prisma/client';

export class LedgerService {
  private repository: LedgerRepository;

  constructor() {
    this.repository = new LedgerRepository();
  }

  async createLedger(data: Prisma.LedgerUncheckedCreateInput) {
    return this.repository.create(data);
  }

  async getLedger(id: string, businessId: string) {
    const ledger = await this.repository.findById(id, businessId);
    if (!ledger) throw Object.assign(new Error('Ledger not found'), { statusCode: 404 });
    return ledger;
  }

  async getLedgers(businessId: string, lastSyncAt?: string) {
    const updatedAfter = lastSyncAt ? new Date(lastSyncAt) : undefined;
    return this.repository.findAll(businessId, updatedAfter);
  }

  async updateLedger(id: string, businessId: string, data: Prisma.LedgerUncheckedUpdateInput) {
    const result = await this.repository.update(id, businessId, data);
    if (result.count === 0) {
      throw Object.assign(new Error('Ledger not found or not authorized'), { statusCode: 404 });
    }
    return this.repository.findById(id, businessId);
  }

  async deleteLedger(id: string, businessId: string) {
    const result = await this.repository.softDelete(id, businessId);
    if (result.count === 0) {
      throw Object.assign(new Error('Ledger not found or not authorized'), { statusCode: 404 });
    }
    return { success: true, id };
  }
}
