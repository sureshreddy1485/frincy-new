import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button, SegmentedButtons, useTheme, Snackbar } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { ImportService, ImportType } from '../../src/services/import.service';
import { useAppStore } from '../../src/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ImportCenter() {
  const theme = useTheme();
  const { currentBusiness } = useAppStore();
  const [importType, setImportType] = useState<ImportType>('customers');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{message: string, isError: boolean} | null>(null);

  const handleImport = async (fileType: 'csv' | 'json') => {
    if (!currentBusiness?.id) return;

    try {
      const docRes = await DocumentPicker.getDocumentAsync({
        type: fileType === 'csv' ? ['text/csv', 'text/comma-separated-values'] : ['application/json'],
        copyToCacheDirectory: true,
      });

      if (docRes.canceled || !docRes.assets[0]) return;

      setIsImporting(true);
      setResult(null);

      const fileUri = docRes.assets[0].uri;
      let res;

      if (fileType === 'csv') {
        res = await ImportService.importCSV(fileUri, importType, currentBusiness.id);
      } else {
        res = await ImportService.importJSON(fileUri, importType, currentBusiness.id);
      }

      if (res.success || res.importedCount > 0) {
        setResult({
          message: `Successfully imported ${res.importedCount} ${importType}. ${res.errors.length > 0 ? `(${res.errors.length} rows failed)` : ''}`,
          isError: false
        });
      } else {
        setResult({
          message: `Import failed: ${res.errors[0] || 'Unknown error'}`,
          isError: true
        });
      }
    } catch (err: any) {
      setResult({ message: err.message || 'Failed to read file', isError: true });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: 'Import Center' }} />

      <Surface style={styles.header}>
        <MaterialCommunityIcons name="database-import" size={48} color={theme.colors.primary} />
        <Text variant="headlineSmall" style={{ marginTop: 8 }}>Import Data</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Import your customers, ledgers, or transactions directly from your device. Works offline.
        </Text>
      </Surface>

      <View style={styles.content}>
        <Text variant="titleMedium" style={styles.sectionTitle}>1. Select Data Type</Text>
        <SegmentedButtons
          value={importType}
          onValueChange={value => setImportType(value as ImportType)}
          buttons={[
            { value: 'customers', label: 'Customers' },
            { value: 'ledgers', label: 'Ledgers' },
            { value: 'transactions', label: 'Transactions' },
          ]}
          style={styles.segmented}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>2. Select File Format</Text>
        <View style={styles.buttonRow}>
          <Button
            mode="contained-tonal"
            icon="file-delimited"
            loading={isImporting}
            disabled={isImporting}
            onPress={() => handleImport('csv')}
            style={styles.actionBtn}
          >
            Import CSV
          </Button>
          
          <Button
            mode="contained-tonal"
            icon="code-json"
            loading={isImporting}
            disabled={isImporting}
            onPress={() => handleImport('json')}
            style={styles.actionBtn}
          >
            Import JSON
          </Button>
        </View>

        <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="information" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={{ marginLeft: 12, flex: 1, color: theme.colors.onSurfaceVariant }}>
            Make sure your CSV/JSON file has headers matching exactly: name, phone, email, address, balance, ledgerId, amount, type.
          </Text>
        </Surface>
      </View>

      <Snackbar
        visible={!!result}
        onDismiss={() => setResult(null)}
        duration={5000}
        style={{ backgroundColor: result?.isError ? theme.colors.error : theme.colors.primary }}
      >
        {result?.message}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    elevation: 0,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
  },
  segmented: {
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  }
});
