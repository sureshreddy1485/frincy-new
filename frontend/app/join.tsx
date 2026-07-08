import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, useTheme, Appbar, TextInput, Button, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { folderInviteService } from '../src/services/folderInvite.service';
import { useAuthStore } from '../src/store/authStore';
import * as Linking from 'expo-linking';
import { CustomAlert } from '../src/providers/AlertProvider';


export default function JoinFolderScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we were launched with a deep link
    const checkInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLink(url);
      }
    };
    checkInitialUrl();

    // Listen for deep links while app is open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    const parsed = Linking.parse(url);
    if (parsed.path === 'join-folder' && parsed.queryParams?.token) {
      setToken(parsed.queryParams.token as string);
    }
  };

  const handleJoin = async () => {
    if (!token.trim()) return;
    if (!user) {
      CustomAlert.alert('Error', 'You must be logged in to join a folder.');
      return;
    }

    setLoading(true);
    try {
      const groupId = await folderInviteService.acceptInvite(token.trim(), user.id);
      CustomAlert.alert('Success!', 'You have joined the folder. It will appear on your Customers tab.');
      router.replace('/(tabs)/customers');
    } catch (e: any) {
      CustomAlert.alert('Join Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Join Folder" />
      </Appbar.Header>

      <View style={styles.content}>
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleLarge" style={styles.title}>Have an Invite Code?</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Enter the 8-character code or scan the QR code to join a shared folder.
          </Text>

          <TextInput
            label="Invite Code (e.g. ABCD-1234)"
            mode="outlined"
            value={token}
            onChangeText={setToken}
            style={styles.input}
            autoCapitalize="characters"
          />

          <Button 
            mode="contained" 
            onPress={handleJoin} 
            loading={loading}
            disabled={token.length < 8}
            style={styles.button}
          >
            Join Folder
          </Button>
        </Surface>
        
        {/* We would use expo-camera or react-native-vision-camera for scanning QR, 
            but for this phase we simulate entering the code or deep linking. */}
        <Button mode="outlined" icon="qrcode-scan" style={{ marginTop: 16 }} onPress={() => {
            CustomAlert.alert('Scanner', 'QR Scanning uses expo-camera, but you can also just paste the deep link or code.');
        }}>
          Scan QR Code
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, alignItems: 'center', justifyContent: 'center', flex: 1, paddingBottom: 100 },
  card: {
    padding: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    width: '100%',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 6,
  }
});
