import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

export const DashboardSkeleton = () => {
  const theme = useTheme();
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const Block = ({ w = '100%', h = 20, radius = 8 }: { w?: any; h?: number; radius?: number }) => (
    <Animated.View
      style={[
        animStyle,
        { width: w, height: h, borderRadius: radius, backgroundColor: theme.colors.surfaceVariant, marginBottom: 8 },
      ]}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Block w="60%" h={28} />
        <Block w="30%" h={20} />
      </View>
      <View style={styles.row}>
        <View style={{ width: '48%' }}>
          <Block h={110} radius={16} />
        </View>
        <View style={{ width: '48%' }}>
          <Block h={110} radius={16} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ width: '48%' }}>
          <Block h={110} radius={16} />
        </View>
        <View style={{ width: '48%' }}>
          <Block h={110} radius={16} />
        </View>
      </View>
      <Block h={180} radius={16} />
      <Block h={200} radius={16} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { marginBottom: 16, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
});
