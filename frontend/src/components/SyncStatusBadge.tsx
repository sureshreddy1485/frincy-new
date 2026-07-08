import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSync } from '../sync/useSyncHook';

const STATUS_ICON: Record<string, string> = {
  Synced: '☁✓',
  Syncing: '…',
  'Pending Changes': '↑',
  'Sync Failed': '⚠',
  Offline: '○',
};

const STATUS_COLOR: Record<string, string> = {
  Synced: '#22c55e',
  Syncing: '#3b82f6',
  'Pending Changes': '#f59e0b',
  'Sync Failed': '#ef4444',
  Offline: '#6b7280',
};

export function SyncStatusBadge() {
  const theme = useTheme();
  const router = useRouter();
  const { status, pendingCount } = useSync();

  const color = STATUS_COLOR[status] ?? theme.colors.onSurface;

  const handlePress = () => {
    // Using push with explicit cast for Expo Router typed-routes
    (router as any).push('/settings/sync');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityLabel={`Sync status: ${status}`}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
        {status === 'Syncing' ? (
          <ActivityIndicator size={14} color={color} style={styles.icon} />
        ) : (
          <Text style={[styles.icon, { color }]}>{STATUS_ICON[status]}</Text>
        )}
        <Text style={[styles.label, { color }]}>
          {status}
          {pendingCount > 0 ? ` (${pendingCount})` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 4,
  },
  icon: { fontSize: 13, marginRight: 4 },
  label: { fontSize: 11, fontWeight: '700' },
});
