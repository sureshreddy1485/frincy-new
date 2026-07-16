import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Dialog, Portal, Button, Text, useTheme, IconButton } from 'react-native-paper';

interface CustomDatePickerProps {
  visible: boolean;
  onDismiss: () => void;
  date: Date;
  onConfirm: (date: Date) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const CustomDatePicker = ({ visible, onDismiss, date, onConfirm }: CustomDatePickerProps) => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(date.getMonth());
  const [currentYear, setCurrentYear] = useState(date.getFullYear());
  const [selectedDate, setSelectedDate] = useState(date);
  const [viewMode, setViewMode] = useState<'calendar' | 'monthYear'>('calendar');

  useEffect(() => {
    if (visible) {
      setSelectedDate(date);
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
      setViewMode('calendar');
    }
  }, [visible, date]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handleDayPress = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const years = useMemo(() => {
    const y = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      y.push(i);
    }
    return y;
  }, [currentYear]);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: theme.colors.surface }}>
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.headerText}>Select Date</Text>
          <Text style={styles.headerDate}>{selectedDate.toDateString()}</Text>
        </View>

        <Dialog.Content style={{ padding: 0, paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={styles.controls}>
            <IconButton icon="chevron-left" onPress={prevMonth} disabled={viewMode === 'monthYear'} />
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center' }} 
              onPress={() => setViewMode(viewMode === 'calendar' ? 'monthYear' : 'calendar')}
            >
              <Text style={styles.monthYearText}>{MONTHS[currentMonth]} {currentYear}</Text>
              <IconButton icon={viewMode === 'calendar' ? "menu-down" : "menu-up"} size={20} style={{ margin: 0 }} />
            </TouchableOpacity>
            <IconButton icon="chevron-right" onPress={nextMonth} disabled={viewMode === 'monthYear'} />
          </View>

          {viewMode === 'calendar' ? (
            <View>
              <View style={styles.daysHeader}>
                {DAYS.map((d, i) => (
                  <Text key={i} style={styles.dayLabel}>{d}</Text>
                ))}
              </View>
              <View style={styles.grid}>
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.cell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;
                  const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.cell,
                        isSelected ? { backgroundColor: theme.colors.primary, borderRadius: 20 } : null,
                        !isSelected && isToday ? { borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 20 } : null,
                      ]}
                      onPress={() => handleDayPress(day)}
                    >
                      <Text style={{ color: isSelected ? theme.colors.onPrimary : theme.colors.onSurface }}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.monthYearSelector}>
              <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.listItem, currentMonth === i && { backgroundColor: theme.colors.primaryContainer }]}
                    onPress={() => setCurrentMonth(i)}
                  >
                    <Text style={{ color: currentMonth === i ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
                {years.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.listItem, currentYear === y && { backgroundColor: theme.colors.primaryContainer }]}
                    onPress={() => setCurrentYear(y)}
                  >
                    <Text style={{ color: currentYear === y ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {viewMode === 'monthYear' && (
            <Button mode="contained-tonal" onPress={() => setViewMode('calendar')} style={{ marginTop: 8 }}>
              Done Selecting
            </Button>
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
  header: {
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  headerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  headerDate: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    color: 'gray',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  monthYearSelector: {
    flexDirection: 'row',
    height: 250,
  },
  column: {
    flex: 1,
  },
  listItem: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 8,
  }
});
