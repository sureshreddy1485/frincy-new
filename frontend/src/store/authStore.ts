import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

interface User {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt?: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isRememberMe: boolean;
  isLoading: boolean;
  
  setAuth: (user: User, accessToken: string, refreshToken: string, isRememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isRememberMe: false,
  isLoading: true, // true on mount to show splash

  setAuth: async (user, accessToken, refreshToken, isRememberMe) => {
    if (isRememberMe) {
      await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
      await SecureStore.setItemAsync('access_token', accessToken);
      await SecureStore.setItemAsync('refresh_token', refreshToken);
    }
    
    set({ user, accessToken, refreshToken, isRememberMe, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_user');
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    
    set({ user: null, accessToken: null, refreshToken: null, isRememberMe: false, isLoading: false });
    router.replace('/auth/login');
  },

  restoreSession: async () => {
    try {
      const storedUser = await SecureStore.getItemAsync('auth_user');
      const accessToken = await SecureStore.getItemAsync('access_token');
      const refreshToken = await SecureStore.getItemAsync('refresh_token');

      if (storedUser && accessToken && refreshToken) {
        set({
          user: JSON.parse(storedUser),
          accessToken,
          refreshToken,
          isRememberMe: true,
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  }
}));
