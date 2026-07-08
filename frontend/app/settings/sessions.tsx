import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, List, useTheme, IconButton, Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/api/client';
import * as Device from 'expo-device';
import { CustomAlert } from '../../src/providers/AlertProvider';


interface Session {
  id: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  ipAddress: string;
  lastActiveAt: string;
}

export default function ActiveSessionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await apiClient.get('/auth/sessions');
      setSessions(res.data.data);
    } catch (e) {
      CustomAlert.alert('Error', 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogoutSession = (sessionId: string) => {
    CustomAlert.alert('Logout Session', 'Are you sure you want to log out this device?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/auth/sessions/${sessionId}`);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
          } catch (e) {
            CustomAlert.alert('Error', 'Failed to logout device');
          }
        }
      }
    ]);
  };

  const currentDeviceId = Device.osBuildId || Device.modelId || 'unknown_device';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Active Sessions" />
      </Appbar.Header>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView>
          {sessions.map((session) => {
            const isCurrent = session.deviceId === currentDeviceId;
            return (
              <List.Item
                key={session.id}
                title={`${session.deviceName || 'Unknown Device'} ${isCurrent ? '(This Device)' : ''}`}
                description={`Platform: ${session.platform || 'N/A'}\nLast Active: ${new Date(session.lastActiveAt).toLocaleString()}`}
                left={props => <List.Icon {...props} icon={isCurrent ? "cellphone-check" : "cellphone"} color={isCurrent ? theme.colors.primary : theme.colors.onSurfaceVariant} />}
                right={props => !isCurrent ? (
                  <IconButton {...props} icon="logout" iconColor={theme.colors.error} onPress={() => handleLogoutSession(session.id)} />
                ) : undefined}
                descriptionNumberOfLines={2}
                style={styles.listItem}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listItem: { borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }
});
