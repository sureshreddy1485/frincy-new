import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/notification.service';
import { NotificationScheduler } from './notificationScheduler';
import { useNotificationStore } from '../store/notificationStore';
import { Reminder, Notification } from '../database/models';

export function useNotifications(businessId: string | null, userId: string | null) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { notificationsEnabled, smartRemindersEnabled, quietHoursEnabled } = useNotificationStore();
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (!businessId || !userId || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      if (smartRemindersEnabled) {
        await notificationService.generateSmartReminders(businessId);
      }

      const [loadedReminders, loadedNotifs] = await Promise.all([
        notificationService.getReminders(businessId),
        notificationService.getUserNotifications(userId),
      ]);

      setReminders(loadedReminders);
      setNotifications(loadedNotifs);

      // Re-schedule upcoming reminders (Expo notifications clears on reboot, 
      // best practice is to constantly ensure upcoming reminders are scheduled locally).
      if (notificationsEnabled) {
        const pending = loadedReminders.filter(r => r.status === 'PENDING');
        for (const r of pending) {
          // Pass the proper Date object since reminder.dueDate is now an integer timestamp in Drizzle
          const scheduledObj = {
            ...r,
            dueDate: new Date(r.dueDate * 1000)
          };
          // @ts-ignore - The scheduler still expects a Date object from WatermelonDB era, so we mock it.
          await NotificationScheduler.scheduleReminder(scheduledObj, quietHoursEnabled);
        }
      } else {
        await NotificationScheduler.cancelAll();
      }

    } catch (e) {
      console.error('Failed to load notifications/reminders:', e);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [businessId, userId, smartRemindersEnabled, notificationsEnabled, quietHoursEnabled]);

  useEffect(() => {
    load();
  }, [load]);

  const markNotificationRead = async (id: string) => {
    await notificationService.markNotificationAsRead(id);
    await load();
  };

  const markAllRead = async () => {
    if (!userId) return;
    await notificationService.markAllNotificationsAsRead(userId);
    await load();
  };

  const addReminder = async (title: string, dueDate: Date, relatedId?: string) => {
    if (!businessId) return;
    const r = await notificationService.addReminder(businessId, title, dueDate, relatedId);
    if (notificationsEnabled) {
      const scheduledObj = { ...r, dueDate: new Date(r.dueDate * 1000) };
      // @ts-ignore
      await NotificationScheduler.scheduleReminder(scheduledObj, quietHoursEnabled);
    }
    await load();
  };

  const updateReminderStatus = async (id: string, status: 'PENDING' | 'COMPLETED' | 'SNOOZED', newDate?: Date) => {
    await notificationService.updateReminderStatus(id, status, newDate);
    await load();
  };
  
  const deleteReminder = async (id: string) => {
    await notificationService.deleteReminder(id);
    await load();
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    reminders,
    notifications,
    loading,
    unreadCount,
    refresh: load,
    markNotificationRead,
    markAllRead,
    addReminder,
    updateReminderStatus,
    deleteReminder
  };
}
