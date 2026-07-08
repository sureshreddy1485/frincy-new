import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Button, Text, useTheme, Checkbox, Portal, Dialog } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';
import * as Device from 'expo-device';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Dialog State
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');

  const showError = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        rememberMe,
        device: {
          deviceId: Device.osBuildId || Device.modelId || 'unknown_device',
          deviceName: Device.deviceName || 'Unknown Device',
          platform: Device.osName || 'unknown'
        }
      });
      
      const { user, accessToken, refreshToken } = response.data.data;
      await setAuth(user, accessToken, refreshToken, rememberMe);
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error.response?.data?.message;
      showError('Login Failed', msg || 'An error occurred during login. Please try again.');
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
      <Text variant="headlineLarge" style={styles.title}>Welcome to Frincy</Text>
      
      <TextInput
        label="Email / Phone"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        mode="flat"
        style={[styles.input, { backgroundColor: 'transparent' }]}
      />
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        mode="flat"
        theme={{ colors: { background: theme.colors.background, surface: theme.colors.background } }}
        right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
        style={[styles.input, { backgroundColor: 'transparent' }]}
      />

      <View style={styles.rememberRow}>
        <Checkbox.Android
          status={rememberMe ? 'checked' : 'unchecked'}
          onPress={() => setRememberMe(!rememberMe)}
        />
        <Text onPress={() => setRememberMe(!rememberMe)}>Remember Me</Text>
      </View>
      
      <Button mode="contained" onPress={handleLogin} loading={loading} style={styles.button}>
        Sign In
      </Button>

      <Button mode="text" onPress={() => router.push('/auth/forgot')}>
        Forgot Password?
      </Button>
      
      <View style={styles.footer}>
        <Text>Don't have an account? </Text>
        <Button mode="text" compact onPress={() => router.push('/auth/register')}>
          Register
        </Button>
      </View>
      </ScrollView>
      
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{dialogTitle}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{dialogMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logo: { width: 100, height: 100, alignSelf: 'center', marginBottom: 24, borderRadius: 20 },
  title: { marginBottom: 32, textAlign: 'center', fontWeight: 'bold' },
  input: { marginBottom: 16 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  button: { marginTop: 8, marginBottom: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32 }
});
