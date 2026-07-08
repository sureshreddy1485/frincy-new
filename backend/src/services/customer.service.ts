import { CustomerRepository } from '../repositories/customer.repository';
import { Prisma } from '@prisma/client';

export class CustomerService {
  private repository: CustomerRepository;

  constructor() {
    this.repository = new CustomerRepository();
  }

  async createCustomer(data: Prisma.CustomerUncheckedCreateInput) {
    // Business logic, e.g. checking if business exists can be added here
    return this.repository.create(data);
  }

  async getCustomer(id: string, businessId: string) {
    const customer = await this.repository.findById(id, businessId);
    if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
    return customer;
  }

  async getCustomers(businessId: string, lastSyncAt?: string) {
    const updatedAfter = lastSyncAt ? new Date(lastSyncAt) : undefined;
    return this.repository.findAll(businessId, updatedAfter);
  }

  async updateCustomer(id: string, businessId: string, data: Prisma.CustomerUncheckedUpdateInput) {
    const result = await this.repository.update(id, businessId, data);
    if (result.count === 0) {
      throw Object.assign(new Error('Customer not found or not authorized'), { statusCode: 404 });
    }
    return this.repository.findById(id, businessId);
  }

  async deleteCustomer(id: string, businessId: string) {
    const result = await this.repository.softDelete(id, businessId);
    if (result.count === 0) {
      throw Object.assign(new Error('Customer not found or not authorized'), { statusCode: 404 });
    }
    return { success: true, id };
  }
}
