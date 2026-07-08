import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, useTheme, Divider, IconButton } from 'react-native-paper';
import { UpcomingReminder } from '../../services/dashboard.service';
import { notificationService } from '../../services/notification.service';
import { useRouter } from 'expo-router';

interface Props {
  reminders: UpcomingReminder[];
  onRefresh?: () => void;
}

export const UpcomingReminders = React.memo(({ reminders, onRefresh }: Props) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="titleSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        Upcoming Reminders
      </Text>
      {reminders.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant, padding: 16, textAlign: 'center' }}>
          No upcoming reminders 🎉
        </Text>
      ) : (
        reminders.map((r, i) => (
          <View key={r.id}>
            <View style={styles.row}>
              {r.relatedId ? (
                <Surface
                  elevation={0}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    (router as any).push(`/customers/${r.relatedId}`);
                  }}
                >
                  <View style={[styles.badge, { backgroundColor: '#f59e0b20' }]}>
                    <Text style={{ fontSize: 16 }}>🔔</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Due: {new Date(r.dueDate * 1000).toLocaleDateString()}
                    </Text>
                  </View>
                </Surface>
              ) : (
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.badge, { backgroundColor: '#f59e0b20' }]}>
                    <Text style={{ fontSize: 16 }}>🔔</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Due: {new Date(r.dueDate * 1000).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={{ flexDirection: 'row' }}>
                <IconButton 
                  icon="check-circle-outline" 
                  size={20} 
                  iconColor={theme.colors.primary}
                  onPress={async () => {
                    await notificationService.updateReminderStatus(r.id, 'COMPLETED');
                    onRefresh?.();
                  }} 
                />
                <IconButton 
                  icon="delete-outline" 
                  size={20} 
                  iconColor={theme.colors.error}
                  onPress={async () => {
                    await notificationService.deleteReminder(r.id);
                    onRefresh?.();
                  }} 
                />
              </View>
            </View>
            {i < reminders.length - 1 && <Divider style={{ marginVertical: 4 }} />}
          </View>
        ))
      )}
    </Surface>
  );
});

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
});
