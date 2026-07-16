import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Appbar, List, FAB, Avatar, IconButton, Checkbox } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useBusinessStore } from '../../src/store/businessStore';
import { businessRepository } from '../../src/repository/business.repository';
import { useAuthStore } from '../../src/store/authStore';
import { CustomAlert } from '../../src/providers/AlertProvider';
import { SyncService } from '../../src/sync/sync.service';

export default function BusinessSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { businessesList, activeBusinessId, loadBusinesses } = useBusinessStore();
  const { user } = useAuthStore();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelectionMode = selectedIds.length > 0;

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleMultiDelete = () => {
    CustomAlert.alert(
      'Delete Businesses',
      `Are you sure you want to delete ${selectedIds.length} businesses? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of selectedIds) {
                await businessRepository.delete(id);
              }
              setSelectedIds([]);
              if (user) {
                await loadBusinesses(user.id);
              }
              // Trigger background sync
              SyncService.runSync().catch(console.error);
            } catch (error: any) {
              CustomAlert.alert('Error', error.message || 'Failed to delete businesses');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        {isSelectionMode ? (
          <>
            <Appbar.Action icon="close" onPress={() => setSelectedIds([])} />
            <Appbar.Content title={`${selectedIds.length} Selected`} />
            <Appbar.Action icon="delete" onPress={handleMultiDelete} color={theme.colors.error} />
          </>
        ) : (
          <>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Business Settings" />
          </>
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
          Your Businesses ({businessesList.length})
        </Text>
        
        {businessesList.map((biz) => {
          const isSelected = selectedIds.includes(biz.id);
          return (
            <List.Item
              key={biz.id}
              title={biz.name}
              description="Tap to manage profile & members"
              left={() => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {isSelectionMode && (
                    <Checkbox.Android 
                      status={isSelected ? 'checked' : 'unchecked'} 
                      onPress={() => handleToggleSelect(biz.id)}
                    />
                  )}
                  <Avatar.Text 
                    size={40} 
                    label={biz.name.slice(0, 2).toUpperCase()} 
                    style={{ 
                      backgroundColor: biz.id === activeBusinessId ? theme.colors.primary : theme.colors.secondaryContainer,
                      marginLeft: isSelectionMode ? 0 : 16,
                      marginTop: 8
                    }}
                  />
                </View>
              )}
              right={(props) => (
                !isSelectionMode ? (
                  <IconButton 
                    {...props} 
                    icon="pencil" 
                    onPress={() => router.push(`/businesses/edit?id=${biz.id}`)}
                  />
                ) : null
              )}
              onPress={() => {
                if (isSelectionMode) {
                  handleToggleSelect(biz.id);
                } else {
                  router.push(`/businesses/edit?id=${biz.id}`);
                }
              }}
              onLongPress={() => {
                if (!isSelectionMode) {
                  handleToggleSelect(biz.id);
                }
              }}
              style={{ 
                backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surface, 
                borderRadius: 12, 
                marginBottom: 12,
                borderWidth: biz.id === activeBusinessId ? 1 : 0,
                borderColor: theme.colors.primary,
              }}
            />
          );
        })}

        {businessesList.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>No businesses found.</Text>
          </View>
        )}
      </ScrollView>

      {!isSelectionMode && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => router.push('/businesses/create')}
          label="Create Business"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 48 },
});
