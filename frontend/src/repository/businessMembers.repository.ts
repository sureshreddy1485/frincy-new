import { BaseRepository } from './base.repository';
import { businessMembers } from '../database/schema';
import { BusinessMember, NewBusinessMember } from '../database/models';
import { database } from '../database';
import { eq, and, sql } from 'drizzle-orm';

class BusinessMemberRepository extends BaseRepository<typeof businessMembers, NewBusinessMember, BusinessMember> {
  constructor() {
    super(businessMembers, 'business_members');
  }

  async getMembersByBusiness(businessId: string): Promise<(BusinessMember & { user?: any })[]> {
    const { users } = require('../database/schema');
    const results = await database
      .select({
        member: businessMembers,
        user: users
      })
      .from(businessMembers)
      .leftJoin(users, eq(businessMembers.userId, users.id))
      .where(
        and(
          eq(businessMembers.businessId, businessId),
          sql`${businessMembers.deletedAt} IS NULL`
        )
      );
    
    return results.map(r => ({
      ...r.member,
      user: r.user
    })) as unknown as (BusinessMember & { user?: any })[];
  }
}

export const businessMemberRepository = new BusinessMemberRepository();
