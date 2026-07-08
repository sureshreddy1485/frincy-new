import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme, Avatar } from 'react-native-paper';
import { Transaction } from '../database/models';

import Animated, { FadeInUp } from 'react-native-reanimated';

interface Props {
  transaction: Transaction;
  onPress: () => void;
  index: number;
}

const TransactionCardComponent = ({ transaction, onPress, index }: Props) => {
  const theme = useTheme();
  
  const isPositive = transaction.type === 'INCOME' || transaction.type === 'GOT';
  const color = isPositive ? theme.colors.primary : theme.colors.error;
  const icon = isPositive ? 'arrow-down-left' : 'arrow-up-right';

  return (
    <Animated.View entering={FadeInUp.delay(index * 50)}>
      <Card style={styles.card} onPress={onPress} mode="contained">
        <Card.Title
          title={transaction.type}
          subtitle={transaction.note || new Date(transaction.date * 1000).toLocaleDateString()}
          left={(props) => (
            <Avatar.Icon 
              {...props} 
              icon={icon} 
              style={{ backgroundColor: isPositive ? theme.colors.primaryContainer : theme.colors.errorContainer }}
              color={color}
            />
          )}
          right={(props) => (
            <View style={styles.rightContainer}>
              <Text variant="titleMedium" style={{ color, marginRight: 16, fontWeight: 'bold' }}>
                {isPositive ? '+' : '-'} ₹{transaction.amount.toFixed(2)}
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
    marginVertical: 6,
    borderRadius: 12,
  },
  rightContainer: {
    justifyContent: 'center',
  }
});

export const TransactionCard = TransactionCardComponent;
