import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Avatar, useTheme, IconButton } from 'react-native-paper';
import { Customer } from '../database/models';
import * as Linking from 'expo-linking';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';

interface Props {
  customer: Customer;
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  index: number;
  updaterName?: string;
}

const CustomerCardComponent = ({ customer, onPress, onLongPress, selected, index, updaterName }: Props) => {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(index * 50)}>
      <Card 
        style={[styles.card, selected && { backgroundColor: theme.colors.primaryContainer, borderWidth: 2, borderColor: theme.colors.primary }]} 
        onPress={onPress} 
        onLongPress={onLongPress}
        mode={selected ? "contained" : "elevated"}
      >
        <Card.Title
          title={customer.name}
          titleStyle={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}
          subtitle={updaterName ? `By ${updaterName} • ${customer.phone || 'No Phone Number'}` : (customer.phone || 'No Phone Number')}
          subtitleStyle={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
          left={(props) => (
            customer.avatarUrl ? (
              <Image 
                source={{ uri: customer.avatarUrl }} 
                style={{ width: 40, height: 40, borderRadius: 20, margin: 8 }}
                contentFit="cover"
                cachePolicy="memory-disk" // Cache thumbnail!
              />
            ) : (
              <Avatar.Text 
                {...props} 
                label={customer.name.substring(0, 2).toUpperCase()} 
                style={{ backgroundColor: theme.colors.primaryContainer }}
                color={theme.colors.onPrimaryContainer}
              />
            )
          )}
          right={(props) => (
            <View style={styles.rightContainer}>
              {customer.phone ? (
                <IconButton 
                  icon="phone" 
                  size={20} 
                  iconColor={theme.colors.primary}
                  onPress={() => Linking.openURL(`tel:${customer.phone}`)}
                />
              ) : null}
              <Text 
                variant="titleMedium" 
                style={{ 
                  color: customer.balance >= 0 ? theme.colors.primary : theme.colors.error,
                  marginRight: 16 
                }}
              >
                ₹{customer.balance.toFixed(2)}
              </Text>
            </View>
          )}
        />
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});

export const CustomerCard = CustomerCardComponent;
