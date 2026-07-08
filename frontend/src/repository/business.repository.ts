import { BaseRepository } from './base.repository';
import { businesses } from '../database/schema';
import { Business, NewBusiness } from '../database/models';
import { database } from '../database';
import { eq, sql } from 'drizzle-orm';

class BusinessRepository extends BaseRepository<typeof businesses, NewBusiness, Business> {
  constructor() {
    super(businesses, 'businesses');
  }

  async getBusinessById(businessId: string): Promise<Business | null> {
    const results = await database
      .select()
      .from(businesses)
      .where(
        eq(businesses.id, businessId)
      )
      .limit(1);

    return results.length > 0 ? (results[0] as unknown as Business) : null;
  }
}

export const businessRepository = new BusinessRepository();
