import { prisma } from '../index';
import { Prisma } from '@prisma/client';

export class CustomerRepository {
  async create(data: Prisma.CustomerUncheckedCreateInput) {
    return prisma.customer.create({ data });
  }

  async findById(id: string, businessId: string) {
    return prisma.customer.findFirst({
      where: { id, businessId, deletedAt: null },
    });
  }

  async findAll(businessId: string, updatedAfter?: Date) {
    const whereClause: Prisma.CustomerWhereInput = { businessId };
    
    // Support for Sync Engine (Only return records updated after timestamp, including soft deletes)
    if (updatedAfter) {
      whereClause.updatedAt = { gt: updatedAfter };
    } else {
      whereClause.deletedAt = null; // Normal REST fetch only wants active records
    }

    return prisma.customer.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, businessId: string, data: Prisma.CustomerUncheckedUpdateInput) {
    return prisma.customer.updateMany({
      where: { id, businessId },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async softDelete(id: string, businessId: string) {
    return prisma.customer.updateMany({
      where: { id, businessId },
      data: { 
        deletedAt: new Date(),
        version: { increment: 1 }
      },
    });
  }
}
