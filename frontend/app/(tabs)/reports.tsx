import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, List, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';

const REPORT_CATEGORIES = [
  {
    title: 'Financial Reports',
    icon: 'finance',
    color: '#22c55e',
    reports: [
      { id: 'financial', label: 'Financial Summary', desc: 'Overview of income, expenses, and net profit.' },
      { id: 'profit-loss', label: 'Profit & Loss', desc: 'Detailed breakdown of income and expenses by category.' },
      { id: 'cash-flow', label: 'Cash Flow Statement', desc: 'Inflows and outflows over a specific period.' },
    ],
  },
  {
    title: 'Customer Reports',
    icon: 'account-group',
    color: '#3b82f6',
    reports: [
      { id: 'customer', label: 'Customer Summary', desc: 'Balances, due amounts, and recent activity.' },
    ],
  },
  {
    title: 'Ledger Reports',
    icon: 'book-open-variant',
    color: '#f59e0b',
    reports: [
      { id: 'ledger', label: 'Ledger Statement', desc: 'Detailed transactions per ledger.' },
    ],
  },
  {
    title: 'Task Reports',
    icon: 'bell-ring',
    color: '#a855f7',
    reports: [
      { id: 'reminder', label: 'Reminders Report', desc: 'Pending and overdue payment reminders.' },
    ],
  }
];

export default function ReportsScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
          Reports Center
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          Generate professional reports, export to PDF or CSV.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {REPORT_CATEGORIES.map((cat, idx) => (
          <View key={cat.title} style={styles.categoryContainer}>
            <List.Subheader style={[styles.subHeader, { color: cat.color }]}>
              {cat.title}
            </List.Subheader>
            
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              {cat.reports.map((report, rIdx) => (
                <React.Fragment key={report.id}>
                  <List.Item
                    title={report.label}
                    titleStyle={{ fontWeight: '600', color: theme.colors.onSurface }}
                    description={report.desc}
                    descriptionStyle={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
                    left={props => <List.Icon {...props} icon={cat.icon} color={cat.color} />}
                    right={props => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => (router as any).push(`/reports/generate?type=${report.id}`)}
                  />
                  {rIdx < cat.reports.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: 16,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: -16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
  }
});
