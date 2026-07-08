import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Appbar, Surface } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Privacy Policy" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>Your Privacy Matters</Text>
          
          <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8 }}>1. Offline First</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Frincy is designed to be an offline-first application. All your business data, customers, and transactions are stored locally on your device. We do not automatically upload your data to our servers unless you explicitly enable cloud sync.
          </Text>

          <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8 }}>2. Data Collection</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            When you use cloud features, we collect necessary information to sync your data across devices. We do not sell your personal or business data to third parties.
          </Text>

          <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8 }}>3. Security</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            We use industry-standard encryption to protect your data both in transit and at rest when synced to our cloud services.
          </Text>

          <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8 }}>4. Contact Us</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            If you have any questions about this Privacy Policy, please contact our support team.
          </Text>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  card: { padding: 24, borderRadius: 12 },
});
