import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Appbar, List, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function FolderActivityScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Mock activity until we wire up edit_history fetching
  const activityLogs = [
    { id: '1', user: 'Owner', action: 'Created Folder', time: '2 days ago', icon: 'folder-plus' },
    { id: '2', user: 'Owner', action: 'Added Member (test@example.com)', time: '1 day ago', icon: 'account-plus' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Folder Activity" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.surface} elevation={1}>
          {activityLogs.map((log, i) => (
            <List.Item
              key={log.id}
              title={log.action}
              description={`${log.user} • ${log.time}`}
              left={props => <List.Icon {...props} icon={log.icon} />}
              style={i < activityLogs.length - 1 ? styles.divider : undefined}
            />
          ))}
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  surface: { borderRadius: 12, overflow: 'hidden' },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
});
