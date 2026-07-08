import { BaseRepository } from './base.repository';
import { customers } from '../database/schema';
import { Customer, NewCustomer } from '../database/models';
import { database } from '../database';
import { eq, and, sql, like, desc, asc } from 'drizzle-orm';

export class CustomerRepository extends BaseRepository<typeof customers, NewCustomer, Customer> {
  constructor() {
    super(customers, 'customers');
  }

  async searchActiveCustomers(businessId: string, groupId: string, searchQuery: string = ''): Promise<Customer[]> {
    let conditions = and(
      eq(customers.businessId, businessId),
      eq(customers.groupId, groupId),
      sql`${customers.deletedAt} IS NULL`
    );

    if (searchQuery) {
      conditions = and(
        conditions,
        like(customers.name, `%${searchQuery}%`)
      );
    }

    const results = await database
      .select()
      .from(customers)
      .where(conditions)
      .orderBy(desc(customers.createdAt));
      
    return results as unknown as Customer[];
  }

  async getOverdueCustomers(businessId: string, groupId: string): Promise<Customer[]> {
    const results = await database
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.businessId, businessId),
          eq(customers.groupId, groupId),
          sql`${customers.balance} < 0`,
          sql`${customers.deletedAt} IS NULL`
        )
      )
      .orderBy(asc(customers.balance)); // Most overdue first

    return results as unknown as Customer[];
  }

  async updateBalance(customerId: string, amountChange: number): Promise<void> {
    await database.transaction(async (tx) => {
      const cust = await tx.select().from(customers).where(eq(customers.id, customerId)).limit(1);
      if (cust.length > 0) {
        const newBalance = (cust[0].balance || 0) + amountChange;
        await tx.update(customers)
          .set({ 
            balance: newBalance, 
            syncStatus: 0, 
            updatedAt: Math.floor(Date.now() / 1000) 
          })
          .where(eq(customers.id, customerId));
      }
    });
  }
}

export const customerRepository = new CustomerRepository();
