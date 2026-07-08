import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Button, Text, useTheme, Portal, Dialog, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/api/client';

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      return showError('Error', 'Passwords do not match');
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        confirmPassword
      });
      
      const { user, accessToken, refreshToken, recoveryCode } = response.data.data;
      
      // Navigate to Recovery Code screen
      router.replace({
        pathname: '/auth/recovery',
        params: { 
          recoveryCode, 
          userString: JSON.stringify(user), 
          accessToken, 
          refreshToken 
        }
      });
    } catch (error: any) {
      showError('Registration Failed', error.response?.data?.message || 'Unknown error');
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
      <Text variant="headlineLarge" style={styles.title}>Create Account</Text>
      
      <TextInput
        label="Full Name"
        value={name}
        onChangeText={setName}
        mode="flat"
        style={[styles.input, { backgroundColor: 'transparent' }]}
      />

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
        left={<TextInput.Icon icon="information-outline" onPress={() => setShowPasswordRules(!showPasswordRules)} />}
        right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
        style={[styles.input, { backgroundColor: 'transparent', marginBottom: showPasswordRules ? 0 : 16 }]}
      />
      {showPasswordRules && (
        <HelperText type="info" visible={showPasswordRules} style={{ marginBottom: 16 }}>
          Min 8 characters, 1 capital, 1 number, 1 special character.
        </HelperText>
      )}

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showPassword}
        mode="flat"
        theme={{ colors: { background: theme.colors.background, surface: theme.colors.background } }}
        style={[styles.input, { backgroundColor: 'transparent' }]}
      />
      
      <Button mode="contained" onPress={handleRegister} loading={loading} style={styles.button}>
        Register
      </Button>

      <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }}>
        Already have an account? Sign In
      </Button>
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
  logo: { width: 80, height: 80, alignSelf: 'center', marginBottom: 20, borderRadius: 16 },
  title: { marginBottom: 32, textAlign: 'center', fontWeight: 'bold' },
  input: { marginBottom: 16 },
  button: { marginTop: 16 }
});
