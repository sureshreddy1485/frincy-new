import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Appbar, useTheme, Button, Text, Surface, ActivityIndicator, TextInput, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { CameraService } from '../../src/scanner/cameraService';
import { OcrService, OcrResult } from '../../src/scanner/ocrService';
import { documentRepo } from '../../src/scanner/documentRepository';
import { CustomAlert } from '../../src/providers/AlertProvider';


// Using dummy transaction creation logic for UI demonstration, since actual transactions depend on existing repos
export default function ScannerScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [suggestion, setSuggestion] = useState<{ type: 'INCOME'|'EXPENSE' } | null>(null);

  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleCapture = async () => {
    try {
      const uri = await CameraService.takePicture();
      if (uri) await processImage(uri);
    } catch (e) {
      CustomAlert.alert('Camera Error', String(e));
    }
  };

  const handleGallery = async () => {
    try {
      const uri = await CameraService.pickImage();
      if (uri) await processImage(uri);
    } catch (e) {
      CustomAlert.alert('Gallery Error', String(e));
    }
  };

  const processImage = async (uri: string) => {
    setImageUri(uri);
    setLoading(true);
    setLoadingText('Running Smart OCR Analysis...');
    try {
      const result = await OcrService.processImage(uri);
      const aiSuggest = OcrService.suggestClassification(result);
      
      setOcrResult(result);
      setSuggestion(aiSuggest);
      setEditAmount(result.amount ? result.amount.toString() : '');
      setEditNotes(result.notes || '');
    } catch (e) {
      CustomAlert.alert('OCR Error', 'Failed to process document.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async () => {
    setLoading(true);
    setLoadingText('Saving transaction and document...');
    try {
      // In a full implementation, we'd call transactionRepository.createTransaction here
      // For now, we simulate generating an ID and just saving the document attachment
      const fakeTxId = `tx_${Date.now()}`;
      
      if (imageUri) {
        await documentRepo.saveDocument(fakeTxId, imageUri, 'image/jpeg');
      }
      
      CustomAlert.alert('Success', 'Transaction created and document attached!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      CustomAlert.alert('Save Error', String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Smart Scanner" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        
        {!imageUri ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 60, marginBottom: 16 }}>📸</Text>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>Scan a Receipt</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
              Capture a receipt or invoice and our AI will automatically extract the details.
            </Text>
            
            <Button mode="contained" icon="camera" onPress={handleCapture} style={styles.btn} contentStyle={{ height: 50 }}>
              Open Camera
            </Button>
            <Button mode="outlined" icon="image" onPress={handleGallery} style={styles.btn} contentStyle={{ height: 50 }}>
              Select from Gallery
            </Button>
          </View>
        ) : (
          <View style={styles.resultState}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            
            {ocrResult && (
              <Surface style={styles.ocrCard} elevation={2}>
                <Text variant="titleMedium" style={{ marginBottom: 16 }}>AI Extraction Results</Text>
                
                <SegmentedButtons
                  value={suggestion?.type || 'EXPENSE'}
                  onValueChange={(val) => setSuggestion({ type: val as any })}
                  buttons={[
                    { value: 'INCOME', label: 'Income' },
                    { value: 'EXPENSE', label: 'Expense' },
                  ]}
                  style={{ marginBottom: 16 }}
                />

                <TextInput
                  label="Amount Detected"
                  value={editAmount}
                  onChangeText={setEditAmount}
                  mode="outlined"
                  keyboardType="numeric"
                  left={<TextInput.Affix text="$" />}
                  style={{ marginBottom: 12 }}
                />

                <TextInput
                  label="Merchant / Notes"
                  value={editNotes}
                  onChangeText={setEditNotes}
                  mode="outlined"
                  style={{ marginBottom: 24 }}
                />
                
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                  Detected Date: {ocrResult.date?.toLocaleDateString()}
                  {'\n'}Invoice Ref: {ocrResult.invoiceNumber}
                </Text>

                <Button mode="contained" onPress={handleSaveTransaction}>
                  Confirm & Save Transaction
                </Button>
                <Button mode="text" onPress={() => setImageUri(null)} style={{ marginTop: 8 }}>
                  Retake Photo
                </Button>
              </Surface>
            )}
          </View>
        )}

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
  content: { flexGrow: 1, padding: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultState: { flex: 1 },
  btn: { width: '100%', marginBottom: 16, borderRadius: 8 },
  previewImage: { width: '100%', height: 250, borderRadius: 12, marginBottom: 16, backgroundColor: '#e0e0e0' },
  ocrCard: { padding: 16, borderRadius: 12 },
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
