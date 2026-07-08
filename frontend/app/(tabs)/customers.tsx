import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Searchbar, FAB, List, Dialog, Portal, TextInput, Button, IconButton } from 'react-native-paper';
import { customerService } from '../../src/services/customer.service';
import { customerGroupService } from '../../src/services/customerGroup.service';
import { Customer, CustomerGroup } from '../../src/database/models';
import { CustomerCard } from '../../src/components/CustomerCard';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBusinessStore } from '../../src/store/businessStore';

export default function CustomersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeBusinessId, activeBusinessRole } = useBusinessStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const load = async () => {
        if (!activeBusinessId) return;
        const groupData = await customerGroupService.getGroups(activeBusinessId);
        
        let allCustomers: Customer[] = [];
        
        // Fetch customers for each accessible group
        await Promise.all(
          groupData.map(async (g) => {
            try {
              const custs = await customerService.getActiveCustomers(activeBusinessId, g.id, searchQuery);
              allCustomers = [...allCustomers, ...custs];
            } catch (e) {
              // Ignore errors for folders they might not have access to if any slip through
            }
          })
        );
        

        if (isMounted) {
          setCustomers(allCustomers);
          setGroups(groupData.sort((a, b) => a.name.localeCompare(b.name)));
        }
      };
      load();
      return () => { isMounted = false; };
    }, [searchQuery, activeBusinessId])
  );

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !activeBusinessId) return;
    try {
      const newGroup = await customerGroupService.create({
        businessId: activeBusinessId,
        name: newFolderName.trim(),
        description: ''
      });
      setGroups(prev => [...prev, newGroup].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateDialogVisible(false);
      setNewFolderName('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {!activeBusinessId ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            No business selected.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Searchbar
              placeholder="Search customers or folders"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={[styles.searchBar, { backgroundColor: theme.colors.elevation.level2 }]}
            />
            {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && (
              <IconButton 
                icon="folder-plus" 
                mode="contained-tonal"
                onPress={() => setCreateDialogVisible(true)}
              />
            )}
      </View>

      {groups.length === 0 && !searchQuery ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            No folders found.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {groups.map(group => {
            const groupCustomers = customers.filter(c => c.groupId === group.id || (!c.groupId && group.id === 'uncategorized'));
            if (groupCustomers.length === 0 && group.id === 'uncategorized') return null;
            const totalBalance = groupCustomers.reduce((acc, curr) => acc + (curr.balance || 0), 0);

            return (
              <List.Item
                key={group.id}
                title={group.name}
                description={`${groupCustomers.length} customers`}
                left={props => <List.Icon {...props} icon="folder" color={theme.colors.primary} />}
                right={props => (
                  <View style={{ justifyContent: 'center' }}>
                    <Text variant="titleMedium" style={{ color: totalBalance >= 0 ? theme.colors.primary : theme.colors.error, marginRight: 16 }}>
                      ₹{totalBalance.toFixed(2)}
                    </Text>
                  </View>
                )}
                onPress={() => router.push(`/folders/${group.id}`)}
                style={{ backgroundColor: theme.colors.surface, marginHorizontal: 16, marginVertical: 4, borderRadius: 8 }}
              />
            );
          })}
        </ScrollView>
      )}

      {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && (
        <FAB
          icon="account-plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => router.push('/customers/add')}
        />
      )}

      <Portal>
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Create New Folder</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Folder Name"
              mode="outlined"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateFolder}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
