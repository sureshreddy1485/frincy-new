import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder } from '../database/models';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationScheduler {
  /**
   * Request user permission for notifications (required on iOS and Android 13+)
   */
  static async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }

    return finalStatus === 'granted';
  }

  /**
   * Schedule a local push notification for a specific reminder
   */
  static async scheduleReminder(reminder: Reminder, quietHoursEnabled = false): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    let triggerDate = new Date(reminder.dueDate * 1000);
    
    // Prevent scheduling in the past
    if (triggerDate.getTime() <= Date.now()) {
      // If it's already due, fire it within 10 seconds (useful for smart reminders created retroactively)
      triggerDate = new Date(Date.now() + 10000); 
    }

    // Apply quiet hours logic (e.g., if between 10 PM and 7 AM, defer to 8 AM)
    if (quietHoursEnabled) {
      const hour = triggerDate.getHours();
      if (hour >= 22 || hour < 7) {
        triggerDate.setHours(8, 0, 0, 0);
        if (hour >= 22) triggerDate.setDate(triggerDate.getDate() + 1);
      }
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Upcoming Reminder',
        body: reminder.title,
        data: { reminderId: reminder.id, businessId: reminder.businessId },
        sound: true,
      },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate 
      },
    });

    return id;
  }

  /**
   * Cancel a scheduled notification (if reminder is deleted or completed)
   */
  static async cancelScheduledNotification(identifier: string) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  /**
   * Cancel all notifications (e.g. on logout)
   */
  static async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Send an immediate system notification (e.g., Sync Failed)
   */
  static async notifyNow(title: string, body: string, data = {}) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null, // null trigger means immediately
    });
  }
}
