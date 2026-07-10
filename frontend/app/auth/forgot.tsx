import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Button, Text, useTheme, Portal, Dialog, HelperText, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/api/client';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  // Dialog State
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');

  const showError = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogVisible(true);
  };

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      return showError('Error', 'Passwords do not match');
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', {
        email,
        recoveryCode,
        newPassword,
        confirmPassword
      });
      
      showError('Success', 'Password reset successfully. Please login with your new password.');
    } catch (error: any) {
      // Intentionally generic per rules
      showError('Error', 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]} keyboardShouldPersistTaps="handled">
      <Image source={require('../../assets/icon.png')} style={styles.logo} />
      <Text variant="headlineMedium" style={styles.title}>Account Recovery</Text>
      
      <TextInput
        label="Email / Phone"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        mode="flat"
        style={[styles.input, { backgroundColor: 'transparent' }]}
      />

      <TextInput
        label="Recovery Code (XXXX...)"
        value={recoveryCode}
        onChangeText={setRecoveryCode}
        autoCapitalize="characters"
        mode="flat"
        style={[styles.input, { backgroundColor: 'transparent' }]}
      />
      
      <TextInput
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry={!showPassword}
        mode="flat"
        theme={{ colors: { background: theme.colors.background, surface: theme.colors.background } }}
        right={
          <TextInput.Icon
            icon={() => (
              <View style={{ flexDirection: 'row', alignItems: 'center', width: 72, marginLeft: -32 }}>
                <IconButton icon="information-outline" size={24} onPress={() => setShowPasswordRules(!showPasswordRules)} style={{ margin: 0 }} />
                <IconButton icon={showPassword ? "eye-off" : "eye"} size={24} onPress={() => setShowPassword(!showPassword)} style={{ margin: 0 }} />
              </View>
            )}
          />
        }
        style={[styles.input, { backgroundColor: 'transparent', marginBottom: showPasswordRules ? 0 : 16 }]}
      />
      {showPasswordRules && (
        <HelperText type="info" visible={showPasswordRules} style={{ marginBottom: 16 }}>
          Min 8 characters, 1 capital, 1 number, 1 special character.
        </HelperText>
      )}

      <TextInput
        label="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showPassword}
        mode="flat"
        theme={{ colors: { background: theme.colors.background, surface: theme.colors.background } }}
        style={[styles.input, { backgroundColor: 'transparent' }]}
      />
      
      <Button mode="contained" onPress={handleReset} loading={loading} style={styles.button}>
        Reset Password
      </Button>

      <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }}>
        Back to Login
      </Button>
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => {
          setDialogVisible(false);
          if (dialogTitle === 'Success') router.replace('/auth/login');
        }}>
          <Dialog.Title>{dialogTitle}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{dialogMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setDialogVisible(false);
              if (dialogTitle === 'Success') router.replace('/auth/login');
            }}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logo: { width: 80, height: 80, alignSelf: 'center', marginBottom: 20, borderRadius: 16 },
  title: { marginBottom: 32, textAlign: 'center', fontWeight: 'bold' },
  input: { marginBottom: 16 },
  button: { marginTop: 16 }
});
