import { database } from '../database';
import { transactions, customers, ledgers, categories, reminders, products, invoices, syncQueue } from '../database/schema';
import { eq, and, sql, desc, gte, lte, inArray, asc } from 'drizzle-orm';
import { SyncStatus } from '../constants/sync.constants';

class DashboardRepository {

  async getFinancialSummary(businessId: string, fromDate: number, toDate: number) {
    // We aggregate income vs expense. Note: transactions belong to ledgers which belong to business.
    // So we must join ledgers.
    const result = await database
      .select({
        income: sql<number>`SUM(CASE WHEN ${transactions.type} IN ('INCOME', 'GOT') THEN ${transactions.amount} ELSE 0 END)`,
        expense: sql<number>`SUM(CASE WHEN ${transactions.type} IN ('EXPENSE', 'GAVE') THEN ${transactions.amount} ELSE 0 END)`,
      })
      .from(transactions)
      .innerJoin(ledgers, eq(transactions.ledgerId, ledgers.id))
      .where(
        and(
          eq(ledgers.businessId, businessId),
          gte(transactions.date, fromDate),
          lte(transactions.date, toDate),
          sql`${transactions.deletedAt} IS NULL`,
          sql`${ledgers.deletedAt} IS NULL`
        )
      );

    const income = result[0]?.income || 0;
    const expense = result[0]?.expense || 0;

    // Customer balances
    const custResult = await database
      .select({
        receivable: sql<number>`SUM(CASE WHEN ${customers.balance} < 0 THEN ABS(${customers.balance}) ELSE 0 END)`,
        payable: sql<number>`SUM(CASE WHEN ${customers.balance} > 0 THEN ${customers.balance} ELSE 0 END)`,
      })
      .from(customers)
      .where(
        and(
          eq(customers.businessId, businessId),
          sql`${customers.deletedAt} IS NULL`
        )
      );

    const receivable = custResult[0]?.receivable || 0;
    const payable = custResult[0]?.payable || 0;

    return {
      income,
      expense,
      profit: income - expense,
      totalBalance: receivable - payable,
      totalReceivable: receivable,
      totalPayable: payable,
    };
  }

  async getCustomerSummary(businessId: string, monthStart: number) {
    const custResult = await database
      .select({
        total: sql<number>`COUNT(*)`,
        withDue: sql<number>`SUM(CASE WHEN ${customers.balance} < 0 THEN 1 ELSE 0 END)`,
        withCredit: sql<number>`SUM(CASE WHEN ${customers.balance} > 0 THEN 1 ELSE 0 END)`,
        newThisMonth: sql<number>`SUM(CASE WHEN ${customers.createdAt} >= ${monthStart} THEN 1 ELSE 0 END)`,
      })
      .from(customers)
      .where(
        and(
          eq(customers.businessId, businessId),
          sql`${customers.deletedAt} IS NULL`
        )
      );

    return {
      total: custResult[0]?.total || 0,
      withDue: custResult[0]?.withDue || 0,
      withCredit: custResult[0]?.withCredit || 0,
      newThisMonth: custResult[0]?.newThisMonth || 0,
    };
  }

