import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { Text, useTheme, Button, Checkbox, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CustomAlert } from '../../src/providers/AlertProvider';
import { useAuthStore } from '../../src/store/authStore';

export default function RecoveryCodeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { recoveryCode, userString, accessToken, refreshToken } = useLocalSearchParams<{ recoveryCode: string, userString?: string, accessToken?: string, refreshToken?: string }>();
  const { setAuth } = useAuthStore();
  const [understood, setUnderstood] = useState(false);

  const handleCopy = async () => {
    if (recoveryCode) {
      await Clipboard.setStringAsync(recoveryCode);
      CustomAlert.alert('Copied', 'Recovery code copied to clipboard');
    }
  };

  const handleDownloadPdf = async () => {
    if (!recoveryCode) return;
    try {
      const html = `
        <html>
          <body style="font-family: sans-serif; padding: 40px;">
            <h1>Frincy Account Recovery Code</h1>
            <p>Keep this document highly secure. Do not share it with anyone.</p>
            <h2 style="padding: 20px; background: #eee; border-radius: 8px;">${recoveryCode}</h2>
          </body>
        </html>
      `;
      await Print.printAsync({ html });
    } catch (e) {
      CustomAlert.alert('Error', 'Failed to generate PDF');
    }
  };

  const handleContinue = async () => {
    if (userString && accessToken && refreshToken) {
      try {
        const user = JSON.parse(userString);
        await setAuth(user, accessToken, refreshToken, true);
        router.replace('/(tabs)');
      } catch (e) {
        router.replace('/auth/login');
      }
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image source={require('../../assets/icon.png')} style={styles.logo} />
      <Text variant="headlineMedium" style={styles.title}>Save Your Recovery Code</Text>
      
      <Text variant="bodyLarge" style={styles.warning}>
        This code is the <Text style={{fontWeight:'bold'}}>only</Text> way to recover your account if you forget your password.
      </Text>
      
      <Text variant="bodyLarge" style={[styles.warning, { color: theme.colors.error }]}>
        It will never be shown again. If you lose both your password and this code, your account cannot be recovered.
      </Text>

      <Surface style={styles.codeContainer} elevation={1}>
        <Text variant="headlineSmall" style={styles.codeText}>{recoveryCode}</Text>
      </Surface>

      <View style={styles.actions}>
        <Button icon="content-copy" mode="outlined" onPress={handleCopy} style={styles.actionBtn}>Copy Code</Button>
        <Button icon="file-pdf-box" mode="outlined" onPress={handleDownloadPdf} style={styles.actionBtn}>Save PDF</Button>
      </View>

      <View style={styles.checkboxContainer}>
        <Checkbox.Android status={understood ? 'checked' : 'unchecked'} onPress={() => setUnderstood(!understood)} />
        <Text style={styles.checkboxText} onPress={() => setUnderstood(!understood)}>
          I understand and I have safely saved my Recovery Code.
        </Text>
      </View>
      
      <Button 
        mode="contained" 
        disabled={!understood} 
        onPress={handleContinue}
        style={styles.continueBtn}
      >
        Continue to App
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  logo: { width: 60, height: 60, alignSelf: 'flex-start', marginBottom: 16, borderRadius: 12 },
  title: { marginBottom: 16, fontWeight: 'bold' },
  warning: { marginBottom: 16, lineHeight: 24 },
  codeContainer: { padding: 24, alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12, marginVertical: 24 },
  codeText: { fontWeight: 'bold', letterSpacing: 2 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  actionBtn: { flex: 0.48 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  checkboxText: { flex: 1, marginLeft: 8 },
  continueBtn: { paddingVertical: 6 }
});
