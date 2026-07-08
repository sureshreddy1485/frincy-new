import { BaseRepository } from './base.repository';
import { customerGroups } from '../database/schema';
import { CustomerGroup, NewCustomerGroup } from '../database/models';
import { database } from '../database';
import { eq, and, sql, asc } from 'drizzle-orm';

export class CustomerGroupRepository extends BaseRepository<typeof customerGroups, NewCustomerGroup, CustomerGroup> {
  constructor() {
    super(customerGroups, 'customer_groups');
  }

  async getGroups(businessId: string): Promise<CustomerGroup[]> {
    const results = await database
      .select()
      .from(customerGroups)
      .where(
        and(
          eq(customerGroups.businessId, businessId),
          sql`${customerGroups.deletedAt} IS NULL`
        )
      )
      .orderBy(asc(customerGroups.name));
      
    return results as unknown as CustomerGroup[];
  }

  async getOrCreateUncategorized(businessId: string): Promise<CustomerGroup> {
    const existing = await database
      .select()
      .from(customerGroups)
      .where(
        and(
          eq(customerGroups.businessId, businessId),
          eq(customerGroups.name, 'Uncategorized'),
          sql`${customerGroups.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0] as unknown as CustomerGroup;
    }

    return this.create({
      businessId,
      name: 'Uncategorized',
      description: 'Default folder for uncategorized customers'
    });
  }
}

export const customerGroupRepository = new CustomerGroupRepository();
