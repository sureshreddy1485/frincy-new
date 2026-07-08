import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface Props {
  label: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
  index?: number;
  onPress?: () => void;
  negative?: boolean;
}

export const KpiCard = React.memo(({ label, value, subtitle, icon, color, index = 0, onPress, negative }: Props) => {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(index * 60, withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animStyle, styles.wrapper]}>
      <Surface
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={2}
        onTouchEnd={onPress}
      >
        <View style={[styles.iconBadge, { backgroundColor: color + '20' }]}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <Text
          variant="headlineSmall"
          style={[styles.value, { color: negative ? theme.colors.error : theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Text variant="labelSmall" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          {label}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </Surface>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: { width: '48%' },
  card: {
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: { fontWeight: '700', fontSize: 20 },
  label: { marginTop: 4 },
});
