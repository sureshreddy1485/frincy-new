import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { withLayoutContext } from 'expo-router';
import {
  createNavigatorFactory,
  useNavigationBuilder,
  TabRouter,
} from 'expo-router/build/react-navigation/native';

function CustomTabNavigator({
  initialRouteName,
  children,
  screenOptions,
}: any) {
  const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(TabRouter, {
    initialRouteName,
    children,
    screenOptions,
  });

  const pagerRef = useRef<PagerView>(null);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Lazy load screens to prevent 1-second delay
  const [loaded, setLoaded] = useState<number[]>([state.index]);
  if (!loaded.includes(state.index)) {
    setLoaded([...loaded, state.index]);
  }

  const isTapping = useRef(false);

  // Synchronize state index with pager view when navigation happens externally (e.g., deep links, back button)
  useEffect(() => {
    if (!isTapping.current) {
      pagerRef.current?.setPageWithoutAnimation(state.index);
    }
    isTapping.current = false;
  }, [state.index]);

  return (
    <NavigationContent>
      <View style={styles.container}>
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={state.index}
          onPageSelected={(e) => {
            const index = e.nativeEvent.position;
            if (index !== state.index) {
              const route = state.routes[index];
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!(event as any).defaultPrevented) {
                navigation.navigate(route.name);
              }
            }
          }}
        >
          {state.routes.map((route, i) => {
            const descriptor = descriptors[route.key];
            const isLoaded = loaded.includes(i);
            
            return (
              <View key={route.key} style={styles.page}>
                {isLoaded ? descriptor.render() : <View style={{ flex: 1, backgroundColor: theme.colors.background }} />}
              </View>
            );
          })}
        </PagerView>

        <View 
          style={[
            styles.tabBar, 
            { 
              backgroundColor: theme.colors.surface, 
              paddingBottom: Math.max(insets.bottom, 4), 
              height: 65 + Math.max(insets.bottom, 0),
              borderTopColor: theme.colors.surfaceVariant
            }
          ]}
        >
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            const options = descriptor.options;
            const label = options.title !== undefined ? options.title : route.name;
            const isFocused = state.index === index;
            
            const color = isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant;

            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !(event as any).defaultPrevented) {
                    isTapping.current = true;
                    navigation.navigate(route.name);
                    // Force instant jump as requested: "Tap any tab to jump instantly without showing intermediate tabs."
                    pagerRef.current?.setPageWithoutAnimation(index);
                  }
                }}
                style={styles.tabItem}
                android_ripple={{ color: theme.colors.surfaceVariant, radius: 40, borderless: true }}
              >
                {options.tabBarIcon ? options.tabBarIcon({ color }) : <MaterialCommunityIcons name="circle" size={24} color={color} />}
                <Text style={{ color, fontSize: 11, marginTop: 4, fontWeight: isFocused ? '600' : '400' }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </NavigationContent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    elevation: 8,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  }
});

const { Navigator } = createNavigatorFactory(CustomTabNavigator)();

const CustomTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  return (
    <CustomTabs>
      <CustomTabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <MaterialCommunityIcons name="home" size={24} color={color} />,
        }}
      />
      <CustomTabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color }: { color: string }) => <MaterialCommunityIcons name="account-group" size={24} color={color} />,
        }}
      />
      <CustomTabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }: { color: string }) => <MaterialCommunityIcons name="chart-bar" size={24} color={color} />,
        }}
      />
      <CustomTabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }: { color: string }) => <MaterialCommunityIcons name="cog" size={24} color={color} />,
        }}
      />
    </CustomTabs>
  );
}
