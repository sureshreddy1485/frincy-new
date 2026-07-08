import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Appbar, useTheme, Surface, Text, IconButton, Divider, SegmentedButtons, FAB, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { useAuthStore } from '../src/store/authStore';
import { useBusinessStore } from '../src/store/businessStore';
import { useNotifications } from '../src/notifications/useNotifications';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const { user } = useAuthStore();
  const { activeBusinessId } = useBusinessStore();
  
  const { 
    notifications, 
    reminders, 
    loading, 
    refresh, 
    markAllRead, 
    markNotificationRead,
    updateReminderStatus,
    deleteReminder
  } = useNotifications(activeBusinessId, user?.id ?? null);
  
  const [tab, setTab] = useState('notifications');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const renderNotifications = () => {
    if (notifications.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>📭</Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>No Notifications</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>You're all caught up!</Text>
        </View>
      );
    }
    
    return notifications.map((n, i) => (
      <View key={n.id}>
        <Surface 
          style={[styles.item, { backgroundColor: n.isRead ? theme.colors.surface : theme.colors.primaryContainer }]} 
          elevation={0}
          onTouchEnd={() => markNotificationRead(n.id)}
        >
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={{ color: n.isRead ? theme.colors.onSurface : theme.colors.onPrimaryContainer, fontWeight: n.isRead ? '400' : '700' }}>
              {n.title}
            </Text>
            <Text variant="bodyMedium" style={{ color: n.isRead ? theme.colors.onSurfaceVariant : theme.colors.onPrimaryContainer, marginTop: 4 }}>
              {n.body}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              {new Date(n.createdAt * 1000).toLocaleString()}
            </Text>
          </View>
          {!n.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />}
        </Surface>
        {i < notifications.length - 1 && <Divider />}
      </View>
    ));
  };

  const renderReminders = () => {
    if (reminders.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>🔔</Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>No Reminders</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Add a reminder to track payments or tasks.</Text>
        </View>
      );
    }

    return reminders.map((r, i) => {
      const isOverdue = (r.dueDate * 1000) < Date.now() && r.status === 'PENDING';
      const isCompleted = r.status === 'COMPLETED';

      return (
        <View key={r.id}>
          <Surface style={[styles.item, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ 
                color: isCompleted ? theme.colors.onSurfaceVariant : (isOverdue ? theme.colors.error : theme.colors.onSurface),
                textDecorationLine: isCompleted ? 'line-through' : 'none'
              }}>
                {r.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontSize: 12 }}>{isOverdue ? '⚠️ ' : '⏳ '}</Text>
                <Text variant="bodySmall" style={{ color: isOverdue ? theme.colors.error : theme.colors.onSurfaceVariant }}>
                  Due: {new Date(r.dueDate * 1000).toLocaleString()}
                </Text>
                {r.status === 'SNOOZED' && <Text variant="labelSmall" style={{ marginLeft: 8, color: theme.colors.primary }}>(Snoozed)</Text>}
              </View>
            </View>
            
            <View style={{ flexDirection: 'row' }}>
              {!isCompleted && (
                <IconButton 
                  icon="check-circle-outline" 
                  iconColor={theme.colors.primary}
                  size={20}
                  onPress={() => updateReminderStatus(r.id, 'COMPLETED')}
                />
              )}
              {!isCompleted && (
                <IconButton 
                  icon="alarm-snooze" 
                  iconColor={theme.colors.onSurfaceVariant}
                  size={20}
                  onPress={() => {
                    const newDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Snooze 1 day
                    updateReminderStatus(r.id, 'SNOOZED', newDate);
                  }}
                />
              )}
              <IconButton 
                icon="delete-outline" 
                iconColor={theme.colors.error}
                size={20}
                onPress={() => deleteReminder(r.id)}
              />
            </View>
          </Surface>
          {i < reminders.length - 1 && <Divider />}
        </View>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Notification Center" />
        <Appbar.Action icon="cog" onPress={() => (router as any).push('/settings/notifications')} />
        {tab === 'notifications' && <Appbar.Action icon="check-all" onPress={markAllRead} />}
      </Appbar.Header>

      <View style={styles.segmentContainer}>
        <SegmentedButtons
          value={tab}
          onValueChange={setTab}
          buttons={[
            { value: 'notifications', label: 'Alerts' },
            { value: 'reminders', label: 'Reminders' },
          ]}
        />
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tab === 'notifications' ? renderNotifications() : renderReminders()}
        <View style={{ height: 80 }} />
      </ScrollView>

      {tab === 'reminders' && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => (router as any).push('/reminders/new')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segmentContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  item: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 16 },
  empty: { padding: 40, alignItems: 'center', marginTop: 40 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});
