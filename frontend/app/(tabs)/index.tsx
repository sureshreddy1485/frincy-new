import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput as RNTextInput,
  Keyboard,
} from 'react-native';
import {
  Appbar,
  Text,
  useTheme,
  Surface,
  Chip,
  IconButton,
  Button,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useBusinessStore } from '../../src/store/businessStore';
import { useAuthStore } from '../../src/store/authStore';
import { useDashboard, formatCompactCurrency, fc } from '../../src/dashboard/useDashboard';
import { useNotifications } from '../../src/notifications/useNotifications';
import { KpiCard } from '../../src/dashboard/components/KpiCard';
import { CashFlowChart } from '../../src/dashboard/components/CashFlowChart';
import { CategoryBreakdown } from '../../src/dashboard/components/CategoryBreakdown';
import { QuickActions } from '../../src/dashboard/components/QuickActions';
import { TopCustomersList } from '../../src/dashboard/components/TopCustomersList';
import { UpcomingReminders } from '../../src/dashboard/components/UpcomingReminders';
import { DashboardSkeleton } from '../../src/dashboard/components/DashboardSkeleton';
import { DateRangeSelector } from '../../src/dashboard/components/DateRangeSelector';
import { SyncStatusBadge } from '../../src/components/SyncStatusBadge';
import { useSync } from '../../src/sync/useSyncHook';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { activeBusinessId } = useBusinessStore();
  const { user } = useAuthStore();
  const { status: syncStatus } = useSync();

  const {
    financial, customers, ledgers, categoryStats, cashFlow,
    topCustomers, upcomingReminders, insights,
    loading, error, dateRange, setDateRange, refresh,
    setCustomFilter, customFilter
  } = useDashboard(activeBusinessId);

  const { unreadCount } = useNotifications(activeBusinessId, user?.id ?? null);

  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (!activeBusinessId) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🏢</Text>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground, fontWeight: 'bold' }}>
          No Business Selected
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
          Go to Settings to create or select a business workspace.
        </Text>
        <Button mode="contained" onPress={() => (router as any).push('/businesses/create')} style={{ marginTop: 24 }}>
          Create Business
        </Button>
      </View>
    );
  }

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text variant="headlineSmall" style={{ color: theme.colors.error }}>Load Failed</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
          {error}
        </Text>
        <Chip icon="refresh" onPress={refresh} style={{ marginTop: 16 }}>Retry</Chip>
      </View>
    );
  }

  const currency = 'INR';
  const fc = (n: number) => formatCompactCurrency(n, currency);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ── App Bar ─────────────────────────────────────────────────────── */}
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} elevated>
        {searchVisible ? (
          <View style={styles.searchBar}>
            <RNTextInput
              autoFocus
              placeholder="Search customers, ledgers, transactions..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  (router as any).push(`/search?q=${encodeURIComponent(searchQuery)}`);
                }
              }}
              style={[styles.searchInput, { color: theme.colors.onSurface }]}
            />
            <IconButton
              icon="close"
              size={20}
              onPress={() => { setSearchVisible(false); setSearchQuery(''); Keyboard.dismiss(); }}
            />
          </View>
        ) : (
          <>
            <Appbar.Content
              title={user?.name ? `Hi, ${user.name.split(' ')[0]} 👋` : 'Dashboard'}
              titleStyle={{ fontSize: 18, fontWeight: '700' }}
              style={{ paddingLeft: 16 }}
            />
            <SyncStatusBadge />
            <Appbar.Action icon="magnify" onPress={() => setSearchVisible(true)} />
            <View>
              <Appbar.Action icon="bell-outline" onPress={() => (router as any).push('/notifications')} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
          </>
        )}
      </Appbar.Header>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Date Range Filter ─────────────────────────────────────────── */}
        <DateRangeSelector 
          selected={dateRange} 
          onSelect={(r) => { setDateRange(r); setCustomFilter(undefined); }} 
          onCustomFilter={(filter) => setCustomFilter(filter)}
          customFilter={customFilter}
        />

        {/* ── Balance Hero Card ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Surface style={[styles.heroCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={3}>
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.8 }}>
              Total Balance
            </Text>
            <Text variant="displaySmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '800', marginVertical: 4 }}>
              {fc(financial.totalBalance)}
            </Text>
            <View style={styles.heroRow}>
              <View style={styles.heroStat}>
                <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>Receivable</Text>
                <Text variant="titleSmall" style={{ color: '#22c55e', fontWeight: '700' }}>
                  {fc(financial.totalReceivable)}
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>Payable</Text>
                <Text variant="titleSmall" style={{ color: '#ef4444', fontWeight: '700' }}>
                  {fc(financial.totalPayable)}
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                  {financial.profit > 0 ? 'Net Profit' : financial.profit < 0 ? 'Net Loss' : 'Break Even'}
                </Text>
                <Text variant="titleSmall" style={{
                  color: financial.profit > 0 ? '#22c55e' : financial.profit < 0 ? '#ef4444' : '#9ca3af',
                  fontWeight: '700',
                }}>
                  {fc(Math.abs(financial.profit))}
                </Text>
              </View>
            </View>
          </Surface>
        </Animated.View>

        {/* ── Financial KPIs ────────────────────────────────────────────── */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Financial Overview
        </Text>
        <View style={styles.kpiGrid}>
          <KpiCard label="Income" value={fc(financial.income)} icon="💰" color="#22c55e" index={0} />
          <KpiCard label="Expense" value={fc(financial.expense)} icon="💸" color="#ef4444" index={1} negative={financial.expense > financial.income} />
          <KpiCard label="Today Income" value={fc(insights.todayIncome ?? 0)} icon="📈" color="#3b82f6" index={2} />
          <KpiCard label="Today Expense" value={fc(insights.todayExpense ?? 0)} icon="📉" color="#f59e0b" index={3} />
        </View>

        {/* ── Customer KPIs ─────────────────────────────────────────────── */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Customers
        </Text>
        <View style={styles.kpiGrid}>
          <KpiCard label="Total Customers" value={customers.total.toString()} icon="👥" color="#6366f1" index={0} />
          <KpiCard label="With Due Amount" value={customers.withDue.toString()} icon="⚠️" color="#ef4444" index={1} />
          <KpiCard label="With Credit" value={customers.withCredit.toString()} icon="✅" color="#22c55e" index={2} />
          <KpiCard label="New This Month" value={customers.newThisMonth.toString()} icon="🆕" color="#3b82f6" index={3} />
        </View>

        {/* ── Ledger KPIs ───────────────────────────────────────────────── */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Ledgers
        </Text>
        <View style={styles.kpiGrid}>
          <KpiCard label="Total Ledgers" value={ledgers.total.toString()} icon="📒" color="#f59e0b" index={0} />
          <KpiCard label="Transactions" value={ledgers.totalTransactions.toString()} icon="↔️" color="#6366f1" index={1} />
          <KpiCard
            label="Avg Transaction"
            value={fc(ledgers.avgTransactionValue)}
            icon="📊" color="#a855f7" index={2}
          />
          <KpiCard label="Avg Daily Income" value={fc(insights.avgDailyIncome ?? 0)} icon="🎯" color="#22c55e" index={3} />
        </View>

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <QuickActions businessId={activeBusinessId} />

        {/* ── Cash Flow Chart ───────────────────────────────────────────── */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Cash Flow
        </Text>
        <CashFlowChart data={cashFlow} />

        {/* ── Category Breakdown ────────────────────────────────────────── */}
        <CategoryBreakdown data={categoryStats} />

        {/* ── Top Customers ─────────────────────────────────────────────── */}
        <TopCustomersList customers={topCustomers} />

        {/* ── Insights Row ──────────────────────────────────────────────── */}
        {insights.topSpendingCategory && (
          <Surface style={[styles.insightsCard, { backgroundColor: theme.colors.secondaryContainer }]} elevation={1}>
            <Text variant="titleSmall" style={{ color: theme.colors.onSecondaryContainer, fontWeight: '700', marginBottom: 8 }}>
              💡 Business Insights
            </Text>
            <View style={styles.insightRow}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer, opacity: 0.8 }}>Top Spending Category</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer, fontWeight: '700' }}>
                {insights.topSpendingCategory}
              </Text>
            </View>
            <View style={styles.insightRow}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer, opacity: 0.8 }}>Most Active Customer</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer, fontWeight: '700' }}>
                {insights.mostActiveCustomer}
              </Text>
            </View>
            <View style={styles.insightRow}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer, opacity: 0.8 }}>Avg Daily Expense</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer, fontWeight: '700' }}>
                {fc(insights.avgDailyExpense ?? 0)}
              </Text>
            </View>
          </Surface>
        )}

        {/* ── Upcoming Reminders ────────────────────────────────────────── */}
        <UpcomingReminders reminders={upcomingReminders} onRefresh={refresh} />

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scrollContent: { paddingBottom: 24 },

  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  searchInput: { flex: 1, fontSize: 16, paddingHorizontal: 8, paddingVertical: 8 },

  heroCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 24,
  },
  heroRow: { flexDirection: 'row', marginTop: 16, alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroDivider: { width: 1, height: 32, backgroundColor: 'rgba(0,0,0,0.1)' },
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },

  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },

  insightsCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16 },
  insightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
