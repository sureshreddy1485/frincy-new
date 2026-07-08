import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, useTheme, Appbar, TextInput, Button, Avatar, Dialog, Portal } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { businessRepository } from '../../src/repository/business.repository';
import { Business } from '../../src/database/models';
import { useAuthStore } from '../../src/store/authStore';
import { database } from '../../src/database';
import { businessMembers } from '../../src/database/schema';
import { and, eq } from 'drizzle-orm';
import { useBusinessStore } from '../../src/store/businessStore';
import { CustomAlert } from '../../src/providers/AlertProvider';


export default function BusinessEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { businessesList, setActiveBusiness, loadBusinesses, activeBusinessId } = useBusinessStore();
  const { user } = useAuthStore();

  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [logoDialogVisible, setLogoDialogVisible] = useState(false);
  const [activeBusinessRole, setActiveBusinessRole] = useState('VIEWER');

  useEffect(() => {
    if (!id) return;
    const fetchBiz = async () => {
      try {
        const record = await businessRepository.getBusinessById(id);
        if (record) {
          setBusiness(record);
          setName(record.name);
          setCurrency(record.currency);
          setLogoUrl(record.logoUrl || null);
          
          if (user) {
            const res = await database.select({ role: businessMembers.role }).from(businessMembers)
              .where(and(eq(businessMembers.businessId, id), eq(businessMembers.userId, user.id)));
            if (res.length > 0) setActiveBusinessRole(res[0].role);
          }
        }
      } catch (error) {
        console.error(error);
        router.back();
      }
    };
    fetchBiz();
  }, [id]);

  const handleUpdate = async () => {
    if (!business || !name.trim()) return;
    await businessRepository.update(business.id, { name, currency, logoUrl });
    if (user) await loadBusinesses(user.id);
    setIsEditing(false);
    CustomAlert.alert('Success', 'Business updated.');
  };

  const handlePickLogo = async (mode: 'camera' | 'gallery') => {
    setLogoDialogVisible(false);
    let result;
    if (mode === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        CustomAlert.alert('Permission Denied', 'Camera permission is required.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    }

    if (!result.canceled) {
      setLogoUrl(result.assets[0].uri);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setLogoDialogVisible(false);
  };

  const handleDelete = () => {
    CustomAlert.alert('Delete Business', 'This will delete the business from your device.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          if (!business) return;
          await businessRepository.delete(business.id);
          if (user) {
            await loadBusinesses(user.id);
          }
          if (activeBusinessId === business.id) {
            setActiveBusiness('');
          }
          router.replace('/businesses/settings');
        }
      }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Business Profile" />
        {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && !isEditing && (
          <Appbar.Action icon="pencil" onPress={() => setIsEditing(true)} />
        )}
      </Appbar.Header>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <TouchableOpacity onPress={() => {
            if ((activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && isEditing) {
              setLogoDialogVisible(true);
            }
          }} disabled={!isEditing}>
            {logoUrl ? (
              <Avatar.Image size={100} source={{ uri: logoUrl }} />
            ) : (
              <Avatar.Text size={100} label={name ? name.slice(0, 2).toUpperCase() : 'BZ'} />
            )}
            {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && isEditing && (
              <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: theme.colors.onPrimary, fontSize: 12 }}>Edit</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TextInput
          label="Business Name"
          value={name}
          onChangeText={setName}
          mode="flat"
          style={[styles.input, { backgroundColor: 'transparent' }]}
          disabled={!isEditing || activeBusinessRole === 'VIEWER' || activeBusinessRole === 'WORKER'}
        />
        
        <TextInput
          label="Currency"
          value={currency}
          onChangeText={setCurrency}
          mode="flat"
          style={[styles.input, { backgroundColor: 'transparent' }]}
          disabled={!isEditing || activeBusinessRole === 'VIEWER' || activeBusinessRole === 'WORKER'}
        />

        {(activeBusinessRole === 'OWNER' || activeBusinessRole === 'MANAGER') && isEditing && (
          <View style={{ flexDirection: 'row', gap: 12, marginVertical: 8 }}>
            <Button mode="outlined" onPress={() => setIsEditing(false)} style={[styles.button, { flex: 1 }]}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleUpdate} style={[styles.button, { flex: 1 }]}>
              Save Changes
            </Button>
          </View>
        )}

        <Button 
          mode="contained-tonal" 
          icon="account-group" 
          onPress={() => router.push(`/businesses/members?id=${id}`)} 
          style={[styles.button, { marginTop: 16 }]}
        >
          Manage Members & Permissions
        </Button>

        {activeBusinessRole === 'OWNER' && (
          <Button mode="outlined" textColor={theme.colors.error} onPress={handleDelete} style={[styles.button, { marginTop: 32, borderColor: theme.colors.error }]}>
            Delete Business
          </Button>
        )}
      </View>

      <Portal>
        <Dialog visible={logoDialogVisible} onDismiss={() => setLogoDialogVisible(false)}>
          <Dialog.Title>Update Logo</Dialog.Title>
          <Dialog.Content>
            <Button icon="camera" onPress={() => handlePickLogo('camera')} style={styles.dialogBtn}>Take Photo</Button>
            <Button icon="image" onPress={() => handlePickLogo('gallery')} style={styles.dialogBtn}>Choose from Gallery</Button>
            {logoUrl && (
              <Button icon="delete" textColor={theme.colors.error} onPress={handleRemoveLogo} style={styles.dialogBtn}>Remove Logo</Button>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  input: { marginBottom: 16 },
  button: { marginVertical: 8, paddingVertical: 6 },
  logoContainer: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  dialogBtn: { justifyContent: 'flex-start', marginVertical: 4 }
});
