import { database } from '../database';
import { transactions, customers, ledgers, categories, reminders } from '../database/schema';
import { eq, and, sql, desc, gte, lte, asc, inArray } from 'drizzle-orm';
import {
  DateFilter,
  FinancialSummary,
  CategoryStat,
  TopCustomer,
} from '../services/dashboard.service';
import { dashboardService } from '../services/dashboard.service';

// ─── Shared report types ─────────────────────────────────────────────────────

export interface ReportMeta {
  title: string;
  businessId: string;
  dateFilter: DateFilter;
  generatedAt: Date;
}

export interface TransactionRow {
  id: string;
  date: Date;
  type: string;
  amount: number;
  note: string;
  ledgerName: string;
  categoryName: string;
}

export interface CustomerStatementRow {
  customerId: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
  totalTransactions: number;
  lastActivityDate: Date | null;
}

export interface LedgerStatementRow {
  ledgerId: string;
  name: string;
  type: string;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  transactionCount: number;
}

export interface ProfitLossReport {
  meta: ReportMeta;
  income: number;
  expense: number;
  grossProfit: number;
  netProfit: number;
  incomeByCategory: CategoryStat[];
  expenseByCategory: CategoryStat[];
}

export interface CashFlowReport {
  meta: ReportMeta;
  openingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  closingBalance: number;
  rows: TransactionRow[];
}

export interface CustomerReport {
  meta: ReportMeta;
  summary: {
    total: number;
    withDue: number;
    withCredit: number;
    totalReceivable: number;
    totalPayable: number;
  };
  rows: CustomerStatementRow[];
}

export interface LedgerReport {
  meta: ReportMeta;
  rows: LedgerStatementRow[];
  totals: {
    totalIncome: number;
    totalExpense: number;
  };
}

export interface FinancialReport {
  meta: ReportMeta;
  summary: FinancialSummary;
  transactions: TransactionRow[];
  categoryBreakdown: CategoryStat[];
  topCustomers: TopCustomer[];
}

export interface ReminderReport {
  meta: ReportMeta;
  pending: Array<{ id: string; title: string; dueDate: Date; status: string }>;
  overdue: Array<{ id: string; title: string; dueDate: Date; status: string }>;
}

// ─── Repository ───────────────────────────────────────────────────────────────

class ReportsRepository {
  private dash = dashboardService;

  // ── Helpers ────────────────────────────────────────────────────────────────

  private meta(businessId: string, title: string, filter: DateFilter): ReportMeta {
    return { title, businessId, dateFilter: filter, generatedAt: new Date() };
  }

