import { BaseRepository } from './base.repository';
import { transactions, ledgers, customers } from '../database/schema';
import { Transaction, NewTransaction } from '../database/models';
import { database } from '../database';
import { eq, and, sql, desc } from 'drizzle-orm';

export class TransactionRepository extends BaseRepository<typeof transactions, NewTransaction, Transaction> {
  constructor() {
    super(transactions, 'transactions');
  }

  async getTransactions(businessId: string, groupId: string, ledgerId: string, typeFilter?: string): Promise<Transaction[]> {
    let conditions = and(
      eq(transactions.ledgerId, ledgerId),
      eq(ledgers.businessId, businessId),
      eq(customers.groupId, groupId),
      sql`${transactions.deletedAt} IS NULL`,
      sql`${ledgers.deletedAt} IS NULL`,
      sql`${customers.deletedAt} IS NULL`
    );

    if (typeFilter) {
      conditions = and(conditions, eq(transactions.type, typeFilter));
    }

    const results = await database
      .select({
        id: transactions.id,
        serverId: transactions.serverId,
        version: transactions.version,
        deviceId: transactions.deviceId,
        updatedBy: transactions.updatedBy,
        syncStatus: transactions.syncStatus,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        deletedAt: transactions.deletedAt,
        ledgerId: transactions.ledgerId,
        categoryId: transactions.categoryId,
        customerId: transactions.customerId,
        amount: transactions.amount,
        type: transactions.type,
        date: transactions.date,
        note: transactions.note
      })
      .from(transactions)
      .innerJoin(ledgers, eq(transactions.ledgerId, ledgers.id))
      .innerJoin(customers, eq(ledgers.customerId, customers.id))
      .where(conditions)
      .orderBy(desc(transactions.date));

    return results as unknown as Transaction[];
  }

  async calculateRunningBalance(businessId: string, groupId: string, ledgerId: string): Promise<number> {
    const results = await database
      .select({
        total: sql<number>`SUM(CASE 
          WHEN ${transactions.type} IN ('INCOME', 'GOT') THEN ${transactions.amount} 
          WHEN ${transactions.type} IN ('EXPENSE', 'GAVE') THEN -${transactions.amount} 
          ELSE 0 END)`
      })
      .from(transactions)
      .innerJoin(ledgers, eq(transactions.ledgerId, ledgers.id))
      .innerJoin(customers, eq(ledgers.customerId, customers.id))
      .where(and(
        eq(transactions.ledgerId, ledgerId),
        eq(ledgers.businessId, businessId),
        eq(customers.groupId, groupId),
        sql`${transactions.deletedAt} IS NULL`,
        sql`${ledgers.deletedAt} IS NULL`,
        sql`${customers.deletedAt} IS NULL`
      ));

    return results[0]?.total || 0;
  }
}

export const transactionRepository = new TransactionRepository();
