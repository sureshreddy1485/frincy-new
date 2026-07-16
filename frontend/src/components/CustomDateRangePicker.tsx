import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Portal, Button, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CustomDateRangePickerProps {
  visible: boolean;
  onDismiss: () => void;
  startDate?: Date;
  endDate?: Date;
  onConfirm: (range: { startDate: Date; endDate: Date }) => void;
}

export const CustomDateRangePicker = ({ visible, onDismiss, startDate, endDate, onConfirm }: CustomDateRangePickerProps) => {
  const [start, setStart] = useState<Date>(startDate || new Date());
  const [end, setEnd] = useState<Date>(endDate || new Date());
  
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);

  const handleConfirm = () => {
    onConfirm({ startDate: start, endDate: end });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Select Date Range</Dialog.Title>
        <Dialog.Content>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Start Date</Text>
              <Button mode="outlined" onPress={() => setPicking('start')}>{start.toLocaleDateString()}</Button>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>End Date</Text>
              <Button mode="outlined" onPress={() => setPicking('end')}>{end.toLocaleDateString()}</Button>
            </View>
          </View>
          
          {picking === 'start' && (
            <DateTimePicker
              value={start}
              mode="date"
              display="default"
              onChange={(e, d) => {
                setPicking(null);
                if (d) setStart(d);
              }}
            />
          )}
          {picking === 'end' && (
            <DateTimePicker
              value={end}
              mode="date"
              display="default"
              onChange={(e, d) => {
                setPicking(null);
                if (d) setEnd(d);
              }}
            />
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleConfirm}>OK</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },
  label: { marginBottom: 8, textAlign: 'center', color: 'gray' }
});
