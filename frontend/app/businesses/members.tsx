import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, useTheme, Appbar, Surface, Button, IconButton, List, Dialog, Portal, TextInput, SegmentedButtons } from 'react-native-paper';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useBusinessStore } from '../../src/store/businessStore';
import { useAuthStore } from '../../src/store/authStore';
import { businessMemberService } from '../../src/services/businessMembers.service';
import { BusinessMember, Invitation } from '../../src/database/models';
import { CustomAlert } from '../../src/providers/AlertProvider';


export default function BusinessMembersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { activeBusinessId, activeBusinessRole } = useBusinessStore();
  const { user } = useAuthStore();
  const targetBusinessId = id || activeBusinessId;

  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  // Dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteContact, setInviteContact] = useState('');
  const [inviteRole, setInviteRole] = useState('STAFF');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!targetBusinessId) return;
    const m = await businessMemberService.getMembers(targetBusinessId);
    const i = await businessMemberService.getInvitations(targetBusinessId);
    setMembers(m);
    setInvitations(i);
  }, [targetBusinessId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleInvite = async () => {
    if (!targetBusinessId || !inviteContact.trim()) {
      CustomAlert.alert('Required', 'Please enter an email or phone number.');
      return;
    }
    setIsSubmitting(true);
    try {
      const isEmail = inviteContact.includes('@');
      await businessMemberService.inviteUser(targetBusinessId, {
        email: isEmail ? inviteContact : undefined,
        phone: !isEmail ? inviteContact : undefined,
        role: inviteRole
      });
      setInviteOpen(false);
      setInviteContact('');
      setInviteRole('STAFF');
      loadData();
      
      const SyncService = require('../../src/sync/sync.service').SyncService;
      SyncService.runSync().catch(console.error);
    } catch (e: any) {
      console.error(e);
      CustomAlert.alert('Error', e.message || 'Failed to grant access');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = (id: string) => {
    CustomAlert.alert('Revoke Invite', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: async () => {
        await businessMemberService.revokeInvitation(id);
        loadData();
      }}
    ]);
  };

  const handleRemoveMember = (id: string) => {
    CustomAlert.alert('Remove Member', 'Are you sure you want to remove this member?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await businessMemberService.removeMember(id);
        loadData();
      }}
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Members & Roles" />
        {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && (
          <Appbar.Action icon="account-plus" onPress={() => setInviteOpen(true)} />
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Active Members ({members.length})</Text>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {activeBusinessRole === 'OWNER' && (
                      <>
                        <IconButton {...props} icon="pencil" size={20} onPress={() => {}} />
                        <IconButton {...props} icon="delete" size={20} iconColor={theme.colors.error} onPress={() => handleRemoveMember(m.id)} />
                      </>
                    )}
                  </View>
                )}
                style={i < members.length - 1 ? styles.divider : undefined}
              />
            );
          })}
          {members.length === 0 && <List.Item title="No members added yet" />}
        </Surface>

        {invitations.length > 0 && (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>Pending Invitations ({invitations.length})</Text>
            <Surface style={styles.surface} elevation={1}>
              {invitations.map((inv, i) => (
                <List.Item
                  key={inv.id}
                  title={inv.email || inv.phone || 'Unknown'}
                  description={`Role: ${inv.role}`}
                  left={props => <List.Icon {...props} icon="email-outline" />}
                  right={props => (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {activeBusinessRole === 'OWNER' && (
                        <IconButton {...props} icon="delete" size={20} iconColor={theme.colors.error} onPress={() => handleRevoke(inv.id)} />
                      )}
                    </View>
                  )}
                  style={i < invitations.length - 1 ? styles.divider : undefined}
                />
              ))}
            </Surface>
          </>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={inviteOpen} onDismiss={() => setInviteOpen(false)}>
          <Dialog.Title>Grant Access</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
              Enter the email or phone number of the user to send an invitation. They can accept it from their settings.
            </Text>
            <TextInput
              label="Email or Phone Number"
              mode="flat"
              value={inviteContact}
              onChangeText={setInviteContact}
              style={{ marginBottom: 16, backgroundColor: 'transparent' }}
            />
            <Text variant="labelLarge" style={{ marginBottom: 8 }}>Role</Text>
            <SegmentedButtons
              value={inviteRole}
              onValueChange={setInviteRole}
              buttons={[
                { value: 'STAFF', label: 'Staff' },
                { value: 'MANAGER', label: 'Manager' },
              ]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInviteOpen(false)}>Cancel</Button>
            <Button onPress={handleInvite} loading={isSubmitting}>Grant Access</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { marginBottom: 12, fontWeight: '600' },
  surface: { borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)' }
});
