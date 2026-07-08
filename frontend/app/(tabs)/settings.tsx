import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput as RNTextInput, Keyboard } from 'react-native';
import { Appbar, List, Switch, useTheme, Divider, Avatar, Text, Surface, IconButton, Dialog, Portal, TextInput, Button, Searchbar } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppStore } from '../../src/store';
import { useAuthStore } from '../../src/store/authStore';
import { useSyncStore } from '../../src/store/syncStore';
import { useBusinessStore } from '../../src/store/businessStore';
import { database } from '../../src/database';
import { customers, ledgers, products, invoices } from '../../src/database/schema';
import { eq, sql } from 'drizzle-orm';
import * as ImagePicker from 'expo-image-picker';
import { CustomAlert } from '../../src/providers/AlertProvider';


export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isDarkMode, activeTheme, setTheme } = useAppStore();
  const { user, logout } = useAuthStore();
  const { status: syncStatus, lastSyncedAt } = useSyncStore();
  const { businessesList, activeBusinessId, activeBusinessRole, setActiveBusiness } = useBusinessStore();

  const [isSwitcherVisible, setSwitcherVisible] = useState(false);
  const [themeDialogVisible, setThemeDialogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const showItem = (title: string, desc?: string) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return title.toLowerCase().includes(q) || (desc && desc.toLowerCase().includes(q));
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      let Updates: any;
      try { Updates = require('expo-updates'); } catch (e) { throw new Error('Updates not supported in this environment'); }
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        CustomAlert.alert(
          'Update Available',
          'A new version is available. Install now?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Update', onPress: async () => { await Updates.fetchUpdateAsync(); await Updates.reloadAsync(); } }
          ]
        );
      } else {
        CustomAlert.alert('Up to Date', 'You are running the latest version.');
      }
    } catch (e: any) {
      CustomAlert.alert('Error', e.message || 'Could not check for updates.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const lastSync = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString()
    : 'Never';

  const activeBusiness = businessesList.find(b => b.id === activeBusinessId);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 0 }}>
        {searchVisible ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
            <RNTextInput
              autoFocus
              placeholder="Search settings..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, fontSize: 16, paddingHorizontal: 8, paddingVertical: 8, color: theme.colors.onSurface }}
            />
            <IconButton
              icon="close"
              size={20}
              onPress={() => { setSearchVisible(false); setSearchQuery(''); Keyboard.dismiss(); }}
            />
          </View>
        ) : (
          <>
            <Appbar.Content title="Settings" style={{ paddingLeft: 16 }} />
            <Appbar.Action icon="magnify" onPress={() => setSearchVisible(true)} />
          </>
        )}
      </Appbar.Header>

      <ScrollView>

        {/* ── Profile List Item ─────────────────────────────────────────────── */}
        {user && (
          <List.Item
            title={user.name ?? 'User'}
            description={user.email?.endsWith('@phone.frincy.app') ? (user.phone || user.email.replace('@phone.frincy.app', '')) : `${user.email} ${user.phone ? `• ${user.phone}` : ''}`}
            left={() => (
              <TouchableOpacity onPress={() => (router as any).push('/settings/profile')}>
                {user.avatarUrl ? (
                  <Avatar.Image size={48} source={{ uri: user.avatarUrl }} style={{ marginLeft: 16, marginTop: 4 }} />
                ) : (
                  <Avatar.Text size={48} label={(user.name ?? 'U').slice(0, 2).toUpperCase()} style={{ backgroundColor: theme.colors.primary, marginLeft: 16, marginTop: 4 }} />
                )}
              </TouchableOpacity>
            )}
            right={(p) => <IconButton {...p} icon="chevron-right" onPress={() => (router as any).push('/settings/profile')} />}
            onPress={() => (router as any).push('/settings/profile')}
            style={{ paddingVertical: 12 }}
          />
        )}


        {/* ── Current Workspace ─────────────────────────────────────────────── */}
        {activeBusiness && (
          <List.Item
            title={activeBusiness.name}
            description={`Role: ${activeBusinessRole || 'Unknown'}`}
            left={() => (
              <Avatar.Text size={40} label={activeBusiness.name.slice(0, 1)} style={{ marginLeft: 16, backgroundColor: theme.colors.secondaryContainer }} />
            )}
            right={(p) => <Button onPress={() => setSwitcherVisible(true)}>Switch</Button>}
            style={{ paddingVertical: 12 }}
          />
        )}

        <Divider />

        {/* ── Tools & Services ─────────────────────────────────────────────── */}
        {showItem('Global Search', 'Search everything across your business') && (
          <List.Section>
            <List.Subheader>Tools & Services</List.Subheader>
            {showItem('Global Search', 'Search everything across your business') && (
              <List.Item
                title="Global Search"
                description="Search everything across your business"
                left={(p) => <List.Icon {...p} icon="magnify" />}
                onPress={() => (router as any).push('/search')}
              />
            )}
          </List.Section>
        )}


        <Divider />

        {/* ── Business ─────────────────────────────────────────────────── */}
        {(showItem('Business Settings & Sharing', 'Manage your business, invite team members, and set roles') || showItem('Join Shared Folder', 'Enter an invite code or scan a QR to join a folder')) && (
          <List.Section>
            <List.Subheader>Business & Team</List.Subheader>
            {showItem('Business Settings & Sharing', 'Manage your business, invite team members, and set roles') && (
              <List.Item
                title="Business Settings & Sharing"
                description="Manage your business, invite team members, and set roles"
                left={(p) => <List.Icon {...p} icon="store-cog" />}
                onPress={() => (router as any).push('/businesses/settings')}
              />
            )}
            {showItem('Join Shared Folder', 'Enter an invite code or scan a QR to join a folder') && (
              <List.Item
                title="Join Shared Folder"
                description="Enter an invite code or scan a QR to join a folder"
                left={(p) => <List.Icon {...p} icon="folder-account" />}
                onPress={() => (router as any).push('/join')}
              />
            )}
          </List.Section>
        )}

        <Divider />

        {/* ── Preferences ─────────────────────────────────────────────────── */}
        {(showItem('Theme', 'Select your preferred application theme') || showItem('Language', 'English (US)') || showItem('Notifications', 'Manage push notifications and alerts')) && (
          <List.Section>
            <List.Subheader>Preferences</List.Subheader>
            {showItem('Theme', 'Select your preferred application theme') && (
              <List.Item
                title="Theme"
                description="Select your preferred application theme"
                left={(p) => <List.Icon {...p} icon="palette" />}
                onPress={() => setThemeDialogVisible(true)}
              />
            )}
            {showItem('Language', 'English (US)') && (
              <List.Item
                title="Language"
                description="English (US)"
                left={(p) => <List.Icon {...p} icon="translate" />}
                onPress={() => {}}
              />
            )}
            {showItem('Notifications', 'Manage push notifications and alerts') && (
              <List.Item
                title="Notifications"
                description="Manage push notifications and alerts"
                left={(p) => <List.Icon {...p} icon="bell-outline" />}
                onPress={() => (router as any).push('/settings/notifications')}
              />
            )}
          </List.Section>
        )}

        <Divider />

        {/* ── Sync & Data ─────────────────────────────────────────────────── */}
        {(showItem('Import Center', 'Import customers, ledgers, or transactions') || showItem('Sync Status', `${syncStatus} · Last: ${lastSync}`) || showItem('Export Data', 'Export all your business data') || showItem('Backup & Restore', 'Create or restore secure local backups')) && (
          <List.Section>
            <List.Subheader>Sync & Data</List.Subheader>
            {showItem('Import Center', 'Import customers, ledgers, or transactions') && (
              <List.Item
                title="Import Center"
                description="Import customers, ledgers, or transactions"
                left={(p) => <List.Icon {...p} icon="database-import" />}
                onPress={() => (router as any).push('/settings/import')}
              />
            )}
            {showItem('Sync Status', `${syncStatus} · Last: ${lastSync}`) && (
              <List.Item
                title="Sync Status"
                description={`${syncStatus} · Last: ${lastSync}`}
                left={(p) => <List.Icon {...p} icon="cloud-sync" />}
                onPress={() => (router as any).push('/settings/sync')}
              />
            )}
            {showItem('Export Data', 'Export all your business data') && (
              <List.Item
                title="Export Data"
                description="Export all your business data"
                left={(p) => <List.Icon {...p} icon="file-export" />}
                onPress={() => {}}
              />
            )}
            {showItem('Backup & Restore', 'Create or restore secure local backups') && (
              <List.Item
                title="Backup & Restore"
                description="Create or restore secure local backups"
                left={(p) => <List.Icon {...p} icon="database-sync" />}
                onPress={() => (router as any).push('/settings/backup')}
              />
            )}
          </List.Section>
        )}

        <Divider />

        {/* ── Security ───────────────────────────────────────────────────── */}
        {(showItem('Security Settings', 'Password, recovery code, sessions') || showItem('Active Sessions', 'Manage devices logged into your account')) && (
          <List.Section>
            <List.Subheader>Security</List.Subheader>
            {showItem('Security Settings', 'Password, recovery code, sessions') && (
              <List.Item
                title="Security Settings"
                description="Password, recovery code, sessions"
                left={(p) => <List.Icon {...p} icon="shield-lock" />}
                onPress={() => (router as any).push('/settings/security')}
              />
            )}
            {showItem('Active Sessions', 'Manage devices logged into your account') && (
              <List.Item
                title="Active Sessions"
                description="Manage devices logged into your account"
                left={(p) => <List.Icon {...p} icon="devices" />}
                onPress={() => (router as any).push('/settings/sessions')}
              />
            )}
          </List.Section>
        )}

        <Divider />

        {/* ── About & Support ────────────────────────────────────────────── */}
        {(showItem('Privacy Policy') || showItem('Terms of Service') || showItem('About Frincy', 'Version 1.0.0') || showItem('Check for Updates', 'Download the latest OTA update')) && (
          <List.Section>
            <List.Subheader>About & Support</List.Subheader>
            {showItem('Privacy Policy') && (
              <List.Item
                title="Privacy Policy"
                left={(p) => <List.Icon {...p} icon="shield-account" />}
                onPress={() => (router as any).push('/settings/privacy')}
              />
            )}
            {showItem('Terms of Service') && (
              <List.Item
                title="Terms of Service"
                left={(p) => <List.Icon {...p} icon="file-document-outline" />}
                onPress={() => (router as any).push('/settings/terms')}
              />
            )}
            {showItem('About Frincy', 'Version 1.0.0') && (
              <List.Item
                title="About Frincy"
                description="Version 1.0.0"
                left={(p) => <List.Icon {...p} icon="information-outline" />}
                onPress={() => (router as any).push('/settings/about')}
              />
            )}
            {showItem('Check for Updates', 'Download the latest OTA update') && (
              <List.Item
                title="Check for Updates"
                description="Download the latest OTA update"
                left={(p) => <List.Icon {...p} icon="cloud-download" />}
                onPress={handleCheckUpdate}
              />
            )}
          </List.Section>
        )}

        <Divider />

        {/* ── Account ────────────────────────────────────────────────────── */}
        {showItem('Sign Out') && (
          <List.Section>
            <List.Subheader>Account</List.Subheader>
            <List.Item
              title="Sign Out"
              left={(p) => <List.Icon {...p} icon="logout" color={theme.colors.error} />}
              titleStyle={{ color: theme.colors.error }}
              onPress={logout}
            />
          </List.Section>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Business Switcher Dialog */}
      <Portal>
        <Dialog visible={isSwitcherVisible} onDismiss={() => setSwitcherVisible(false)}>
          <Dialog.Title>Switch Workspace</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView>
              {businessesList.map(b => (
                <List.Item
                  key={b.id}
                  title={b.name}
                  description={b.currency}
                  left={() => (
                    b.logoUrl ? 
                      <Avatar.Image size={40} source={{ uri: b.logoUrl }} style={{ marginLeft: 16 }} /> :
                      <Avatar.Text size={40} label={b.name.slice(0,1).toUpperCase()} style={{ marginLeft: 16 }} />
                  )}
                  onPress={() => {
                    setActiveBusiness(b.id);
                    setSwitcherVisible(false);
                  }}
                  style={activeBusinessId === b.id ? { backgroundColor: theme.colors.secondaryContainer } : undefined}
                />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => {
              setSwitcherVisible(false);
              (router as any).push('/businesses/settings');
            }}>
              Manage
            </Button>
            <Button onPress={() => {
              setSwitcherVisible(false);
              (router as any).push('/businesses/create');
            }}>
              Create New
            </Button>
            <Button onPress={() => setSwitcherVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
        
        {/* Theme Selection Dialog */}
        <Dialog visible={themeDialogVisible} onDismiss={() => setThemeDialogVisible(false)}>
          <Dialog.Title>Select Theme</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView>
              <List.Subheader>Light Themes</List.Subheader>
              <List.Item
                title="Classic Light"
                onPress={() => { setTheme('classic-light'); setThemeDialogVisible(false); }}
                right={p => activeTheme === 'classic-light' ? <List.Icon {...p} icon="check" color={theme.colors.primary} /> : null}
              />
              <List.Item
                title="Soft Slate"
                onPress={() => { setTheme('soft-slate'); setThemeDialogVisible(false); }}
                right={p => activeTheme === 'soft-slate' ? <List.Icon {...p} icon="check" color={theme.colors.primary} /> : null}
              />
              <List.Item
                title="Warm Cream"
                onPress={() => { setTheme('warm-cream'); setThemeDialogVisible(false); }}
                right={p => activeTheme === 'warm-cream' ? <List.Icon {...p} icon="check" color={theme.colors.primary} /> : null}
              />
              <Divider />
              <List.Subheader>Dark Themes</List.Subheader>
              <List.Item
                title="Classic Dark"
                onPress={() => { setTheme('classic-dark'); setThemeDialogVisible(false); }}
                right={p => activeTheme === 'classic-dark' ? <List.Icon {...p} icon="check" color={theme.colors.primary} /> : null}
              />
              <List.Item
                title="Midnight Navy"
                onPress={() => { setTheme('midnight-navy'); setThemeDialogVisible(false); }}
                right={p => activeTheme === 'midnight-navy' ? <List.Icon {...p} icon="check" color={theme.colors.primary} /> : null}
              />
              <List.Item
                title="Graphite"
                onPress={() => { setTheme('graphite'); setThemeDialogVisible(false); }}
                right={p => activeTheme === 'graphite' ? <List.Icon {...p} icon="check" color={theme.colors.primary} /> : null}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setThemeDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, justifyContent: 'space-between', gap: 12 },
  statBox: { flexBasis: '46%', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  profileItem: { paddingVertical: 12 },
});
