import { prisma } from '../index';
import { Prisma } from '@prisma/client';

export class LedgerRepository {
  async create(data: Prisma.LedgerUncheckedCreateInput) {
    return prisma.ledger.create({ data });
  }

  async findById(id: string, businessId: string) {
    return prisma.ledger.findFirst({
      where: { id, businessId, deletedAt: null },
      include: { customer: true }
    });
  }

  async findAll(businessId: string, updatedAfter?: Date) {
    const whereClause: Prisma.LedgerWhereInput = { businessId };
    
    if (updatedAfter) {
      whereClause.updatedAt = { gt: updatedAfter };
    } else {
      whereClause.deletedAt = null;
    }

    return prisma.ledger.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: { customer: true }
    });
  }

  async update(id: string, businessId: string, data: Prisma.LedgerUncheckedUpdateInput) {
    return prisma.ledger.updateMany({
      where: { id, businessId },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async softDelete(id: string, businessId: string) {
    return prisma.ledger.updateMany({
      where: { id, businessId },
      data: { 
        deletedAt: new Date(),
        version: { increment: 1 }
      },
    });
  }
}
