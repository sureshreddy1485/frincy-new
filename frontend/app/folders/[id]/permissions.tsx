import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Appbar, List, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function FolderPermissionsScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Role Permissions Map" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.surface} elevation={1}>
          <List.Item
            title="MANAGER"
            description="Can CREATE, EDIT, and VIEW all data inside this folder. Cannot DELETE records."
            left={props => <List.Icon {...props} icon="shield-star" />}
            titleStyle={{ fontWeight: 'bold' }}
            descriptionNumberOfLines={3}
            style={styles.divider}
          />
          <List.Item
            title="WORKER"
            description="Can EDIT and VIEW existing data. Cannot CREATE new customers/transactions, and cannot DELETE."
            left={props => <List.Icon {...props} icon="shield-half-full" />}
            titleStyle={{ fontWeight: 'bold' }}
            descriptionNumberOfLines={3}
            style={styles.divider}
          />
          <List.Item
            title="VIEWER"
            description="Read-only mode. Can view ledgers and reports but cannot modify any data."
            left={props => <List.Icon {...props} icon="shield-outline" />}
            titleStyle={{ fontWeight: 'bold' }}
            descriptionNumberOfLines={3}
          />
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
