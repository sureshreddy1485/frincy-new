import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import Constants from 'expo-constants';

// Use Render URL for backend, or fallback to local if needed
const host = Constants.expoConfig?.hostUri?.split(':')[0] || '10.0.2.2';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://frincy-new.onrender.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const { logout } = useAuthStore.getState();
      
      // We haven't built a refresh token route yet, so we just logout on 401.
      // In a full system, you would call /api/v1/auth/refresh here first.
      await logout();
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);
