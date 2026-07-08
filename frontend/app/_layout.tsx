import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';

import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { themes } from '../src/theme/theme';
import { useAppStore } from '../src/store';
import { useAuthStore } from '../src/store/authStore';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { database } from '../src/database';
import migrations from '../drizzle/migrations';
import { AlertProvider } from '../src/providers/AlertProvider';
import { useBusinessStore } from '../src/store/businessStore';

import { useSyncManager } from '../src/sync/sync.manager';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {


  const { isDarkMode, activeTheme } = useAppStore();
  const { user, isLoading: isAuthLoading, restoreSession } = useAuthStore();
  const { success: migrationSuccess, error: migrationError } = useMigrations(database, migrations);
  const { loadBusinesses } = useBusinessStore();

  const isLoading = isAuthLoading || !migrationSuccess;
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const router = useRouter();
  
  // Initialize Background Sync
  useSyncManager();

  const isBootstrapped = React.useRef(false);

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (!isLoading && rootNavigationState?.key) {
      const inAuthGroup = segments[0] === 'auth';
      const inBusinessGroup = segments[0] === 'businesses';

      if (!user && !inAuthGroup) {
        // Redirect to login if not authenticated
        SplashScreen.hideAsync();
        setTimeout(() => router.replace('/auth/login'), 0);
      } else if (user) {
        // Bootstrap Flow
        const bootstrap = async () => {
          if (isBootstrapped.current) return;
          
          let businessesList = await loadBusinesses(user.id);

          SplashScreen.hideAsync();

          if (businessesList.length === 0 && !inBusinessGroup) {
            setTimeout(() => router.replace('/businesses/create'), 0);
          } else if (businessesList.length > 0 && (inAuthGroup || segments[0] === '(tabs)' && segments.length === 1 && segments[0] === undefined)) {
            // If we are in auth group and logged in, or we just loaded, go to tabs
            if (inAuthGroup) setTimeout(() => router.replace('/(tabs)'), 0);
          }
          isBootstrapped.current = true;
        };

        bootstrap();
      }
    }
  }, [isAuthLoading, migrationSuccess, user, segments, rootNavigationState?.key]);

  if (migrationError) {
    console.error('Migration failed:', migrationError);
    return null;
  }

  if (isLoading) {
    return null;
  }

  const paperTheme = themes[activeTheme] || themes['classic-light'];
  const navTheme = isDarkMode ? DarkTheme : DefaultTheme;

  return (
    <SafeAreaProvider>
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>
        <AlertProvider>
          <ThemeProvider value={navTheme}>
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 250 }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen name="auth/recovery" options={{ headerShown: false }} />
            <Stack.Screen name="auth/forgot" options={{ headerShown: false }} />
            <Stack.Screen name="businesses/create" options={{ headerShown: false }} />
            <Stack.Screen name="settings/security" options={{ headerShown: false }} />
            <Stack.Screen name="settings/sessions" options={{ headerShown: false }} />
            <Stack.Screen name="settings/sync" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ThemeProvider>
        </AlertProvider>
      </PaperProvider>
    </QueryClientProvider>
    </SafeAreaProvider>
  );
}
