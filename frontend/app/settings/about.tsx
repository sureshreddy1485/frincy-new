import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Appbar, useTheme, Surface, List, Button, Divider, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [section, setSection] = useState('about');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="About & Legal" />
      </Appbar.Header>

      <View style={{ padding: 16 }}>
        <SegmentedButtons
          value={section}
          onValueChange={setSection}
          buttons={[
            { value: 'about', label: 'About & Guide' },
            { value: 'privacy', label: 'Privacy' },
            { value: 'terms', label: 'Terms' },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {section === 'about' && (
          <Surface style={styles.surface} elevation={1}>
            <View style={styles.header}>
              <Text variant="displaySmall">🏢</Text>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginTop: 8 }}>Frincy Business Manager</Text>
              <Text variant="bodyMedium" style={{ opacity: 0.7 }}>Version 1.0.0</Text>
            </View>
            <Divider style={{ marginVertical: 16 }} />
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>Guide to using Frincy</Text>
            <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
              • <Text style={{fontWeight: 'bold'}}>Create a Business:</Text> Start by creating a business workspace in Settings.{"\n"}
              • <Text style={{fontWeight: 'bold'}}>Manage Customers & Ledgers:</Text> Open the Customers tab to track balances and create folders for categorization.{"\n"}
              • <Text style={{fontWeight: 'bold'}}>Offline First:</Text> Frincy works entirely offline. When you reconnect to the internet, all your data will seamlessly sync to the cloud.{"\n"}
              • <Text style={{fontWeight: 'bold'}}>Share with Team:</Text> Go to Business Settings {'>'} Manage Members to grant role-based access to your staff or managers.{"\n"}
              • <Text style={{fontWeight: 'bold'}}>AI Assistant:</Text> Use the Leo AI tool to chat with your business data and get insights effortlessly!
            </Text>
          </Surface>
        )}

        {section === 'privacy' && (
          <Surface style={styles.surface} elevation={1}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>Privacy Policy</Text>
            <Text variant="bodyMedium" style={{ lineHeight: 22, color: theme.colors.onSurfaceVariant }}>
              At Frincy, we prioritize your data privacy. Because Frincy operates as an offline-first application, your business data is primarily stored securely on your local device.
              {"\n\n"}
              When you synchronize with our cloud servers, your data is encrypted in transit. We do not sell your personal or business data to third parties. 
              {"\n\n"}
              By using Frincy, you agree to allow us to store necessary authentication details and synchronized data to provide you with a seamless multi-device experience.
            </Text>
          </Surface>
        )}

        {section === 'terms' && (
          <Surface style={styles.surface} elevation={1}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>Terms of Service</Text>
            <Text variant="bodyMedium" style={{ lineHeight: 22, color: theme.colors.onSurfaceVariant }}>
              By accessing and using Frincy, you agree to be bound by these Terms of Service.
              {"\n\n"}
              1. <Text style={{fontWeight: 'bold'}}>Usage:</Text> You are responsible for maintaining the confidentiality of your account credentials.{"\n"}
              2. <Text style={{fontWeight: 'bold'}}>Data Loss:</Text> While Frincy provides local backups and cloud syncing, we are not liable for accidental data loss. Always verify your sync status.{"\n"}
              3. <Text style={{fontWeight: 'bold'}}>Prohibited Conduct:</Text> You may not use this service for illegal activities or unauthorized data scraping.
              {"\n\n"}
              These terms are subject to change, and continued use of the app implies your acceptance of the updated terms.
            </Text>
          </Surface>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  surface: { padding: 20, borderRadius: 12 },
  header: { alignItems: 'center', marginVertical: 12 },
});