  async getLedgerSummary(businessId: string) {
    const ledgersResult = await database
      .select({ total: sql<number>`COUNT(*)` })
      .from(ledgers)
      .where(and(eq(ledgers.businessId, businessId), sql`${ledgers.deletedAt} IS NULL`));

    const txResult = await database
      .select({
        totalTransactions: sql<number>`COUNT(*)`,
        totalAmount: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .innerJoin(ledgers, eq(transactions.ledgerId, ledgers.id))
      .where(and(eq(ledgers.businessId, businessId), sql`${transactions.deletedAt} IS NULL`, sql`${ledgers.deletedAt} IS NULL`));

    const count = txResult[0]?.totalTransactions || 0;
    const totalAmount = txResult[0]?.totalAmount || 0;

    return {
      total: ledgersResult[0]?.total || 0,
      totalTransactions: count,
      avgTransactionValue: count > 0 ? totalAmount / count : 0,
    };
  }

  async getDailyCashFlow(businessId: string, fromDate: number, toDate: number) {
    // SQLite doesn't have a direct DATE() formatter from Unix Epochs out of the box in all environments,
    // so we fetch the raw data and aggregate locally, OR we can format it in SQLite if we use datetime() function.
    // Drizzle integer timestamps are unix epoch SECONDS or MILLISECONDS. Since we used milliseconds previously,
    // let's fetch raw for this date range and aggregate. It's safe since date ranges are bounded.
    const rawTx = await database
      .select({
        amount: transactions.amount,
        type: transactions.type,
        date: transactions.date
      })
      .from(transactions)
      .innerJoin(ledgers, eq(transactions.ledgerId, ledgers.id))
      .where(
        and(
          eq(ledgers.businessId, businessId),
          gte(transactions.date, fromDate),
          lte(transactions.date, toDate),
          sql`${transactions.deletedAt} IS NULL`,
          sql`${ledgers.deletedAt} IS NULL`
        )
      );

    return rawTx;
  }

  async getCategoryStats(businessId: string, fromDate: number, toDate: number) {
    const result = await database
      .select({
        categoryId: categories.id,
        name: categories.name,
        amount: sql<number>`SUM(${transactions.amount})`,
        count: sql<number>`COUNT(${transactions.id})`
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .innerJoin(ledgers, eq(transactions.ledgerId, ledgers.id))
      .where(
        and(
          eq(ledgers.businessId, businessId),
          gte(transactions.date, fromDate),
          lte(transactions.date, toDate),
          sql`${transactions.deletedAt} IS NULL`,
          sql`${categories.deletedAt} IS NULL`
        )
      )
      .groupBy(categories.id)
      .orderBy(desc(sql`SUM(${transactions.amount})`));

    return result;
  }

  async getTopCustomers(businessId: string, limit: number) {
    return database
      .select({
        customerId: customers.id,
        name: customers.name,
        balance: customers.balance
      })
      .from(customers)
      .where(and(eq(customers.businessId, businessId), sql`${customers.deletedAt} IS NULL`))
      .orderBy(desc(sql`ABS(${customers.balance})`))
      .limit(limit);
  }

  async getRecentTransactions(businessId: string, limit: number) {
    return database
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        date: transactions.date,
        note: transactions.note
      })
      .from(transactions)
      .innerJoin(ledgers, eq(transactions.ledgerId, ledgers.id))
      .where(and(eq(ledgers.businessId, businessId), sql`${transactions.deletedAt} IS NULL`))
      .orderBy(desc(transactions.date))
      .limit(limit);
  }

  async getUpcomingReminders(businessId: string, limit: number, now: number) {
    return database
      .select({
        id: reminders.id,
        title: reminders.title,
        dueDate: reminders.dueDate,
        status: reminders.status,
        relatedId: reminders.relatedId
      })
      .from(reminders)
      .where(
        and(
          eq(reminders.businessId, businessId),
          eq(reminders.status, 'PENDING'),
          gte(reminders.dueDate, now),
          sql`${reminders.deletedAt} IS NULL`
        )
      )
      .orderBy(asc(reminders.dueDate))
      .limit(limit);
  }

  // New Metrics
  async getProductsSummary(businessId: string) {
    const result = await database
      .select({
        total: sql<number>`COUNT(*)`,
        lowStock: sql<number>`SUM(CASE WHEN ${products.quantity} <= 5 THEN 1 ELSE 0 END)`
      })
      .from(products)
      .where(and(eq(products.businessId, businessId), sql`${products.deletedAt} IS NULL`));
    
    return {
      total: result[0]?.total || 0,
      lowStock: result[0]?.lowStock || 0,
    };
  }

  async getPendingSyncCount() {
    const result = await database
      .select({ count: sql<number>`COUNT(*)` })
      .from(syncQueue);
    return result[0]?.count || 0;
  }
}

export const dashboardRepository = new DashboardRepository();
