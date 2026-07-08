import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, useTheme, Button, Text, Surface, ActivityIndicator, List } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { BackupService } from '../../src/backup/backupService';
import { createMMKV } from 'react-native-mmkv';
import { CustomAlert } from '../../src/providers/AlertProvider';


const storage = createMMKV({ id: 'backup-metadata' });

export default function BackupScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  const lastBackupTime = storage.getString('last_backup_time');
  const lastBackupSize = storage.getNumber('last_backup_record_count');

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      setLoadingText('Compressing and encrypting data...');
      
      const filePath = await BackupService.createLocalBackup();
      
      // Update metadata
      storage.set('last_backup_time', new Date().toLocaleString());
      storage.set('last_backup_record_count', Date.now()); // We can improve this if needed

      setLoadingText('Ready to save');
      await BackupService.shareBackup(filePath);

    } catch (e) {
      CustomAlert.alert('Backup Failed', String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const file = result.assets[0];
      
      CustomAlert.alert(
        'Confirm Restore',
        'Restoring will wipe all current local data and replace it with the backup. Are you absolutely sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Restore Now', 
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                setLoadingText('Decrypting and restoring data...');
                
                await BackupService.restoreLocalBackup(file.uri);
                
                CustomAlert.alert('Success', 'Backup restored successfully! Please restart the application.');
              } catch (e) {
                CustomAlert.alert('Restore Failed', 'The backup file might be corrupted or invalid.\n\n' + String(e));
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (e) {
      CustomAlert.alert('Error', String(e));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Backup & Restore" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleMedium" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
            Local Backup Status
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            Last Backup: {lastBackupTime || 'Never'}
          </Text>
          
          <Button 
            mode="contained" 
            icon="cloud-upload" 
            style={styles.actionBtn}
            onPress={handleCreateBackup}
            disabled={loading}
          >
            Create Encrypted Backup
          </Button>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleMedium" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
            Device Migration & Recovery
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
            Select a .fdb backup file to completely restore your business data to this device.
          </Text>
          
          <Button 
            mode="outlined" 
            icon="cloud-download" 
            style={styles.actionBtn}
            onPress={handleRestoreBackup}
            disabled={loading}
          >
            Restore from Backup File
          </Button>
        </Surface>

        <List.Section>
          <List.Subheader>Information</List.Subheader>
          <List.Item
            title="End-to-End Encrypted"
            description="Your backup file is secured using AES-256 encryption. Keep it safe."
            left={props => <List.Icon {...props} icon="shield-check" color="#22c55e" />}
          />
          <List.Item
            title="Cloud Synchronization"
            description="Restored data will automatically merge with cloud records if you go online."
            left={props => <List.Icon {...props} icon="sync" color={theme.colors.primary} />}
          />
        </List.Section>

      </ScrollView>

      {loading && (
        <View style={[styles.overlay, { backgroundColor: theme.colors.backdrop }]}>
          <Surface style={[styles.loadingBox, { backgroundColor: theme.colors.surface }]} elevation={4}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 16, color: theme.colors.onSurface, fontWeight: '600' }}>
              {loadingText}
            </Text>
          </Surface>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 20 },
  actionBtn: { marginTop: 16, borderRadius: 8 },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingBox: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
  }
});
