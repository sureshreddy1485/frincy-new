import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, useTheme, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  route?: string;
  onPress?: () => void;
}

interface Props {
  actions?: QuickAction[];
  businessId: string | null;
}

const defaultActions = (businessId: string | null, router: any): QuickAction[] => [
  { id: 'customer', label: 'Add\nCustomer', icon: '👤', color: '#6366f1', route: '/customers/add' },
  { id: 'income', label: 'Add\nIncome', icon: '💰', color: '#22c55e', route: '/customers' },
  { id: 'expense', label: 'Add\nExpense', icon: '💸', color: '#ef4444', route: '/customers' },
  { id: 'scanner', label: 'Scan\nReceipt', icon: '📸', color: '#14b8a6', route: '/scanner' },
  { id: 'reminder', label: 'Reminder', icon: '🔔', color: '#3b82f6', route: '/customers' },
  { id: 'sync', label: 'Sync\nNow', icon: '☁', color: '#a855f7', route: '/settings/sync' },
];

export const QuickActions = React.memo(({ businessId }: Props) => {
  const theme = useTheme();
  const router = useRouter();
  const actions = defaultActions(businessId, router);

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="titleSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        Quick Actions
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {actions.map((action) => (
          <View key={action.id} style={styles.item}>
            <Surface
              style={[styles.iconBtn, { backgroundColor: action.color + '18' }]}
              elevation={0}
              onTouchEnd={() => {
                if (action.route) (router as any).push(action.route);
                action.onPress?.();
              }}
            >
              <Text style={{ fontSize: 28 }}>{action.icon}</Text>
            </Surface>
            <Text variant="bodySmall" style={[styles.actionLabel, { color: theme.colors.onSurfaceVariant }]}>
              {action.label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Surface>
  );
});

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { fontWeight: '700', marginBottom: 12 },
  scroll: { marginHorizontal: -4 },
  item: { alignItems: 'center', marginHorizontal: 8, width: 64 },
  iconBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: { textAlign: 'center', fontSize: 10, lineHeight: 14 },
});
