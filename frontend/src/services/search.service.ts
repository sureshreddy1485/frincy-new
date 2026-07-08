import { database } from '../database';
import { customers, ledgers, transactions } from '../database/schema';
import { eq, or, and, like, inArray, sql } from 'drizzle-orm';
import { Customer, Ledger, Transaction } from '../database/models';

export interface SearchResult {
  customers: Customer[];
  ledgers: Ledger[];
  transactions: Transaction[];
}

export class SearchService {
  static async globalSearch(query: string, businessId: string): Promise<SearchResult> {
    if (!query.trim() || !businessId) {
      return { customers: [], ledgers: [], transactions: [] };
    }

    const sanitizedQuery = query.toLowerCase().trim();
    const searchPattern = `%${sanitizedQuery}%`;
    const numericQuery = isNaN(Number(sanitizedQuery)) ? null : Number(sanitizedQuery);

    // 1. Search Customers
    const customerResults = await database
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.businessId, businessId),
          sql`${customers.deletedAt} IS NULL`,
          or(
            like(customers.name, searchPattern),
            like(customers.phone, searchPattern),
            like(customers.email, searchPattern)
          )
        )
      )
      .limit(20);

    // 2. Search Ledgers
    const ledgerResults = await database
      .select()
      .from(ledgers)
      .where(
        and(
          eq(ledgers.businessId, businessId),
          sql`${ledgers.deletedAt} IS NULL`,
          like(ledgers.name, searchPattern)
        )
      )
      .limit(20);

    // 3. To search transactions, we need to know the valid ledgers for this business
    // since transactions belong to a ledger, not directly to a business in this schema
    const businessLedgers = await database
      .select({ id: ledgers.id })
      .from(ledgers)
      .where(and(eq(ledgers.businessId, businessId), sql`${ledgers.deletedAt} IS NULL`));
      
    const businessLedgerIds = businessLedgers.map((l) => l.id);

    let transactionResults: any[] = [];

    if (businessLedgerIds.length > 0) {
      const transactionConditions = [
        like(transactions.note, searchPattern)
      ];
      
      if (numericQuery !== null) {
        transactionConditions.push(eq(transactions.amount, numericQuery));
      }

      transactionResults = await database
        .select()
        .from(transactions)
        .where(
          and(
            inArray(transactions.ledgerId, businessLedgerIds),
            sql`${transactions.deletedAt} IS NULL`,
            or(...transactionConditions)
          )
        )
        .limit(30);
    }

    return {
      customers: customerResults as unknown as Customer[],
      ledgers: ledgerResults as unknown as Ledger[],
      transactions: transactionResults as unknown as Transaction[]
    };
  }
}
