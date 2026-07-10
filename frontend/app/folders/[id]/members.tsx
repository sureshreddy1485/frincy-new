import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, useTheme, Appbar, List, Surface, IconButton, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { folderMemberService } from '../../../src/services/folderMember.service';
import { useBusinessStore } from '../../../src/store/businessStore';
import { useAuthStore } from '../../../src/store/authStore';
import { CustomAlert } from '../../../src/providers/AlertProvider';


export default function FolderMembersScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { activeBusinessId, activeBusinessRole } = useBusinessStore();
  const { user } = useAuthStore();

  const [members, setMembers] = useState<any[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [userIdInput, setUserIdInput] = useState('');
  const [role, setRole] = useState('WORKER'); // Default role
  const [loading, setLoading] = useState(false);

  const loadMembers = async () => {
    if (!activeBusinessId || !id || id === 'uncategorized') return;
    try {
      const data = await folderMemberService.getMembers(activeBusinessId, id as string);
      setMembers(data);
    } catch (e: any) {
      CustomAlert.alert('Error', e.message);
      router.back();
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [id])
  );

  const handleAddMember = async () => {
    if (!userIdInput.trim()) {
      CustomAlert.alert('Required', 'Please enter an email or phone number.');
      return;
    }
    setLoading(true);
    try {
      await folderMemberService.addMember(activeBusinessId!, id as string, userIdInput.trim(), role);
      setInviteOpen(false);
      setUserIdInput('');
      loadMembers();
    } catch (e: any) {
      CustomAlert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    CustomAlert.alert('Remove Member', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive',
        onPress: async () => {
          try {
            await folderMemberService.removeMember(activeBusinessId!, id as string, memberId);
            loadMembers();
          } catch(e: any) {
            CustomAlert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Folder Members" />
        {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && (
          <Appbar.Action icon="account-plus" onPress={() => setInviteOpen(true)} />
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.surface} elevation={1}>
          {members.map((m, i) => {
            const isMe = m.userId === user?.id;
            const isUUID = m.userId.length === 36 && m.userId.includes('-');
            const fallbackName = isUUID ? 'Team Member' : m.userId;
            const displayName = isMe 
              ? (user?.name || user?.email || user?.phone || fallbackName)
              : ((m as any).user?.name || (m as any).user?.email || (m as any).user?.phone || fallbackName);

            return (
              <List.Item
                key={m.id}
                title={displayName}
                description={isMe ? `Role: ${m.role} (You)` : `Role: ${m.role}`}
                left={props => <List.Icon {...props} icon="account" />}
                right={props => (
                  activeBusinessRole === 'OWNER' ? (
                    <IconButton 
                      {...props} 
                      icon="delete" 
                      size={20} 
                      iconColor={theme.colors.error} 
                      onPress={() => handleRemoveMember(m.id)} 
                    />
                  ) : null
                )}
                style={i < members.length - 1 ? styles.divider : undefined}
              />
            )
          })}
          {members.length === 0 && <List.Item title="No members shared with this folder." />}
        </Surface>
      </ScrollView>

      <Portal>
        <Dialog visible={inviteOpen} onDismiss={() => setInviteOpen(false)}>
          <Dialog.Title>Add Member</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 16 }}>Grant user access to this specific folder.</Text>
            <TextInput
              label="Email or Phone Number"
              mode="flat"
              value={userIdInput}
              onChangeText={setUserIdInput}
              style={{ marginBottom: 16, backgroundColor: 'transparent' }}
            />
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button mode={role === 'MANAGER' ? 'contained' : 'outlined'} onPress={() => setRole('MANAGER')} style={{flex:1}}>Manager</Button>
              <Button mode={role === 'WORKER' ? 'contained' : 'outlined'} onPress={() => setRole('WORKER')} style={{flex:1}}>Worker</Button>
              <Button mode={role === 'VIEWER' ? 'contained' : 'outlined'} onPress={() => setRole('VIEWER')} style={{flex:1}}>Viewer</Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInviteOpen(false)}>Cancel</Button>
            <Button onPress={handleAddMember} loading={loading}>Grant Access</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  surface: { borderRadius: 12, overflow: 'hidden' },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
});
