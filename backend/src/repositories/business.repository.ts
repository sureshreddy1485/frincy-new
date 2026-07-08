import { prisma } from '../index';
import { Prisma } from '@prisma/client';

export class BusinessRepository {
  async create(ownerId: string, data: Omit<Prisma.BusinessCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt'>) {
    return prisma.$transaction(async (tx) => {
      const business = await tx.business.create({ data });
      
      // Automatically make creator the OWNER
      await tx.businessMember.create({
        data: {
          userId: ownerId,
          businessId: business.id,
          role: 'OWNER'
        }
      });
      
      return business;
    });
  }

  async findById(id: string) {
    return prisma.business.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async findAllForUser(userId: string, updatedAfter?: Date) {
    const whereClause: any = {
      members: { some: { userId, deletedAt: null } }
    };
    
    if (updatedAfter) {
      whereClause.updatedAt = { gt: updatedAfter };
    } else {
      whereClause.deletedAt = null;
    }

    return prisma.business.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });
  }

  async update(id: string, data: Prisma.BusinessUpdateInput) {
    return prisma.business.updateMany({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async softDelete(id: string) {
    return prisma.business.updateMany({
      where: { id },
      data: { 
        deletedAt: new Date(),
        version: { increment: 1 }
      },
    });
  }
}
