import { prisma } from '../index';
import { Role } from '@prisma/client';

export class MemberRepository {
  async inviteMember(businessId: string, userId: string, role: Role) {
    return prisma.businessMember.upsert({
      where: {
        userId_businessId: { userId, businessId }
      },
      update: {
        role,
        deletedAt: null, // Reactivate if previously removed
        version: { increment: 1 }
      },
      create: {
        userId,
        businessId,
        role
      }
    });
  }

  async findMembers(businessId: string, updatedAfter?: Date) {
    const whereClause: any = { businessId };
    
    if (updatedAfter) {
      whereClause.updatedAt = { gt: updatedAfter };
    } else {
      whereClause.deletedAt = null;
    }

    return prisma.businessMember.findMany({
      where: whereClause,
      include: { user: { select: { id: true, name: true, email: true } } }
    });
  }

  async updateRole(businessId: string, userId: string, role: Role) {
    return prisma.businessMember.update({
      where: { userId_businessId: { userId, businessId } },
      data: { 
        role,
        version: { increment: 1 }
      }
    });
  }

  async removeMember(businessId: string, userId: string) {
    return prisma.businessMember.update({
      where: { userId_businessId: { userId, businessId } },
      data: { 
        deletedAt: new Date(),
        version: { increment: 1 }
      }
    });
  }
}
