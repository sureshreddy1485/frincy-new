import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Appbar, HelperText, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { transactionService } from '../../src/services/transaction.service';
import { Transaction } from '../../src/database/models';
import { useBusinessStore } from '../../src/store/businessStore';
// @ts-ignore - Paper dates might lack some strict types
import { DatePickerModal } from 'react-native-paper-dates';
import { CustomAlert } from '../../src/providers/AlertProvider';


const txSchema = z.object({
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, { message: 'Enter a valid positive amount' }),
  note: z.string().optional(),
});

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { activeBusinessRole } = useBusinessStore();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string>('INCOME');
  const [date, setDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(txSchema),
  });

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const record = await transactionService.getById(id as string);
        setTransaction(record);
        setType(record.type);
        setDate(new Date(record.date * 1000)); // Drizzle stores dates as UNIX seconds usually, or timestamps
        reset({
          amount: record.amount.toString(),
          note: record.note || '',
        });
      } catch (error) {
        CustomAlert.alert('Error', 'Transaction not found.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, [id]);

  const onSubmit = async (data: any) => {
    if (!transaction) return;
    try {
      await transactionService.update(transaction.id, {
        amount: Number(data.amount),
        type,
        date: Math.floor(date.getTime() / 1000), // Convert to UNIX seconds
        note: data.note
      });
      router.back();
    } catch (error) {
      console.error('Failed to update transaction', error);
    }
  };

  const handleDelete = () => {
    CustomAlert.alert('Delete', 'Delete this transaction permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          if (!transaction) return;
          await transactionService.delete(transaction.id);
          router.back();
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Edit Transaction" />
        {activeBusinessRole === 'OWNER' && (
          <Appbar.Action icon="delete" onPress={handleDelete} color={theme.colors.error} />
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <SegmentedButtons
          value={type}
          onValueChange={setType}
          buttons={[
            { value: 'INCOME', label: 'Income' },
            { value: 'EXPENSE', label: 'Expense' },
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
                disabled={activeBusinessRole === 'VIEWER'}
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
                disabled={activeBusinessRole === 'VIEWER'}
                style={{ backgroundColor: 'transparent' }}
              />
            </View>
          )}
        />

        {activeBusinessRole !== 'VIEWER' && (
          <Button 
            mode="contained" 
            onPress={handleSubmit(onSubmit)} 
            loading={isSubmitting}
            style={styles.submitBtn}
          >
            Update Transaction
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  inputContainer: { marginBottom: 16 },
  segmented: { marginBottom: 24 },
  dateBtn: { marginBottom: 16, paddingVertical: 8 },
  submitBtn: { marginTop: 16, paddingVertical: 6 }
});
