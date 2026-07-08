import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Appbar,
  List,
  Text,
  useTheme,
  Chip,
  Divider,
  Button,
  Surface,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSync } from '../../src/sync/useSyncHook';
import { useAuthStore } from '../../src/store/authStore';

const STATUS_COLORS: Record<string, string> = {
  Synced: '#22c55e',
  Syncing: '#3b82f6',
  'Pending Changes': '#f59e0b',
  'Sync Failed': '#ef4444',
  Offline: '#6b7280',
};

export default function SyncStatusScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();

  const {
    status,
    isOnline,
    lastSyncLabel,
    pendingCount,
    failedCount,
    logs,
    sync,
    forceFullSync,
  } = useSync();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleSync = async () => {
    setRefreshing(true);
    await sync();
    setRefreshing(false);
  };

  const handleForceSync = async () => {
    setRefreshing(true);
    await forceFullSync();
    setRefreshing(false);
  };

  const statusColor = STATUS_COLORS[status] ?? theme.colors.onSurface;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Sync Status" />
      </Appbar.Header>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleSync} />}
        contentContainerStyle={styles.content}
      >
        {/* ── Status Card ─────────────────────────────────────────────────── */}
        <Surface style={styles.statusCard} elevation={2}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text variant="headlineSmall" style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>

          <View style={styles.chipRow}>
            <Chip
              icon={isOnline ? 'wifi' : 'wifi-off'}
              style={{ backgroundColor: isOnline ? theme.colors.primaryContainer : theme.colors.surfaceVariant }}
              textStyle={{ color: isOnline ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Chip>
            {pendingCount > 0 && (
              <Chip 
                icon="upload" 
                style={{ backgroundColor: theme.colors.secondaryContainer, marginLeft: 8 }}
                textStyle={{ color: theme.colors.onSecondaryContainer }}
              >
                {pendingCount} Pending
              </Chip>
            )}
            {failedCount > 0 && (
              <Chip 
                icon="alert-circle" 
                style={{ backgroundColor: theme.colors.errorContainer, marginLeft: 8 }}
                textStyle={{ color: theme.colors.onErrorContainer }}
              >
                {failedCount} Failed
              </Chip>
            )}
          </View>
        </Surface>

        {/* ── Metadata ────────────────────────────────────────────────────── */}
        <List.Section>
          <List.Subheader>Sync Details</List.Subheader>
          <List.Item
            title="Last Synced"
            description={lastSyncLabel}
            left={(p) => <List.Icon {...p} icon="clock-outline" />}
          />
          <List.Item
            title="Pending Operations"
            description={pendingCount.toString()}
            left={(p) => <List.Icon {...p} icon="upload-outline" />}
          />
          <List.Item
            title="Failed Operations"
            description={failedCount.toString()}
            left={(p) => <List.Icon {...p} icon="alert-circle-outline" />}
          />
        </List.Section>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="sync"
            onPress={handleSync}
            loading={status === 'Syncing'}
            disabled={status === 'Syncing' || !isOnline}
            style={styles.btn}
          >
            Sync Now
          </Button>

          <Button
            mode="outlined"
            icon="database-refresh"
            onPress={handleForceSync}
            disabled={status === 'Syncing' || !isOnline}
            style={styles.btn}
          >
            Force Full Sync
          </Button>
        </View>

        {/* ── Logs ────────────────────────────────────────────────────────── */}
        <List.Section>
          <List.Subheader>Sync Log</List.Subheader>
          {logs.length === 0 ? (
            <Text style={styles.emptyLogs}>No sync events yet.</Text>
          ) : (
            logs.map((log) => (
              <React.Fragment key={log.id}>
                <List.Item
                  title={log.message}
                  description={new Date(log.timestamp).toLocaleTimeString()}
                  titleNumberOfLines={2}
                  left={(p) => (
                    <List.Icon
                      {...p}
                      icon={
                        log.event === 'SYNC_FAILED'
                          ? 'alert-circle'
                          : log.event === 'CONFLICT_DETECTED'
                          ? 'swap-horizontal'
                          : log.event === 'RETRY_ATTEMPTED'
                          ? 'refresh'
                          : 'check-circle-outline'
                      }
                      color={
                        log.event === 'SYNC_FAILED'
                          ? theme.colors.error
                          : log.event === 'CONFLICT_DETECTED'
                          ? '#f59e0b'
                          : theme.colors.primary
                      }
                    />
                  )}
                />
                <Divider />
              </React.Fragment>
            ))
          )}
        </List.Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  statusCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  statusText: { fontWeight: 'bold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  actions: { paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  btn: { borderRadius: 12 },
  emptyLogs: { textAlign: 'center', padding: 24, opacity: 0.5 },
});
