import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'app-storage' });

const zustandStorage = {
  setItem: (name: string, value: string) => {
    return storage.set(name, value);
  },
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

interface BusinessContext {
  id: string;
  name: string;
  currency: string;
}

export type ThemeName = 'classic-light' | 'soft-slate' | 'warm-cream' | 'classic-dark' | 'midnight-navy' | 'graphite';

interface AppState {
  isDarkMode: boolean;
  activeTheme: ThemeName;
  currentBusiness: BusinessContext | null;
  toggleDarkMode: () => void;
  setTheme: (theme: ThemeName) => void;
  setCurrentBusiness: (business: BusinessContext | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      activeTheme: 'classic-light',
      currentBusiness: null,
      toggleDarkMode: () => set((state) => ({ 
        isDarkMode: !state.isDarkMode,
        activeTheme: !state.isDarkMode ? 'classic-dark' : 'classic-light' 
      })),
      setTheme: (theme) => set({ 
        activeTheme: theme, 
        isDarkMode: ['classic-dark', 'midnight-navy', 'graphite'].includes(theme) 
      }),
      setCurrentBusiness: (business) => set({ currentBusiness: business }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
