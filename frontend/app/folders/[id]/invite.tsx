import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Share } from 'react-native';
import { Text, useTheme, Appbar, Button, Surface, ActivityIndicator, IconButton } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { folderInviteService } from '../../../src/services/folderInvite.service';
import { useBusinessStore } from '../../../src/store/businessStore';
import * as Clipboard from 'expo-clipboard';
import { CustomAlert } from '../../../src/providers/AlertProvider';


export default function FolderInviteScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { activeBusinessId } = useBusinessStore();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateToken();
  }, []);

  const generateToken = async () => {
    if (!activeBusinessId || !id) return;
    setLoading(true);
    try {
      const invite = await folderInviteService.generateInvite(activeBusinessId, id as string, 5); // Allow 5 uses
      setToken(invite.token);
    } catch (e: any) {
      CustomAlert.alert('Error', e.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const inviteLink = `frincy://join-folder?token=${token}`;

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    CustomAlert.alert('Copied!', 'Copied to clipboard.');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my folder on Frincy!\n\nInvite Code: ${token}\nLink: ${inviteLink}`,
      });
    } catch (error: any) {
      CustomAlert.alert('Error', error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Share Folder" />
      </Appbar.Header>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 16 }}>Generating Secure Link...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Surface style={styles.qrCard} elevation={2}>
            <Text variant="titleLarge" style={styles.title}>Scan to Join</Text>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={inviteLink}
                size={220}
                color="black"
                backgroundColor="white"
              />
            </View>

            <Text variant="bodyMedium" style={styles.subtitle}>
              Ask your team member to scan this QR code or enter the invite code below.
            </Text>

            <View style={styles.codeBox}>
              <Text variant="headlineMedium" style={{ letterSpacing: 4, fontWeight: 'bold' }}>{token}</Text>
              <IconButton icon="content-copy" onPress={() => copyToClipboard(token!)} />
            </View>
          </Surface>

          <Button 
            mode="contained" 
            icon="share-variant" 
            style={styles.shareButton} 
            onPress={handleShare}
          >
            Share Link
          </Button>
          
          <Button 
            mode="text" 
            icon="refresh" 
            onPress={generateToken}
          >
            Generate New Code
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, alignItems: 'center' },
  qrCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#fff' // White background for QR contrast
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#000'
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
    color: '#666'
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  shareButton: {
    width: '100%',
    paddingVertical: 8,
    marginBottom: 16,
    borderRadius: 8,
  }
});
