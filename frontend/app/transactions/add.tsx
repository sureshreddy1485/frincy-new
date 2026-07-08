import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, useTheme, Appbar, HelperText, SegmentedButtons } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { transactionService } from '../../src/services/transaction.service';
// @ts-ignore - Paper dates might lack some strict types
import { DatePickerModal } from 'react-native-paper-dates';
import { ledgerRepository } from '../../src/repository/ledger.repository';
import { notificationService } from '../../src/services/notification.service';
import { useBusinessStore } from '../../src/store/businessStore';

const txSchema = z.object({
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, { message: 'Enter a valid positive amount' }),
  note: z.string().optional(),
});

export default function AddTransactionScreen() {
  const { ledgerId, type: initialType } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const [type, setType] = useState<string>((initialType as string) || 'INCOME');
  const [date, setDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [reminderDays, setReminderDays] = useState<number | null>(null);
  const { activeBusinessId } = useBusinessStore();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(txSchema),
    defaultValues: { amount: '', note: '' }
  });

  const onSubmit = async (data: any) => {
    try {
      await transactionService.create({
        ledgerId: ledgerId as string,
        amount: Number(data.amount),
        type,
        date: Math.floor(date.getTime() / 1000), // convert to UNIX seconds
        note: data.note
      });

      if (type === 'GAVE' && reminderDays !== null && activeBusinessId) {
        const ledger = await ledgerRepository.findById(ledgerId as string);
        if (ledger?.customerId) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + reminderDays);
          await notificationService.addReminder(
            activeBusinessId,
            `Collection due (${data.amount})`,
            dueDate,
            ledger.customerId
          );
        }
      }

      router.back();
    } catch (error) {
      console.error('Failed to create transaction', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="New Transaction" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <SegmentedButtons
          value={type}
          onValueChange={setType}
          buttons={[
            { value: 'INCOME', label: 'Income', checkedColor: theme.colors.primary },
            { value: 'EXPENSE', label: 'Expense', checkedColor: theme.colors.error },
          ]}
          style={styles.segmented}
        />

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Amount (₹) *"
                mode="flat"
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.amount}
                style={{ fontSize: 24, textAlign: 'center', backgroundColor: 'transparent' }}
              />
              {errors.amount && <HelperText type="error">{String(errors.amount.message)}</HelperText>}
            </View>
          )}
        />

        <Button 
          mode="outlined" 
          icon="calendar" 
          onPress={() => setDatePickerOpen(true)}
          style={styles.dateBtn}
        >
          {date.toLocaleDateString()}
        </Button>
        <DatePickerModal
          locale="en"
          mode="single"
          visible={datePickerOpen}
          onDismiss={() => setDatePickerOpen(false)}
          date={date}
          onConfirm={(params: any) => {
            setDatePickerOpen(false);
            if (params.date) setDate(params.date);
          }}
        />

        {type === 'GAVE' && (
          <View style={{ marginBottom: 16 }}>
            <HelperText type="info" padding="none">Set Collection Reminder</HelperText>
            <SegmentedButtons
              value={reminderDays?.toString() || '0'}
              onValueChange={(v) => setReminderDays(v === '0' ? null : parseInt(v, 10))}
              buttons={[
                { value: '0', label: 'None' },
                { value: '3', label: '3 Days' },
                { value: '7', label: '1 Week' },
                { value: '30', label: '1 Month' }
              ]}
              style={{ marginTop: 8 }}
            />
          </View>
        )}

        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Notes (Optional)"
                mode="flat"
                multiline
                numberOfLines={3}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                style={{ backgroundColor: 'transparent' }}
              />
            </View>
          )}
        />

        <Button 
          mode="contained" 
          onPress={handleSubmit(onSubmit)} 
          loading={isSubmitting}
          style={styles.submitBtn}
        >
          Save Transaction
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  inputContainer: { marginBottom: 16 },
  segmented: { marginBottom: 24 },
  dateBtn: { marginBottom: 16, paddingVertical: 8 },
  submitBtn: { marginTop: 16, paddingVertical: 6 }
});
