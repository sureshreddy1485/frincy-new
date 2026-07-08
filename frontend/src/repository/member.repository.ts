import { BaseRepository } from './base.repository';
import { businessMembers } from '../database/schema';
import { BusinessMember, NewBusinessMember } from '../database/models';
import { database } from '../database';
import { eq, and, sql } from 'drizzle-orm';

class MemberRepository extends BaseRepository<typeof businessMembers, NewBusinessMember, BusinessMember> {
  constructor() {
    super(businessMembers, 'business_members');
  }

  async getMembersByBusiness(businessId: string): Promise<BusinessMember[]> {
    const results = await database
      .select()
      .from(businessMembers)
      .where(
        and(
          eq(businessMembers.businessId, businessId),
          sql`${businessMembers.deletedAt} IS NULL`
        )
      );

    return results as unknown as BusinessMember[];
  }
}

export const memberRepository = new MemberRepository();
