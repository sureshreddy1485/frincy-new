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
import { generateLedgerPDF } from '../../src/utils/pdfGenerator';
import { Avatar } from 'react-native-paper';
import { database } from '../../src/database';
import { reminders } from '../../src/database/schema';
import { eq, and } from 'drizzle-orm';
import { Image } from 'expo-image';

import { useBusinessStore } from '../../src/store/businessStore';
import { CustomAlert } from '../../src/providers/AlertProvider';


const AnyFlashList = FlashList as any;

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { activeBusinessRole } = useBusinessStore();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [runningBalance, setRunningBalance] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);
  const [upcomingReminder, setUpcomingReminder] = useState<any>(null);

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

      const loadData = async () => {
        const data = await transactionService.getTransactions(ledger.businessId, customer!.groupId || '', ledger.id);
        const balance = await transactionService.getRunningBalance(ledger.businessId, customer!.groupId || '', ledger.id);
        
        // Calculate Total Gave and Total Got
        const reminderRes = await database.select().from(reminders)
          .where(and(eq(reminders.relatedId, customer!.id), eq(reminders.status, 'PENDING')))
          .limit(1);

        if (isMounted) {
          setTransactions(data);
          setRunningBalance(balance);
          if (reminderRes.length > 0) setUpcomingReminder(reminderRes[0]);
        }
      };

      loadData();
      return () => { isMounted = false; };
    }, [ledger])
  );

  const handleDelete = () => {
    CustomAlert.alert('Delete Customer', 'Are you sure you want to delete this customer? All their transactions will be soft-deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          if (!customer) return;
          try {
            await customerService.delete(customer.id);
            if (ledger) await ledgerRepository.delete(ledger.id);
            router.back();
          } catch (e) {
            console.error(e);
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

  if (!customer) return null;

  const totalGave = transactions.filter(t => ['EXPENSE', 'GAVE'].includes(t.type)).reduce((acc, t) => acc + t.amount, 0);
  const totalGot = transactions.filter(t => ['INCOME', 'GOT'].includes(t.type)).reduce((acc, t) => acc + t.amount, 0);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={customer.name} />
          
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

          {/* Delete available to OWNER only */}
          {activeBusinessRole === 'OWNER' && (
            <Appbar.Action icon="delete" color={theme.colors.error} onPress={handleDelete} />
          )}
        </Appbar.Header>

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
                onPress={() => router.push(`/transactions/add?ledgerId=${ledger.id}&type=INCOME`)}
                style={{ flex: 1, backgroundColor: theme.colors.primary }}
              >
                Got
              </Button>
              <Button 
                mode="contained" 
                icon="arrow-up-right" 
                onPress={() => router.push(`/transactions/add?ledgerId=${ledger.id}&type=EXPENSE`)}
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
                onPress={() => router.push(`/transactions/${item.id}?ledgerId=${ledger?.id}`)} 
              />
            )}
            keyExtractor={(item: any) => item.id}
            estimatedItemSize={80}
            contentContainerStyle={{ paddingBottom: 100 }}
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
