import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, List, useTheme, Switch, Text, Dialog, Portal, Button, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { apiClient } from '../../src/api/client';
import * as SecureStore from 'expo-secure-store';
import { CustomAlert } from '../../src/providers/AlertProvider';


export default function SecuritySettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isRememberMe, setAuth, user, accessToken, refreshToken, logout } = useAuthStore();

  const [passwordDialog, setPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [recoveryDialog, setRecoveryDialog] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');

  const handleToggleRemember = async () => {
    const newVal = !isRememberMe;
    if (!user || !accessToken || !refreshToken) return;
    
    if (newVal) {
      await setAuth(user, accessToken, refreshToken, true);
    } else {
      // Clear persistence, but keep in memory
      await SecureStore.deleteItemAsync('auth_user');
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      // Hacky way to update store state without logging out
      useAuthStore.setState({ isRememberMe: false });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      return CustomAlert.alert('Error', 'Passwords do not match');
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      CustomAlert.alert('Success', 'Password changed successfully');
      setPasswordDialog(false);
    } catch (e: any) {
      CustomAlert.alert('Error', e.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecovery = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/recovery-code', {
        currentPassword: recoveryPassword
      });
      const { recoveryCode } = res.data.data;
      setRecoveryDialog(false);
      router.push({ pathname: '/auth/recovery', params: { recoveryCode } });
    } catch (e: any) {
      CustomAlert.alert('Error', e.response?.data?.message || 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = () => {
    CustomAlert.alert('Logout All Devices', 'Are you sure you want to log out of all active sessions?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout All', 
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete('/auth/sessions');
            await logout();
          } catch (e) {
            CustomAlert.alert('Error', 'Failed to logout devices');
          }
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Security" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <List.Section>
          <List.Subheader>Authentication</List.Subheader>
          <List.Item
            title="Remember Me"
            description="Keep me logged in automatically"
            left={props => <List.Icon {...props} icon="login" />}
            right={() => <Switch value={isRememberMe} onValueChange={handleToggleRemember} />}
          />
          <List.Item
            title="Change Password"
            left={props => <List.Icon {...props} icon="lock-reset" />}
            onPress={() => setPasswordDialog(true)}
          />
          <List.Item
            title="Generate Recovery Code"
            description="Invalidates your old code"
            left={props => <List.Icon {...props} icon="shield-key" />}
            onPress={() => setRecoveryDialog(true)}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Devices</List.Subheader>
          <List.Item
            title="Active Sessions"
            description="Manage devices logged into your account"
            left={props => <List.Icon {...props} icon="devices" />}
            onPress={() => router.push('/settings/sessions')}
          />
          <List.Item
            title="Logout Current Device"
            left={props => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
            titleStyle={{ color: theme.colors.error }}
            onPress={logout}
          />
          <List.Item
            title="Logout All Devices"
            left={props => <List.Icon {...props} icon="logout-variant" color={theme.colors.error} />}
            titleStyle={{ color: theme.colors.error }}
            onPress={handleLogoutAll}
          />
        </List.Section>
      </ScrollView>

      <Portal>
        <Dialog visible={passwordDialog} onDismiss={() => setPasswordDialog(false)}>
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry mode="outlined" style={styles.input} />
            <TextInput label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry mode="outlined" style={styles.input} />
            <TextInput label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry mode="outlined" style={styles.input} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPasswordDialog(false)}>Cancel</Button>
            <Button onPress={handleChangePassword} loading={loading}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={recoveryDialog} onDismiss={() => setRecoveryDialog(false)}>
          <Dialog.Title>Generate Recovery Code</Dialog.Title>
          <Dialog.Content>
            <Text style={{marginBottom: 16}}>This will invalidate your old recovery code immediately.</Text>
            <TextInput label="Current Password" value={recoveryPassword} onChangeText={setRecoveryPassword} secureTextEntry mode="outlined" />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRecoveryDialog(false)}>Cancel</Button>
            <Button onPress={handleGenerateRecovery} loading={loading}>Generate</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingVertical: 8 },
  input: { marginBottom: 12 }
});
