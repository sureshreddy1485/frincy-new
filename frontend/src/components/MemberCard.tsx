import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme, Avatar, IconButton } from 'react-native-paper';
import { BusinessMember } from '../database/models';

import Animated, { FadeInUp } from 'react-native-reanimated';

interface Props {
  member: BusinessMember;
  onEditRole: () => void;
  index: number;
}

const MemberCardComponent = ({ member, onEditRole, index }: Props) => {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(index * 50)}>
      <Card style={styles.card} mode="elevated">
        <Card.Title
          title={`User ID: ${member.userId.substring(0, 8)}...`}
          subtitle={`Role: ${member.role}`}
          left={(props) => (
            <Avatar.Icon 
              {...props} 
              icon="account" 
              style={{ backgroundColor: theme.colors.secondaryContainer }}
              color={theme.colors.onSecondaryContainer}
            />
          )}
          right={(props) => (
            <IconButton {...props} icon="account-edit" onPress={onEditRole} />
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
  }
});

export const MemberCard = MemberCardComponent;