  private async getFilteredTransactions(
    businessId: string,
    filter: DateFilter,
  ): Promise<{ 
    txns: Array<{ id: string, date: number, type: string, amount: number, note: string | null, ledgerId: string, categoryId: string | null }>; 
    ledgerMap: Record<string, { name: string }>; 
    catMap: Record<string, { name: string }> 
  }> {
    const fromTime = Math.floor(filter.from.getTime() / 1000);
    const toTime = Math.floor(filter.to.getTime() / 1000);

    const rawTxns = await database
      .select({
        id: transactions.id,
        date: transactions.date,
        type: transactions.type,
        amount: transactions.amount,
        note: transactions.note,
        ledgerId: transactions.ledgerId,
        categoryId: transactions.categoryId
      })
      .from(transactions)
      .innerJoin(ledgers, eq(transactions.ledgerId, ledgers.id))
      .where(
        and(
          eq(ledgers.businessId, businessId),
          gte(transactions.date, fromTime),
          lte(transactions.date, toTime),
          sql`${transactions.deletedAt} IS NULL`,
          sql`${ledgers.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(transactions.date));

    // Get Ledger map
    const ledgersList = await database.select({ id: ledgers.id, name: ledgers.name }).from(ledgers).where(eq(ledgers.businessId, businessId));
    const ledgerMap: Record<string, { name: string }> = {};
    for (const l of ledgersList) ledgerMap[l.id] = { name: l.name };

    // Get Category map
    const catsList = await database.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.businessId, businessId));
    const catMap: Record<string, { name: string }> = {};
    for (const c of catsList) catMap[c.id] = { name: c.name };

    return { txns: rawTxns, ledgerMap, catMap };
  }

  private toTransactionRow(
    t: { id: string, date: number, type: string, amount: number, note: string | null, ledgerId: string, categoryId: string | null }, 
    ledgerMap: Record<string, { name: string }>, 
    catMap: Record<string, { name: string }>
  ): TransactionRow {
    return {
      id: t.id,
      date: new Date(t.date * 1000),
      type: t.type,
      amount: t.amount,
      note: t.note ?? '',
      ledgerName: ledgerMap[t.ledgerId]?.name ?? '—',
      categoryName: t.categoryId ? (catMap[t.categoryId]?.name ?? '—') : '—',
    };
  }

  // ── Financial Report ───────────────────────────────────────────────────────

  async getFinancialReport(businessId: string, filter: DateFilter): Promise<FinancialReport> {
    const [summary, categoryBreakdown, topCustomers, { txns, ledgerMap, catMap }] = await Promise.all([
      this.dash.getFinancialSummary(businessId, filter),
      this.dash.getCategoryStats(businessId, filter),
      this.dash.getTopCustomers(businessId, 10),
      this.getFilteredTransactions(businessId, filter),
    ]);

    return {
      meta: this.meta(businessId, 'Financial Report', filter),
      summary,
      transactions: txns.map((t) => this.toTransactionRow(t, ledgerMap, catMap)),
      categoryBreakdown,
      topCustomers,
    };
  }

  // ── Profit & Loss Report ───────────────────────────────────────────────────

  async getProfitLossReport(businessId: string, filter: DateFilter): Promise<ProfitLossReport> {
    const [summary, categoryStats] = await Promise.all([
      this.dash.getFinancialSummary(businessId, filter),
      this.dash.getCategoryStats(businessId, filter),
    ]);

    const { txns } = await this.getFilteredTransactions(businessId, filter);

    const incomeByCategory: CategoryStat[] = [];
    const expenseByCategory: CategoryStat[] = [];

    for (const stat of categoryStats) {
      const sample = txns.find((t) => t.categoryId === stat.categoryId);
      if (sample?.type === 'INCOME' || sample?.type === 'GOT') {
        incomeByCategory.push(stat);
      } else {
        expenseByCategory.push(stat);
      }
    }

    return {
      meta: this.meta(businessId, 'Profit & Loss', filter),
      income: summary.income,
      expense: summary.expense,
      grossProfit: summary.income,
      netProfit: summary.profit,
      incomeByCategory,
      expenseByCategory,
    };
  }

  // ── Cash Flow Report ───────────────────────────────────────────────────────

  async getCashFlowReport(businessId: string, filter: DateFilter): Promise<CashFlowReport> {
    const { txns, ledgerMap, catMap } = await this.getFilteredTransactions(businessId, filter);

    let totalInflows = 0;
    let totalOutflows = 0;

    for (const t of txns) {
      if (t.type === 'INCOME' || t.type === 'GOT') totalInflows += t.amount;
      else totalOutflows += t.amount;
    }

    return {
      meta: this.meta(businessId, 'Cash Flow Statement', filter),
      openingBalance: 0,
      totalInflows,
      totalOutflows,
      closingBalance: totalInflows - totalOutflows,
      rows: txns.map((t) => this.toTransactionRow(t, ledgerMap, catMap)),
    };
  }

  // ── Customer Report ────────────────────────────────────────────────────────

  async getCustomerReport(businessId: string, filter: DateFilter): Promise<CustomerReport> {
    const fromTime = Math.floor(filter.from.getTime() / 1000);
    const toTime = Math.floor(filter.to.getTime() / 1000);

    const customersList = await database.select().from(customers).where(and(eq(customers.businessId, businessId), sql`${customers.deletedAt} IS NULL`));

    // Get all transactions for these customers within date range
    const txns = await database
      .select({
        customerId: transactions.customerId,
        date: transactions.date,
      })
      .from(transactions)
      .innerJoin(ledgers, eq(transactions.ledgerId, ledgers.id))
      .where(
        and(
          eq(ledgers.businessId, businessId),
          gte(transactions.date, fromTime),
          lte(transactions.date, toTime),
          sql`${transactions.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(transactions.date));

    // Aggregate by customer
    const custStats: Record<string, { count: number, lastDate: number | null }> = {};
    for (const t of txns) {
      if (!t.customerId) continue;
      if (!custStats[t.customerId]) {
        custStats[t.customerId] = { count: 0, lastDate: t.date };
      }
      custStats[t.customerId].count++;
      if (t.date > (custStats[t.customerId].lastDate || 0)) {
        custStats[t.customerId].lastDate = t.date;
      }
    }

    const rows: CustomerStatementRow[] = [];
    let totalReceivable = 0;
    let totalPayable = 0;
    let withDue = 0;
    let withCredit = 0;

    for (const c of customersList) {
      const stats = custStats[c.id] || { count: 0, lastDate: null };

      if (c.balance > 0) { totalReceivable += c.balance; withCredit++; }
      else if (c.balance < 0) { totalPayable += Math.abs(c.balance); withDue++; }

      rows.push({
        customerId: c.id,
        name: c.name,
        phone: c.phone ?? '',
        email: c.email ?? '',
        balance: c.balance,
        totalTransactions: stats.count,
        lastActivityDate: stats.lastDate ? new Date(stats.lastDate * 1000) : null,
      });
    }

    rows.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    return {
      meta: this.meta(businessId, 'Customer Report', filter),
      summary: {
        total: customersList.length,
        withDue,
        withCredit,
        totalReceivable,
        totalPayable,
      },
      rows,
    };
  }

  // ── Ledger Report ──────────────────────────────────────────────────────────

  async getLedgerReport(businessId: string, filter: DateFilter): Promise<LedgerReport> {
    const fromTime = Math.floor(filter.from.getTime() / 1000);
    const toTime = Math.floor(filter.to.getTime() / 1000);

    const ledgersList = await database.select().from(ledgers).where(and(eq(ledgers.businessId, businessId), sql`${ledgers.deletedAt} IS NULL`));
    const rows: LedgerStatementRow[] = [];
    
    let totalIncome = 0;
    let totalExpense = 0;

    for (const l of ledgersList) {
      const txns = await database
        .select({
          amount: transactions.amount,
          type: transactions.type
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.ledgerId, l.id),
            gte(transactions.date, fromTime),
            lte(transactions.date, toTime),
            sql`${transactions.deletedAt} IS NULL`
          )
        );

      let inc = 0;
      let exp = 0;
      for (const t of txns) {
        if (t.type === 'INCOME' || t.type === 'GOT') inc += t.amount;
        else exp += t.amount;
      }

      totalIncome += inc;
      totalExpense += exp;

      rows.push({
        ledgerId: l.id,
        name: l.name,
        type: l.type,
        openingBalance: 0,
        totalIncome: inc,
        totalExpense: exp,
        closingBalance: inc - exp,
        transactionCount: txns.length,
      });
    }

    return {
      meta: this.meta(businessId, 'Ledger Statement', filter),
      rows,
      totals: { totalIncome, totalExpense },
    };
  }

  // ── Reminder Report ────────────────────────────────────────────────────────

  async getReminderReport(businessId: string): Promise<ReminderReport> {
    const nowTime = Math.floor(new Date().getTime() / 1000);
    const all = await database.select().from(reminders).where(and(eq(reminders.businessId, businessId), sql`${reminders.deletedAt} IS NULL`));

    const pending = all
      .filter((r) => r.status === 'PENDING' && r.dueDate >= nowTime)
      .map((r) => ({ id: r.id, title: r.title, dueDate: new Date(r.dueDate * 1000), status: r.status }));

    const overdue = all
      .filter((r) => r.status === 'PENDING' && r.dueDate < nowTime)
      .map((r) => ({ id: r.id, title: r.title, dueDate: new Date(r.dueDate * 1000), status: r.status }));

    return {
      meta: this.meta(businessId, 'Reminder Report', { from: new Date(0), to: new Date() }),
      pending,
      overdue,
    };
  }
}

export const reportsRepo = new ReportsRepository();
