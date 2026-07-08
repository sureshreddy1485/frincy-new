import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { DateRange, DateFilter } from '../../services/dashboard.service';

import { IconButton } from 'react-native-paper';
// @ts-ignore
import { DatePickerModal } from 'react-native-paper-dates';

interface Props {
  selected: DateRange;
  onSelect: (r: DateRange) => void;
  onCustomFilter?: (filter: DateFilter) => void;
  customFilter?: DateFilter;
}

const RANGES: { key: DateRange; label: string }[] = [
  { key: 'today', label: 'Today' },
];

export const DateRangeSelector = React.memo(({ selected, onSelect, onCustomFilter, customFilter }: Props) => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {RANGES.map((r) => {
        const isSelected = r.key === selected;
        return (
          <TouchableOpacity
            key={r.key}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant,
              },
            ]}
            onPress={() => onSelect(r.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              variant="labelMedium"
              style={{ color: isSelected && !customFilter ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[
          styles.chip,
          {
            backgroundColor: customFilter ? theme.colors.primary : theme.colors.surfaceVariant,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 2, // Make room for icon
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <IconButton icon="calendar" size={16} iconColor={customFilter ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} style={{ margin: 0, padding: 0, width: 16, height: 16, marginRight: 4 }} />
        <Text
          variant="labelMedium"
          style={{ color: customFilter ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}
        >
          {customFilter ? `${customFilter.from.toLocaleDateString()} - ${customFilter.to.toLocaleDateString()}` : 'Custom Range'}
        </Text>
      </TouchableOpacity>

      <DatePickerModal
        locale="en"
        mode="range"
        visible={open}
        onDismiss={() => setOpen(false)}
        startDate={customFilter ? customFilter.from : undefined}
        endDate={customFilter ? customFilter.to : undefined}
        onConfirm={(params: any) => {
          setOpen(false);
          if (params.startDate && params.endDate && onCustomFilter) {
            onCustomFilter({ from: params.startDate, to: params.endDate });
          }
        }}
      />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
});
