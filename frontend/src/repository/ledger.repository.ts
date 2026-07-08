import { BaseRepository } from './base.repository';
import { ledgers, customers } from '../database/schema';
import { Ledger, NewLedger } from '../database/models';
import { database } from '../database';
import { eq, and, sql, like, desc } from 'drizzle-orm';

class LedgerRepository extends BaseRepository<typeof ledgers, NewLedger, Ledger> {
  constructor() {
    super(ledgers, 'ledgers');
  }

  async getActiveLedgers(businessId: string, groupId: string, searchQuery: string = ''): Promise<Ledger[]> {
    let conditions = and(
      eq(ledgers.businessId, businessId),
      eq(customers.groupId, groupId),
      sql`${ledgers.deletedAt} IS NULL`,
      sql`${customers.deletedAt} IS NULL`
    );

    if (searchQuery.trim()) {
      conditions = and(
        conditions,
        like(ledgers.name, `%${searchQuery.trim()}%`)
      );
    }

    const results = await database
      .select({
        id: ledgers.id,
        serverId: ledgers.serverId,
        version: ledgers.version,
        deviceId: ledgers.deviceId,
        updatedBy: ledgers.updatedBy,
        syncStatus: ledgers.syncStatus,
        createdAt: ledgers.createdAt,
        updatedAt: ledgers.updatedAt,
        deletedAt: ledgers.deletedAt,
        businessId: ledgers.businessId,
        customerId: ledgers.customerId,
        name: ledgers.name,
        type: ledgers.type,
      })
      .from(ledgers)
      .innerJoin(customers, eq(ledgers.customerId, customers.id))
      .where(conditions)
      .orderBy(desc(ledgers.createdAt));

    return results as unknown as Ledger[];
  }
}

export const ledgerRepository = new LedgerRepository();
