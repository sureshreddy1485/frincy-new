import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme, Avatar } from 'react-native-paper';
import { Ledger } from '../database/models';

import Animated, { FadeInUp } from 'react-native-reanimated';

interface Props {
  ledger: Ledger;
  onPress: () => void;
  index: number;
}

const LedgerCardComponent = ({ ledger, onPress, index }: Props) => {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(index * 50)}>
      <Card style={styles.card} onPress={onPress} mode="elevated">
        <Card.Title
          title={ledger.name}
          subtitle={ledger.type}
          left={(props) => (
            <Avatar.Icon 
              {...props} 
              icon={ledger.type === 'CUSTOMER' ? 'account' : 'book'} 
              style={{ backgroundColor: theme.colors.primaryContainer }}
              color={theme.colors.onPrimaryContainer}
            />
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
  }
});

export const LedgerCard = LedgerCardComponent;
