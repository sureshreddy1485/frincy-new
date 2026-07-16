import { useState, useEffect, useCallback, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { dashboardService, DateRange, DateFilter, getDateFilter } from '../services/dashboard.service';
import { customerService } from '../services/customer.service';
import type {
  FinancialSummary,
  CustomerSummary,
  LedgerSummary,
  CategoryStat,
  DailyCashFlow,
  TopCustomer,
  UpcomingReminder,
} from '../services/dashboard.service';

// ─── Shared state types ───────────────────────────────────────────────────────

interface DashboardData {
  financial: FinancialSummary;
  customers: CustomerSummary;
  ledgers: LedgerSummary;
  categoryStats: CategoryStat[];
  cashFlow: DailyCashFlow[];
  topCustomers: TopCustomer[];
  recentTransactions: any[];
  upcomingReminders: UpcomingReminder[];
  insights: any;
}

const EMPTY_FINANCIAL: FinancialSummary = {
  income: 0, expense: 0, profit: 0, totalBalance: 0, totalReceivable: 0, totalPayable: 0,
};
const EMPTY_CUSTOMERS: CustomerSummary = { total: 0, withDue: 0, withCredit: 0, newThisMonth: 0 };
const EMPTY_LEDGERS: LedgerSummary = { total: 0, totalTransactions: 0, avgTransactionValue: 0 };

function emptyData(): DashboardData {
  return {
    financial: EMPTY_FINANCIAL,
    customers: EMPTY_CUSTOMERS,
    ledgers: EMPTY_LEDGERS,
    categoryStats: [],
    cashFlow: [],
    topCustomers: [],
    recentTransactions: [],
    upcomingReminders: [],
    insights: {},
  };
}

// ─── Main Dashboard Hook ──────────────────────────────────────────────────────

export function useDashboard(businessId: string | null) {
  const [data, setData] = useState<DashboardData>(emptyData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customFilter, setCustomFilter] = useState<DateFilter | undefined>(undefined);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (!businessId || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Migrate legacy ledgers seamlessly if needed
      await customerService.migrateStandaloneLedgers(businessId);

      const filter = getDateFilter(dateRange, customFilter);

      const [financial, customers, ledgers, categoryStats, cashFlow, topCustomers, recentTransactions, upcomingReminders, insights] =
        await Promise.all([
          dashboardService.getFinancialSummary(businessId, filter),
          dashboardService.getCustomerSummary(businessId),
          dashboardService.getLedgerSummary(businessId),
          dashboardService.getCategoryStats(businessId, filter),
          dashboardService.getDailyCashFlow(businessId, filter),
          dashboardService.getTopCustomers(businessId),
          dashboardService.getRecentTransactions(businessId),
          dashboardService.getUpcomingReminders(businessId),
          dashboardService.getInsights(businessId),
        ]);

      setData({ financial, customers, ledgers, categoryStats, cashFlow, topCustomers, recentTransactions, upcomingReminders, insights });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load dashboard');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [businessId, dateRange, customFilter]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      load();
    });
    return () => task.cancel();
  }, [load]);

  return {
    ...data,
    loading,
    error,
    dateRange,
    setDateRange,
    customFilter,
    setCustomFilter,
    refresh: load,
  };
}

// ─── Format helpers (exported for reuse in Reports, AI, etc.) ─────────────────



export function formatCompactCurrency(amount: number, currency = 'INR'): string {
  const sym = currency === 'INR' ? '₹' : '$';
  if (Math.abs(amount) >= 100_000) return `${sym}${(amount / 100_000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1_000) return `${sym}${(amount / 1_000).toFixed(1)}K`;
  return `${sym}${amount.toFixed(0)}`;
}
