import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, useTheme, Appbar, FAB, Surface, IconButton, Menu, Button } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { customerService } from '../../src/services/customer.service';
import { transactionService } from '../../src/services/transaction.service';
import { ledgerRepository } from '../../src/repository/ledger.repository';
import { Customer, Ledger, Transaction } from '../../src/database/models';
import { TransactionCard } from '../../src/components/TransactionCard';
import { AddTransactionDialog } from '../../src/components/AddTransactionDialog';
import { generateLedgerPDF } from '../../src/utils/pdfGenerator';
import { Avatar } from 'react-native-paper';
import { database } from '../../src/database';
import { reminders, users } from '../../src/database/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { Image } from 'expo-image';

import { useBusinessStore } from '../../src/store/businessStore';
import { CustomAlert } from '../../src/providers/AlertProvider';


const AnyFlashList = FlashList as any;

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { activeBusinessId, activeBusinessRole } = useBusinessStore();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [runningBalance, setRunningBalance] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);
  const [upcomingReminder, setUpcomingReminder] = useState<any>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  
  const [addTxVisible, setAddTxVisible] = useState(false);
  const [addTxType, setAddTxType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 350);
    return () => clearTimeout(t);
  }, []);

  const loadData = async () => {
    if (!ledger || !activeBusinessId) return;
    const data = await transactionService.getTransactions(ledger.businessId, customer!.groupId || '', ledger.id);
    const balance = await transactionService.getRunningBalance(ledger.businessId, customer!.groupId || '', ledger.id);
    
    // Calculate Total Gave and Total Got
    const reminderRes = await database.select().from(reminders)
      .where(and(eq(reminders.relatedId, customer!.id), eq(reminders.status, 'PENDING')))
      .limit(1);

    setTransactions(data);
    setRunningBalance(balance);
    if (reminderRes.length > 0) setUpcomingReminder(reminderRes[0]);

    // Fetch user names for updatedBy
    const userIds = new Set<string>();
    if (customer?.updatedBy) userIds.add(customer.updatedBy);
    data.forEach(t => { if (t.updatedBy) userIds.add(t.updatedBy); });
    
    if (userIds.size > 0) {
      const usersData = await database.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, Array.from(userIds)));
      const map: Record<string, string> = {};
      usersData.forEach(u => {
        map[u.id] = u.name || u.email || 'Unknown User';
      });
      setUserMap(map);
    }
  };

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const cust = await customerService.getById(id as string);
        if (!cust) throw new Error('Not found');
        setCustomer(cust);

        // Find the ledger for this customer
        const allLedgers = await ledgerRepository.getActiveLedgers(cust.businessId, cust.groupId || '');
        const custLedger = allLedgers.find(l => l.customerId === cust.id);
        if (custLedger) {
          setLedger(custLedger);
        }
      } catch (error) {
        CustomAlert.alert('Error', 'Customer not found.');
        router.back();
      }
    };
    loadCustomer();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (!ledger) return;

      const task = setTimeout(() => {
        let isM = true;
        loadData().then(() => {
          if (!isM) return;
        });
        return () => { isM = false; }
      }, 0);
      return () => { 
        clearTimeout(task);
      };
    }, [ledger, customer])
  );

  const handleDelete = () => {
    CustomAlert.alert('Delete Customer', 'Are you sure you want to delete this customer? All their transactions will be soft-deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          if (!customer || !activeBusinessId) return;
          try {
            await customerService.deleteCustomer(activeBusinessId, customer.id);
            router.back();
          } catch (e: any) {
            CustomAlert.alert('Error', e.message || 'Failed to delete customer');
          }
        }
      }
    ]);
  };

  const toggleSelection = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) ? prev.filter(id => id !== transactionId) : [...prev, transactionId]
    );
  };

  const handleTransactionPress = (transaction: Transaction) => {
    if (selectedTransactions.length > 0) {
      toggleSelection(transaction.id);
    } else {
      router.push(`/transactions/${transaction.id}?ledgerId=${ledger?.id}`);
    }
  };

  const handleTransactionLongPress = (transaction: Transaction) => {
    if (activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') {
      toggleSelection(transaction.id);
    }
  };

  const handleDeleteSelected = () => {
    CustomAlert.alert('Delete Transactions', `Are you sure you want to delete ${selectedTransactions.length} transactions?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await Promise.all(selectedTransactions.map(id => transactionService.deleteTransaction(id)));
            setTransactions(prev => prev.filter(t => !selectedTransactions.includes(t.id)));
            setSelectedTransactions([]);
            // Reload running balance
            const balance = await transactionService.getRunningBalance(ledger!.businessId, customer!.groupId || '', ledger!.id);
            setRunningBalance(balance);
          } catch (e: any) {
            CustomAlert.alert('Error', e.message || 'Failed to delete transactions');
          }
        }
      }
    ]);
  };

  const handleExportPDF = () => {
    if (customer && transactions) {
      generateLedgerPDF(customer, transactions, runningBalance);
    }
  };

  if (!isReady || !customer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
      </View>
    );
  }

  const totalGave = transactions.filter(t => ['EXPENSE', 'GAVE'].includes(t.type)).reduce((acc, t) => acc + t.amount, 0);
  const totalGot = transactions.filter(t => ['INCOME', 'GOT'].includes(t.type)).reduce((acc, t) => acc + t.amount, 0);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {selectedTransactions.length > 0 ? (
          <Appbar.Header style={{ backgroundColor: theme.colors.primaryContainer }}>
            <Appbar.Action icon="close" iconColor={theme.colors.onPrimaryContainer} onPress={() => setSelectedTransactions([])} />
            <Appbar.Content title={`${selectedTransactions.length} selected`} titleStyle={{ color: theme.colors.onPrimaryContainer }} />
            <Appbar.Action icon="delete" iconColor={theme.colors.onPrimaryContainer} onPress={handleDeleteSelected} />
          </Appbar.Header>
        ) : (
          <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title={customer.name} subtitle={customer.updatedBy && userMap[customer.updatedBy] ? `Updated by ${userMap[customer.updatedBy]}` : undefined} />
            
            {/* Export available to OWNER and MANAGER */}
            {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && (
              <Appbar.Action icon="file-pdf-box" onPress={handleExportPDF} color={theme.colors.primary} />
            )}

            {/* Reminder available to OWNER and MANAGER */}
            {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && (
              <Appbar.Action icon="bell-plus" onPress={() => router.push(`/customers/reminder?customerId=${customer.id}`)} />
            )}
            
            {/* Edit available to OWNER, MANAGER, WORKER */}
            {activeBusinessRole !== 'VIEWER' && (
              <Appbar.Action icon="pencil" onPress={() => router.push(`/customers/edit?id=${customer.id}`)} />
            )}

            {/* Delete available to OWNER and MANAGER */}
            {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && (
              <Appbar.Action icon="delete" color={theme.colors.error} onPress={handleDelete} />
            )}
          </Appbar.Header>
        )}

        <Surface style={[styles.headerSurface, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
          {customer.avatarUrl ? (
            <Image 
              source={{ uri: customer.avatarUrl }} 
              style={{ width: 48, height: 48, borderRadius: 24, marginBottom: 8 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <Avatar.Text 
              size={48} 
              label={(customer.name || 'C').slice(0, 2).toUpperCase()} 
              style={{ backgroundColor: theme.colors.primary, marginBottom: 8 }}
              labelStyle={{ color: theme.colors.onPrimary }}
            />
          )}
          {customer.phone && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.8, marginBottom: 8 }}>
              {customer.phone}
            </Text>
          )}

          <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>Current Balance</Text>
          <Text variant="headlineMedium" style={{ color: runningBalance >= 0 ? theme.colors.primary : theme.colors.error, fontWeight: 'bold' }}>
            ₹{Math.abs(runningBalance).toFixed(2)} {runningBalance >= 0 ? '(Cr)' : '(Dr)'}
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>Total Gave</Text>
              <Text variant="titleSmall" style={{ color: theme.colors.error, fontWeight: 'bold' }}>₹{totalGave.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>Transactions</Text>
              <Text variant="titleSmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>{transactions.length}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>Total Got</Text>
              <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>₹{totalGot.toFixed(2)}</Text>
            </View>
          </View>

          {ledger && (activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button 
                mode="contained" 
                icon="arrow-down-left" 
                onPress={() => { setAddTxType('INCOME'); setAddTxVisible(true); }}
                style={{ flex: 1, backgroundColor: theme.colors.primary }}
              >
                Got
              </Button>
              <Button 
                mode="contained" 
                icon="arrow-up-right" 
                onPress={() => { setAddTxType('EXPENSE'); setAddTxVisible(true); }}
                style={{ flex: 1, backgroundColor: theme.colors.error }}
              >
                Gave
              </Button>
            </View>
          )}

          {upcomingReminder && (
            <View style={{ marginTop: 8, backgroundColor: theme.colors.secondaryContainer, padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
              <IconButton icon="bell-ring" size={20} iconColor={theme.colors.onSecondaryContainer} style={{ margin: 0 }} />
              <View style={{ marginLeft: 8 }}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSecondaryContainer }}>Upcoming Reminder</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer, opacity: 0.8 }}>
                  {new Date(upcomingReminder.dueDate * 1000).toLocaleString()} - {upcomingReminder.title}
                </Text>
              </View>
            </View>
          )}
        </Surface>

        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              No transactions found.
            </Text>
          </View>
        ) : (
          <AnyFlashList
            data={transactions}
            renderItem={({ item, index }: any) => (
              <TransactionCard 
                transaction={item} 
                index={index} 
                onPress={() => handleTransactionPress(item)} 
                onLongPress={() => handleTransactionLongPress(item)}
                selected={selectedTransactions.includes(item.id)}
                updaterName={item.updatedBy ? userMap[item.updatedBy] : undefined}
              />
            )}
            keyExtractor={(item: any) => item.id}
            estimatedItemSize={80}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}

        {ledger && activeBusinessId && (
          <AddTransactionDialog
            visible={addTxVisible}
            onDismiss={() => setAddTxVisible(false)}
            ledgerId={ledger.id}
            initialType={addTxType}
            activeBusinessId={activeBusinessId}
            onSuccess={() => {
              loadData(); // Refresh list on success
            }}
          />
        )}

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSurface: { padding: 16, margin: 12, borderRadius: 16, alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', marginTop: 8, width: '100%', justifyContent: 'space-around', alignItems: 'center' },
  statBox: { alignItems: 'center' },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.1)' }
});
