import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, useTheme, TextInput, Button, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useBusinessStore } from '../../src/store/businessStore';
import { reminderRepository } from '../../src/repository/reminder.repository';
import { NotificationScheduler } from '../../src/notifications/notificationScheduler';
import { useNotificationStore } from '../../src/store/notificationStore';

export default function NewReminderScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const { activeBusinessId } = useBusinessStore();
  const { notificationsEnabled, quietHoursEnabled } = useNotificationStore();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<{ hours: number, minutes: number }>({ hours: new Date().getHours(), minutes: new Date().getMinutes() });
  
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !date || !activeBusinessId) return;
    
    setLoading(true);
    try {
      // Combine date and time
      const dueDate = new Date(date);
      dueDate.setHours(time.hours, time.minutes, 0, 0);

      const timestampInSeconds = Math.floor(dueDate.getTime() / 1000);
      const r = await reminderRepository.create({
        businessId: activeBusinessId,
        title,
        dueDate: timestampInSeconds,
        status: 'PENDING'
      });
      
      if (notificationsEnabled) {
        await NotificationScheduler.scheduleReminder(r, quietHoursEnabled);
      }
      
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="New Reminder" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          label="Reminder Title"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
        />

        <View style={styles.row}>
          <Button 
            mode="outlined" 
            onPress={() => setDatePickerVisible(true)}
            style={styles.btn}
            icon="calendar"
          >
            {date ? date.toLocaleDateString() : 'Select Date'}
          </Button>

          <Button 
            mode="outlined" 
            onPress={() => setTimePickerVisible(true)}
            style={styles.btn}
            icon="clock"
          >
            {`${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`}
          </Button>
        </View>

        <Button 
          mode="contained" 
          onPress={handleSave} 
          style={styles.saveBtn}
          loading={loading}
          disabled={loading || !title.trim() || !date}
        >
          Save Reminder
        </Button>
      </ScrollView>

      {datePickerVisible && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setDatePickerVisible(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}
      
      {timePickerVisible && (
        <DateTimePicker
          value={date || new Date()}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setTimePickerVisible(false);
            if (selectedDate) {
              setTime({ hours: selectedDate.getHours(), minutes: selectedDate.getMinutes() });
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  input: { marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  btn: { flex: 1 },
  saveBtn: { paddingVertical: 6, borderRadius: 8 },
});
