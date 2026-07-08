import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Appbar, Surface } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';

export default function TermsOfServiceScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Terms of Service" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>Frincy Terms of Service</Text>
          
          <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8 }}>1. Acceptance of Terms</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            By downloading, installing, or using Frincy, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
          </Text>

          <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8 }}>2. Usage Guidelines</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Frincy provides tools for business management and ledger tracking. You agree to use the application for lawful purposes only and in a way that does not infringe the rights of, restrict or inhibit anyone else's use of the application.
          </Text>

          <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8 }}>3. Data Responsibility</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            While we strive to ensure data integrity, you are responsible for maintaining regular backups of your data. Frincy is not liable for any data loss that may occur.
          </Text>

          <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8 }}>4. Changes to Terms</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            We reserve the right to modify these terms at any time. We will notify users of any significant changes via the application.
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
