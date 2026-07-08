import { BusinessRepository } from '../repositories/business.repository';
import { Prisma } from '@prisma/client';

export class BusinessService {
  private repository: BusinessRepository;

  constructor() {
    this.repository = new BusinessRepository();
  }

  async createBusiness(ownerId: string, data: { name: string, currency: string, logoUrl?: string }) {
    return this.repository.create(ownerId, data);
  }

  async getBusiness(id: string) {
    const business = await this.repository.findById(id);
    if (!business) throw Object.assign(new Error('Business not found'), { statusCode: 404 });
    return business;
  }

  async getBusinessesForUser(userId: string, lastSyncAt?: string) {
    const updatedAfter = lastSyncAt ? new Date(lastSyncAt) : undefined;
    return this.repository.findAllForUser(userId, updatedAfter);
  }

  async updateBusiness(id: string, data: Prisma.BusinessUpdateInput) {
    const result = await this.repository.update(id, data);
    if (result.count === 0) throw Object.assign(new Error('Business not found'), { statusCode: 404 });
    return this.repository.findById(id);
  }

  async deleteBusiness(id: string) {
    const result = await this.repository.softDelete(id);
    if (result.count === 0) throw Object.assign(new Error('Business not found'), { statusCode: 404 });
    return { success: true, id };
  }
}
