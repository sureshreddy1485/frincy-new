import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, useTheme, List, Switch, Divider, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '../../src/store/notificationStore';
import { NotificationScheduler } from '../../src/notifications/notificationScheduler';

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const { 
    notificationsEnabled, toggleNotifications,
    quietHoursEnabled, toggleQuietHours,
    smartRemindersEnabled, toggleSmartReminders
  } = useNotificationStore();

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Request permissions if turning on
      const hasPermission = await NotificationScheduler.requestPermissions();
      if (!hasPermission) {
        alert("Push notifications are disabled in your OS settings. Please enable them.");
        return;
      }
    } else {
      // Clear all if turning off
      await NotificationScheduler.cancelAll();
    }
    toggleNotifications();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Notification Settings" />
      </Appbar.Header>

      <ScrollView>
        <List.Section>
          <List.Subheader>General</List.Subheader>
          <List.Item
            title="Enable Notifications"
            description="Allow push notifications for reminders and alerts."
            left={p => <List.Icon {...p} icon="bell" />}
            right={() => <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Smart Engine</List.Subheader>
          <List.Item
            title="Smart Reminders"
            description="Automatically generate reminders for customers with overdue balances."
            left={p => <List.Icon {...p} icon="robot" />}
            right={() => <Switch value={smartRemindersEnabled} onValueChange={toggleSmartReminders} disabled={!notificationsEnabled} />}
          />
          <List.Item
            title="Quiet Hours"
            description="Defer non-critical notifications between 10:00 PM and 7:00 AM."
            left={p => <List.Icon {...p} icon="weather-night" />}
            right={() => <Switch value={quietHoursEnabled} onValueChange={toggleQuietHours} disabled={!notificationsEnabled} />}
          />
        </List.Section>

        <View style={{ padding: 24 }}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            All notifications are processed securely offline on your device.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
