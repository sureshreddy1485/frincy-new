import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'notification-settings-storage' });

const zustandStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.remove(name),
};

interface NotificationSettingsState {
  notificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  smartRemindersEnabled: boolean;
  
  toggleNotifications: () => void;
  toggleQuietHours: () => void;
  toggleSmartReminders: () => void;
}

export const useNotificationStore = create<NotificationSettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      quietHoursEnabled: false,
      smartRemindersEnabled: true,

      toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
      toggleQuietHours: () => set((state) => ({ quietHoursEnabled: !state.quietHoursEnabled })),
      toggleSmartReminders: () => set((state) => ({ smartRemindersEnabled: !state.smartRemindersEnabled })),
    }),
    {
      name: 'notification-settings',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
