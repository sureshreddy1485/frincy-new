import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, InteractionManager } from 'react-native';
import { Text, useTheme, Appbar, FAB } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Menu, IconButton, Dialog, Portal, TextInput, Button } from 'react-native-paper';
import { customerService } from '../../src/services/customer.service';
import { customerGroupService } from '../../src/services/customerGroup.service';
import { customerGroupRepository } from '../../src/repository/customerGroup.repository';
import { Customer, CustomerGroup } from '../../src/database/models';
import { CustomerCard } from '../../src/components/CustomerCard';
import { useBusinessStore } from '../../src/store/businessStore';
import { database } from '../../src/database';
import { users } from '../../src/database/schema';
import { inArray } from 'drizzle-orm';
import { CustomAlert } from '../../src/providers/AlertProvider';


const AnyFlashList = FlashList as any;

export default function FolderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { activeBusinessId, activeBusinessRole } = useBusinessStore();

  const [group, setGroup] = useState<CustomerGroup | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const load = async () => {
        if (!activeBusinessId) return;
        // Load group
        if (id === 'uncategorized') {
          if (isMounted) setGroup({ id: 'uncategorized', businessId: activeBusinessId, name: 'Uncategorized', createdAt: 0, updatedAt: 0, syncStatus: 0, version: 1, serverId: null, deviceId: null, updatedBy: null, deletedAt: null, description: null });
        } else {
          const groupData = await customerGroupService.getGroups(activeBusinessId);
          const found = groupData.find(g => g.id === id);
          if (found && isMounted) setGroup(found);
        }

        // Load customers
        if (isMounted) {
          let fetchedCusts: Customer[] = [];
          if (id === 'uncategorized') {
            const defaultGroup = await customerGroupRepository.getOrCreateUncategorized(activeBusinessId);
            fetchedCusts = await customerService.getActiveCustomers(activeBusinessId, defaultGroup.id);
          } else {
            fetchedCusts = await customerService.getActiveCustomers(activeBusinessId, id as string);
          }
          setCustomers(fetchedCusts);

          // Fetch user names for updatedBy
          const userIds = new Set<string>();
          if (group && group.updatedBy) userIds.add(group.updatedBy);
          fetchedCusts.forEach(c => { if (c.updatedBy) userIds.add(c.updatedBy); });
          
          if (userIds.size > 0) {
            const usersData = await database.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, Array.from(userIds)));
            const map: Record<string, string> = {};
            usersData.forEach(u => {
              map[u.id] = u.name || u.email || 'Unknown User';
            });
            setUserMap(map);
          }
        }
      };
      const task = InteractionManager.runAfterInteractions(() => {
        load();
      });
      return () => { 
        isMounted = false; 
        task.cancel();
      };
    }, [id, activeBusinessId, group?.updatedBy])
  );

  if (!activeBusinessId) return null;

  const totalBalance = customers.reduce((acc, curr) => acc + (curr.balance || 0), 0);

  const handleRename = async () => {
    if (!renameValue.trim() || !group || group.id === 'uncategorized') return;
    try {
      await customerGroupService.update(group.id, { name: renameValue.trim() });
      setGroup({ ...group, name: renameValue.trim() });
      setEditDialogVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = () => {
    if (!group || group.id === 'uncategorized') return;
    CustomAlert.alert('Delete Folder', 'Are you sure you want to delete this folder?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await customerGroupService.deleteGroup(activeBusinessId, group.id);
            router.back();
          } catch (e: any) {
            CustomAlert.alert('Error', e.message || 'Failed to delete folder');
          }
        }
      }
    ]);
  };

  const toggleSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
    );
  };

  const handleCustomerPress = (customerId: string) => {
    if (selectedCustomers.length > 0) {
      toggleSelection(customerId);
    } else {
      router.push(`/customers/${customerId}`);
    }
  };

  const handleCustomerLongPress = (customerId: string) => {
    if (activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') {
      toggleSelection(customerId);
    }
  };

  const handleDeleteSelected = () => {
    CustomAlert.alert('Delete Customers', `Are you sure you want to delete ${selectedCustomers.length} customers?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await Promise.all(selectedCustomers.map(id => customerService.deleteCustomer(activeBusinessId, id)));
            setCustomers(prev => prev.filter(c => !selectedCustomers.includes(c.id)));
            setSelectedCustomers([]);
          } catch (e: any) {
            CustomAlert.alert('Error', e.message || 'Failed to delete customers');
          }
        }
      }
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {selectedCustomers.length > 0 ? (
          <Appbar.Header style={{ backgroundColor: theme.colors.primaryContainer }}>
            <Appbar.Action icon="close" iconColor={theme.colors.onPrimaryContainer} onPress={() => setSelectedCustomers([])} />
            <Appbar.Content title={`${selectedCustomers.length} selected`} titleStyle={{ color: theme.colors.onPrimaryContainer }} />
            <Appbar.Action icon="delete" iconColor={theme.colors.onPrimaryContainer} onPress={handleDeleteSelected} />
          </Appbar.Header>
        ) : (
          <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title={group ? group.name : 'Folder'} subtitle={group?.updatedBy && userMap[group.updatedBy] ? `Updated by ${userMap[group.updatedBy]}` : undefined} />
            {id !== 'uncategorized' && (
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
              >
                <Menu.Item 
                  leadingIcon="pencil" 
                  onPress={() => { 
                    setMenuVisible(false); 
                    setRenameValue(group?.name || '');
                    setEditDialogVisible(true);
                  }} 
                  title="Edit Folder Name" 
                />
                {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && (
                  <Menu.Item 
                    leadingIcon="account-group" 
                    onPress={() => { 
                      setMenuVisible(false); 
                      router.push(`/folders/${id}/members`);
                    }} 
                    title="Folder Members" 
                  />
                )}
                {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && (
                  <Menu.Item 
                    leadingIcon="delete" 
                    onPress={() => { 
                      setMenuVisible(false); 
                      handleDelete();
                    }} 
                    title="Delete Folder" 
                  />
                )}
              </Menu>
            )}
          </Appbar.Header>
        )}

        <View style={styles.headerStats}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>Folder Total Balance</Text>
          <Text variant="headlineLarge" style={{ color: totalBalance >= 0 ? theme.colors.primary : theme.colors.error, fontWeight: 'bold' }}>
            ₹{totalBalance.toFixed(2)}
          </Text>
        </View>

        {customers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              No customers in this folder.
            </Text>
          </View>
        ) : (
          <AnyFlashList
            data={customers}
            renderItem={({ item, index }: any) => (
              <CustomerCard 
                customer={item} 
                index={index} 
                onPress={() => handleCustomerPress(item.id)} 
                onLongPress={() => handleCustomerLongPress(item.id)}
                selected={selectedCustomers.includes(item.id)}
                updaterName={item.updatedBy ? userMap[item.updatedBy] : undefined}
              />
            )}
            keyExtractor={(item: any) => item.id}
            estimatedItemSize={80}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}

        <FAB
          icon="account-plus"
          style={styles.fab}
          color={theme.colors.onPrimary}
          onPress={() => router.push(`/customers/add?groupId=${id === 'uncategorized' ? '' : id}`)}
        />
        
        <Portal>
          <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
            <Dialog.Title>Rename Folder</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Folder Name"
                mode="flat"
                style={{ backgroundColor: 'transparent' }}
                value={renameValue}
                onChangeText={setRenameValue}
                autoFocus
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
              <Button onPress={handleRename}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerStats: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6750A4', // primary color fallback if dynamic not passed to style directly
  }
});
