import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, useTheme, Divider } from 'react-native-paper';
import { TopCustomer } from '../../services/dashboard.service';
import { formatCompactCurrency } from '../useDashboard';
import { useRouter } from 'expo-router';

interface Props {
  customers: TopCustomer[];
}

export const TopCustomersList = React.memo(({ customers }: Props) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="titleSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        Top Customers
      </Text>
      {customers.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', padding: 16 }}>
          No customers yet
        </Text>
      ) : (
        customers.map((c, i) => {
          const isOwing = c.balance < 0;
          return (
            <View key={c.customerId}>
              <Surface
                elevation={0}
                style={{ backgroundColor: 'transparent' }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  (router as any).push(`/customers/${c.customerId}`);
                }}
              >
                <View style={styles.row}>
                  <View style={[styles.rank, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                      #{i + 1}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>
                    {c.name}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ fontWeight: '700', color: isOwing ? theme.colors.error : '#22c55e' }}
                  >
                    {formatCompactCurrency(Math.abs(c.balance))}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                    {isOwing ? 'owes' : 'credit'}
                  </Text>
                </View>
              </Surface>
              {i < customers.length - 1 && <Divider style={{ marginVertical: 4 }} />}
            </View>
          );
        })
      )}
    </Surface>
  );
});

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  rank: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
});
