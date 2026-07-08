import { prisma } from '../index';
import { Prisma, TransactionType } from '@prisma/client';

export class TransactionRepository {
  async create(data: Prisma.TransactionUncheckedCreateInput, tagIds?: string[]) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({ data });

      if (tagIds && tagIds.length > 0) {
        const tagMappings = tagIds.map(tagId => ({
          transactionId: transaction.id,
          tagId
        }));
        await tx.transactionTag.createMany({ data: tagMappings });
      }

      return transaction;
    });
  }

  async findById(id: string, ledgerId: string) {
    return prisma.transaction.findFirst({
      where: { id, ledgerId, deletedAt: null },
      include: { category: true, tags: { include: { tag: true } } }
    });
  }

  async findAll(ledgerId: string, filters: { startDate?: Date, endDate?: Date, type?: TransactionType }, updatedAfter?: Date) {
    const whereClause: Prisma.TransactionWhereInput = { ledgerId };
    
    if (updatedAfter) {
      whereClause.updatedAt = { gt: updatedAfter };
    } else {
      whereClause.deletedAt = null;
    }

    if (filters.type) whereClause.type = filters.type;
    if (filters.startDate || filters.endDate) {
      whereClause.date = {};
      if (filters.startDate) whereClause.date.gte = filters.startDate;
      if (filters.endDate) whereClause.date.lte = filters.endDate;
    }

    return prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: { category: true, tags: { include: { tag: true } } }
    });
  }

  async update(id: string, ledgerId: string, data: Prisma.TransactionUncheckedUpdateInput, tagIds?: string[]) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.transaction.updateMany({
        where: { id, ledgerId },
        data: {
          ...data,
          version: { increment: 1 },
        },
      });

      if (tagIds !== undefined) {
        await tx.transactionTag.deleteMany({ where: { transactionId: id } });
        if (tagIds.length > 0) {
          const tagMappings = tagIds.map(tagId => ({
            transactionId: id,
            tagId
          }));
          await tx.transactionTag.createMany({ data: tagMappings });
        }
      }

      return result;
    });
  }

  async softDelete(id: string, ledgerId: string) {
    return prisma.transaction.updateMany({
      where: { id, ledgerId },
      data: { 
        deletedAt: new Date(),
        version: { increment: 1 }
      },
    });
  }
}
