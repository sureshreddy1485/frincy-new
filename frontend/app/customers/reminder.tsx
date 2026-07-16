import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, useTheme, Appbar, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useBusinessStore } from '../../src/store/businessStore';
import { reminderRepository } from '../../src/repository/reminder.repository';
import { NotificationScheduler } from '../../src/notifications/notificationScheduler';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomAlert } from '../../src/providers/AlertProvider';


export default function ReminderScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const { activeBusinessId } = useBusinessStore();

  const [type, setType] = useState('payment');
  const [customTitle, setCustomTitle] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 86400000)); // Default: Tomorrow
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const handleSave = async () => {
    if (!activeBusinessId || !customerId) return;
    
    let title = '';
    if (type === 'payment') title = 'Payment Reminder';
    else if (type === 'collection') title = 'Collection Reminder';
    else title = customTitle.trim() || 'Custom Reminder';

    if (date.getTime() <= Date.now()) {
      CustomAlert.alert('Invalid Time', 'Reminder must be in the future.');
      return;
    }

    try {
      const reminder = await reminderRepository.create({
        businessId: activeBusinessId,
        title,
        dueDate: Math.floor(date.getTime() / 1000),
        status: 'PENDING',
        relatedId: customerId,
      });
      
      await NotificationScheduler.scheduleReminder(reminder, false);
      CustomAlert.alert('Success', 'Reminder scheduled successfully!');
      router.back();
    } catch (e: any) {
      CustomAlert.alert('Error', e.message);
    }
  };

  const showDatepicker = () => setDatePickerVisible(true);
  const showTimepicker = () => setTimePickerVisible(true);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Set Reminder" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={{ marginBottom: 12 }}>Reminder Type</Text>
        <SegmentedButtons
          value={type}
          onValueChange={setType}
          buttons={[
            { value: 'payment', label: 'Payment' },
            { value: 'collection', label: 'Collection' },
            { value: 'custom', label: 'Custom' },
          ]}
          style={{ marginBottom: 24 }}
        />

        {type === 'custom' && (
          <TextInput
            label="Reminder Title"
            mode="outlined"
            value={customTitle}
            onChangeText={setCustomTitle}
            style={{ marginBottom: 24 }}
          />
        )}

        <Text variant="titleMedium" style={{ marginBottom: 12 }}>When?</Text>
        <View style={styles.dateTimeRow}>
          <Button mode="outlined" icon="calendar" onPress={showDatepicker} style={{ flex: 1, marginRight: 8 }}>
            {date.toLocaleDateString()}
          </Button>
          <Button mode="outlined" icon="clock" onPress={showTimepicker} style={{ flex: 1, marginLeft: 8 }}>
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Button>
        </View>

        {datePickerVisible && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setDatePickerVisible(false);
              if (selectedDate) {
                const newDate = new Date(selectedDate);
                newDate.setHours(date.getHours());
                newDate.setMinutes(date.getMinutes());
                setDate(newDate);
              }
            }}
          />
        )}

        {timePickerVisible && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => {
              setTimePickerVisible(false);
              if (selectedDate) {
                const newDate = new Date(date);
                newDate.setHours(selectedDate.getHours());
                newDate.setMinutes(selectedDate.getMinutes());
                setDate(newDate);
              }
            }}
          />
        )}

        <Button mode="contained" onPress={handleSave} style={{ marginTop: 32, paddingVertical: 6 }}>
          Schedule Reminder
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
