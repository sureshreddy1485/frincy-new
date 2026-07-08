import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { DailyCashFlow } from '../../services/dashboard.service';
import { formatCompactCurrency } from '../useDashboard';

interface Props {
  data: DailyCashFlow[];
  height?: number;
}

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 48;

export const CashFlowChart = React.memo(({ data, height = 160 }: Props) => {
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 32 }}>
          No cash flow data yet
        </Text>
      </Surface>
    );
  }

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const barW = Math.max(6, Math.min(32, (CHART_W - 32) / (data.length * 2.5)));

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="titleSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        Income vs Expense
      </Text>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
        <Text variant="bodySmall" style={{ marginRight: 12, color: theme.colors.onSurfaceVariant }}>Income</Text>
        <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Expense</Text>
      </View>

      {/* Bars */}
      <View style={[styles.chart, { height }]}>
        {data.map((d, i) => {
          const incomeH = (d.income / maxVal) * (height - 24);
          const expenseH = (d.expense / maxVal) * (height - 24);
          const label = d.date.slice(5); // MM-DD

          return (
            <View key={i} style={styles.barGroup}>
              <View style={styles.bars}>
                {/* Income bar */}
                <View style={{ width: barW, height, justifyContent: 'flex-end' }}>
                  <View style={[styles.bar, { height: Math.max(2, incomeH), backgroundColor: '#22c55e', borderRadius: barW / 2 }]} />
                </View>
                {/* Expense bar */}
                <View style={{ width: barW, height, justifyContent: 'flex-end', marginLeft: 2 }}>
                  <View style={[styles.bar, { height: Math.max(2, expenseH), backgroundColor: '#ef4444', borderRadius: barW / 2 }]} />
                </View>
              </View>
              <Text style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <Text variant="bodySmall" style={{ color: '#22c55e' }}>
          ↑ {formatCompactCurrency(data.reduce((s, d) => s + d.income, 0))}
        </Text>
        <Text variant="bodySmall" style={{ color: '#ef4444' }}>
          ↓ {formatCompactCurrency(data.reduce((s, d) => s + d.expense, 0))}
        </Text>
      </View>
    </Surface>
  );
});

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { marginBottom: 8, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', overflow: 'hidden' },
  barGroup: { alignItems: 'center', marginRight: 8 },
  bars: { flexDirection: 'row' },
  bar: { width: '100%' },
  dateLabel: { fontSize: 9, marginTop: 4, width: 36, textAlign: 'center' },
  totals: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
