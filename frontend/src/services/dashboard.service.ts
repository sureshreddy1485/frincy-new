import { dashboardRepository } from '../repository/dashboard.repository';

// ─── Date utilities ─────────
function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function startOfYear(date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

export interface DateFilter {
  from: Date;
  to: Date;
}

export function getDateFilter(range: DateRange, custom?: DateFilter): DateFilter {
  const now = new Date();
  switch (range) {
    case 'today':
      return { from: startOfDay(), to: now };
    case 'yesterday': {
      const start = startOfDay();
      start.setDate(start.getDate() - 1);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    }
    case 'week':
      return { from: startOfWeek(), to: now };
    case 'month':
      return { from: startOfMonth(), to: now };
    case 'year':
      return { from: startOfYear(), to: now };
    case 'custom':
      return custom ?? { from: startOfMonth(), to: now };
  }
}

// ─── Core interfaces (Re-exported to preserve UI hook compatibility) ────────
export interface FinancialSummary {
  income: number;
  expense: number;
  profit: number;
  totalBalance: number;
  totalReceivable: number;
  totalPayable: number;
}
export interface CustomerSummary {
  total: number;
  withDue: number;
  withCredit: number;
  newThisMonth: number;
}
export interface LedgerSummary {
  total: number;
  totalTransactions: number;
  avgTransactionValue: number;
}
export interface CategoryStat {
  categoryId: string;
  name: string;
  amount: number;
  count: number;
}
export interface DailyCashFlow {
  date: string;
  income: number;
  expense: number;
}
export interface TopCustomer {
  customerId: string;
  name: string;
  balance: number;
}
export interface UpcomingReminder {
  id: string;
  title: string;
  dueDate: number;
  status: string;
  relatedId: string | null;
}
interface ProductsSummary {
  total: number;
  lowStock: number;
}

class DashboardService {
  
  async getFinancialSummary(businessId: string, filter: DateFilter): Promise<FinancialSummary> {
    const fromTime = Math.floor(filter.from.getTime() / 1000);
    const toTime = Math.floor(filter.to.getTime() / 1000);
    return dashboardRepository.getFinancialSummary(businessId, fromTime, toTime);
  }

  async getCustomerSummary(businessId: string): Promise<CustomerSummary> {
    const monthStart = Math.floor(startOfMonth().getTime() / 1000);
    return dashboardRepository.getCustomerSummary(businessId, monthStart);
  }

  async getLedgerSummary(businessId: string): Promise<LedgerSummary> {
    return dashboardRepository.getLedgerSummary(businessId);
  }

  async getDailyCashFlow(businessId: string, filter: DateFilter): Promise<DailyCashFlow[]> {
    const fromTime = Math.floor(filter.from.getTime() / 1000);
    const toTime = Math.floor(filter.to.getTime() / 1000);
    const rawTx = await dashboardRepository.getDailyCashFlow(businessId, fromTime, toTime);

    // Aggregate by date (YYYY-MM-DD) natively in JS since sqlite-core lacks simple formatting
    const map: Record<string, { income: number; expense: number }> = {};

    for (const t of rawTx) {
      // t.date is unix seconds
      const key = new Date(t.date * 1000).toISOString().split('T')[0];
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      if (t.type === 'INCOME' || t.type === 'GOT') map[key].income += t.amount;
      else map[key].expense += t.amount;
    }

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));
  }

  async getCategoryStats(businessId: string, filter: DateFilter): Promise<CategoryStat[]> {
    const fromTime = Math.floor(filter.from.getTime() / 1000);
    const toTime = Math.floor(filter.to.getTime() / 1000);
    return dashboardRepository.getCategoryStats(businessId, fromTime, toTime);
  }

  async getTopCustomers(businessId: string, limit = 5): Promise<TopCustomer[]> {
    return dashboardRepository.getTopCustomers(businessId, limit);
  }

  async getRecentTransactions(businessId: string, limit = 10) {
    return dashboardRepository.getRecentTransactions(businessId, limit);
  }

  async getUpcomingReminders(businessId: string, limit = 5): Promise<UpcomingReminder[]> {
    const now = Math.floor(new Date().getTime() / 1000);
    return dashboardRepository.getUpcomingReminders(businessId, limit, now);
  }

  async getProductsSummary(businessId: string): Promise<ProductsSummary> {
    return dashboardRepository.getProductsSummary(businessId);
  }

  async getPendingSyncCount(): Promise<number> {
    return dashboardRepository.getPendingSyncCount();
  }

  async getInsights(businessId: string) {
    const monthFilter = getDateFilter('month');
    const [financial, categoryStats, topCustomers, productsSummary, syncCount] = await Promise.all([
      this.getFinancialSummary(businessId, monthFilter),
      this.getCategoryStats(businessId, monthFilter),
      this.getTopCustomers(businessId, 1),
      this.getProductsSummary(businessId),
      this.getPendingSyncCount(),
    ]);

    const dayFilter = getDateFilter('today');
    const todayFinancial = await this.getFinancialSummary(businessId, dayFilter);

    const topSpendingCat = categoryStats.find((c) => c.name !== undefined);
    const mostActiveCustomer = topCustomers[0] ?? null;

    const daysInMonth = new Date().getDate();

    return {
      avgDailyIncome: daysInMonth > 0 ? financial.income / daysInMonth : 0,
      avgDailyExpense: daysInMonth > 0 ? financial.expense / daysInMonth : 0,
      topSpendingCategory: topSpendingCat?.name ?? '—',
      mostActiveCustomer: mostActiveCustomer?.name ?? '—',
      todayIncome: todayFinancial.income,
      todayExpense: todayFinancial.expense,
      totalProducts: productsSummary.total,
      lowStockProducts: productsSummary.lowStock,
      pendingSyncs: syncCount,
    };
  }
}

export const dashboardService = new DashboardService();
