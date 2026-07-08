import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Appbar, List, FAB, Avatar, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useBusinessStore } from '../../src/store/businessStore';

export default function BusinessSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { businessesList, activeBusinessId } = useBusinessStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Business Settings" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
          Your Businesses ({businessesList.length})
        </Text>
        
        {businessesList.map((biz) => (
          <List.Item
            key={biz.id}
            title={biz.name}
            description="Tap to manage profile & members"
            left={() => (
              <Avatar.Text 
                size={40} 
                label={biz.name.slice(0, 2).toUpperCase()} 
                style={{ 
                  backgroundColor: biz.id === activeBusinessId ? theme.colors.primary : theme.colors.secondaryContainer,
                  marginLeft: 16,
                  marginTop: 8
                }}
              />
            )}
            right={(props) => (
              <IconButton 
                {...props} 
                icon="pencil" 
                onPress={() => router.push(`/businesses/edit?id=${biz.id}`)}
              />
            )}
            onPress={() => router.push(`/businesses/edit?id=${biz.id}`)}
            style={{ 
              backgroundColor: theme.colors.surface, 
              borderRadius: 12, 
              marginBottom: 12,
              borderWidth: biz.id === activeBusinessId ? 1 : 0,
              borderColor: theme.colors.primary,
            }}
          />
        ))}

        {businessesList.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>No businesses found.</Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => router.push('/businesses/create')}
        label="Create Business"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 48 },
});
