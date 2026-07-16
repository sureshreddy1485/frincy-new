import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Dialog, Portal, Button, TextInput, HelperText, SegmentedButtons } from 'react-native-paper';
import { CustomDatePicker } from './CustomDatePicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { transactionService } from '../services/transaction.service';
import { ledgerRepository } from '../repository/ledger.repository';
import { notificationService } from '../services/notification.service';

const txSchema = z.object({
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, { message: 'Enter a valid positive amount' }),
  note: z.string().optional(),
});

interface AddTransactionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  ledgerId: string;
  initialType: 'INCOME' | 'EXPENSE' | 'GOT' | 'GAVE';
  activeBusinessId: string;
  onSuccess: () => void;
}

export const AddTransactionDialog = ({
  visible,
  onDismiss,
  ledgerId,
  initialType,
  activeBusinessId,
  onSuccess,
}: AddTransactionDialogProps) => {
  const [type, setType] = useState<string>(initialType);
  const [reminderDays, setReminderDays] = useState<number | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(txSchema),
    defaultValues: { amount: '', note: '' },
  });

  // Reset form when dialog opens with new initialType
  React.useEffect(() => {
    if (visible) {
      setType(initialType);
      reset({ amount: '', note: '' });
      setReminderDays(null);
      setDate(new Date());
    }
  }, [visible, initialType, reset]);

  const onSubmit = async (data: any) => {
    try {
      await transactionService.create({
        ledgerId,
        amount: Number(data.amount),
        type,
        date: Math.floor(date.getTime() / 1000),
        note: data.note,
      });

      if ((type === 'EXPENSE' || type === 'GAVE') && reminderDays !== null && activeBusinessId) {
        const ledger = await ledgerRepository.findById(ledgerId);
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

      onSuccess();
      onDismiss();
    } catch (error) {
      console.error('Failed to create transaction', error);
    }
  };

  return (
    <Portal>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
        <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
          <Dialog.Title>{type === 'INCOME' || type === 'GOT' ? 'Got Amount' : 'Gave Amount'}</Dialog.Title>
          <Dialog.Content>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <SegmentedButtons
              value={type}
              onValueChange={setType}
              buttons={[
                { value: 'INCOME', label: 'Got' },
                { value: 'EXPENSE', label: 'Gave' },
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

            {(type === 'EXPENSE' || type === 'GAVE') && (
              <View style={{ marginBottom: 16 }}>
                <HelperText type="info" padding="none">Set Collection Reminder</HelperText>
                <SegmentedButtons
                  value={reminderDays?.toString() || '0'}
                  onValueChange={(v) => setReminderDays(v === '0' ? null : parseInt(v, 10))}
                  buttons={[
                    { value: '0', label: 'None' },
                    { value: '3', label: '3 Days' },
                    { value: '7', label: '1 Week' },
                    { value: '30', label: '1 Month' },
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
                    numberOfLines={2}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    style={{ backgroundColor: 'transparent' }}
                  />
                </View>
              )}
            />

              <View style={styles.actionButtons}>
                <Button onPress={onDismiss} style={styles.actionBtn}>Cancel</Button>
                <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={styles.actionBtn}>Save</Button>
              </View>
            </ScrollView>
          </Dialog.Content>
        </Dialog>
      </KeyboardAvoidingView>

      <CustomDatePicker
        visible={datePickerOpen}
        onDismiss={() => setDatePickerOpen(false)}
        date={date}
        onConfirm={(d: Date) => {
          setDatePickerOpen(false);
          setDate(d);
        }}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '90%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  segmented: {
    marginBottom: 24,
  },
  dateBtn: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionBtn: {
    minWidth: 80,
  }
});
