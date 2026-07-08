import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { CategoryStat } from '../../services/dashboard.service';
import { formatCompactCurrency } from '../useDashboard';

interface Props {
  data: CategoryStat[];
  limit?: number;
}

export const CategoryBreakdown = React.memo(({ data, limit = 6 }: Props) => {
  const theme = useTheme();
  const shown = data.slice(0, limit);
  const total = shown.reduce((s, c) => s + c.amount, 0);

  const COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6', '#a855f7'];

  if (shown.length === 0) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginBottom: 8, fontWeight: '700' }}>
          Top Categories
        </Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 24 }}>
          No category data
        </Text>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="titleSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        Top Categories
      </Text>

      {/* Stacked bar */}
      <View style={styles.stackBar}>
        {shown.map((cat, i) => {
          const pct = total > 0 ? (cat.amount / total) * 100 : 0;
          return (
            <View
              key={cat.categoryId}
              style={{
                height: 12,
                width: `${pct}%`,
                backgroundColor: COLORS[i % COLORS.length],
                borderRadius: i === 0 ? 6 : i === shown.length - 1 ? 6 : 0,
              }}
            />
          );
        })}
      </View>

      {/* List */}
      <View style={styles.list}>
        {shown.map((cat, i) => {
          const pct = total > 0 ? ((cat.amount / total) * 100).toFixed(1) : '0.0';
          return (
            <View key={cat.categoryId} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: COLORS[i % COLORS.length] }]} />
              <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>
                {cat.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginRight: 8 }}>
                {pct}%
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                {formatCompactCurrency(cat.amount)}
              </Text>
            </View>
          );
        })}
      </View>
    </Surface>
  );
});

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { fontWeight: '700', marginBottom: 12 },
  stackBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16 },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
});
