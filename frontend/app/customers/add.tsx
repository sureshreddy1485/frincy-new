import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, useTheme, Appbar, HelperText, Menu, Dialog, Portal } from 'react-native-paper';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerService } from '../../src/services/customer.service';
import { customerGroupService } from '../../src/services/customerGroup.service';
import { customerGroupRepository } from '../../src/repository/customerGroup.repository';
import { CustomerGroup } from '../../src/database/models';
import { useBusinessStore } from '../../src/store/businessStore';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, IconButton } from 'react-native-paper';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional(),
  groupId: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function AddCustomerScreen() {
  const { groupId: initialGroupId } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { activeBusinessId } = useBusinessStore();

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', email: '', address: '', groupId: (initialGroupId as string) || '' }
  });

  const [groups, setGroups] = React.useState<CustomerGroup[]>([]);
  const [folderMenuVisible, setFolderMenuVisible] = React.useState(false);
  const [createDialogVisible, setCreateDialogVisible] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [logoDialogVisible, setLogoDialogVisible] = React.useState(false);
  
  const selectedGroupId = watch('groupId');

  React.useEffect(() => {
    const loadGroups = async () => {
      if (!activeBusinessId) return;
      const data = await customerGroupService.getGroups(activeBusinessId);
      setGroups(data);
    };
    loadGroups();
  }, [activeBusinessId]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !activeBusinessId) return;
    try {
      const newGroup = await customerGroupService.create({
        businessId: activeBusinessId,
        name: newFolderName.trim(),
        description: ''
      });
      setGroups(prev => [...prev, newGroup].sort((a, b) => a.name.localeCompare(b.name)));
      setValue('groupId', newGroup.id);
      setCreateDialogVisible(false);
      setNewFolderName('');
    } catch (e) {
      console.error(e);
    }
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
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      if (!activeBusinessId) return;
      let finalGroupId = data.groupId;
      if (!finalGroupId) {
        const uncat = await customerGroupRepository.getOrCreateUncategorized(activeBusinessId);
        finalGroupId = uncat.id;
      }
      // Offline-first: Save to SQLite directly, sync engine handles the rest later
      await customerService.create({ ...data, groupId: finalGroupId, avatarUrl, businessId: activeBusinessId });
      router.back();
    } catch (error) {
      console.error('Failed to create customer', error);
    }
  };

  if (!activeBusinessId) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add Customer" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarContainer}>
          <View>
            {avatarUrl ? (
              <Avatar.Image size={80} source={{ uri: avatarUrl }} />
            ) : (
              <Avatar.Icon size={80} icon="account" />
            )}
            <IconButton 
              icon="camera-plus" 
              size={24} 
              style={styles.avatarBadge}
              mode="contained"
              onPress={() => setLogoDialogVisible(true)}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Customer Name *"
                mode="flat" style={{ backgroundColor: 'transparent' }}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.name}
              />
              {errors.name && <HelperText type="error">{errors.name.message}</HelperText>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Phone Number"
                mode="flat" style={{ backgroundColor: 'transparent' }}
                keyboardType="phone-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Email Address"
                mode="flat" style={{ backgroundColor: 'transparent' }}
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.email}
              />
              {errors.email && <HelperText type="error">{errors.email.message}</HelperText>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Billing Address"
                mode="flat" style={{ backgroundColor: 'transparent' }}
                multiline
                numberOfLines={3}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            </View>
          )}
        />

        <View style={styles.inputContainer}>
          <Menu
            visible={folderMenuVisible}
            onDismiss={() => setFolderMenuVisible(false)}
            anchor={
              <TextInput
                label="Folder (Optional)"
                mode="flat" style={{ backgroundColor: 'transparent' }}
                value={groups.find(g => g.id === selectedGroupId)?.name || 'Uncategorized'}
                editable={false}
                right={<TextInput.Icon icon="chevron-down" onPress={() => setFolderMenuVisible(true)} />}
                onPressIn={() => setFolderMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              title="+ Create New Folder"
              onPress={() => {
                setFolderMenuVisible(false);
                setCreateDialogVisible(true);
              }}
              titleStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
            />
            {groups.map(g => (
              <Menu.Item 
                key={g.id} 
                title={g.name} 
                onPress={() => {
                  setValue('groupId', g.id);
                  setFolderMenuVisible(false);
                }} 
              />
            ))}
            <Menu.Item 
                title="Uncategorized" 
                onPress={() => {
                  setValue('groupId', '');
                  setFolderMenuVisible(false);
                }} 
            />
          </Menu>
        </View>

        <Button 
          mode="contained" 
          onPress={handleSubmit(onSubmit)} 
          loading={isSubmitting}
          style={styles.submitBtn}
        >
          Save Customer
        </Button>
      </ScrollView>

      <Portal>
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Create New Folder</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Folder Name"
              mode="flat" style={{ backgroundColor: 'transparent' }}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateFolder}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={logoDialogVisible} onDismiss={() => setLogoDialogVisible(false)}>
          <Dialog.Title>Update Profile Picture</Dialog.Title>
          <Dialog.Content>
            <Button icon="camera" onPress={() => handlePickLogo('camera')} style={{ marginVertical: 4, justifyContent: 'flex-start' }}>Take Photo</Button>
            <Button icon="image" onPress={() => handlePickLogo('gallery')} style={{ marginVertical: 4, justifyContent: 'flex-start' }}>Choose from Gallery</Button>
            {avatarUrl && (
              <Button icon="delete" textColor={theme.colors.error} onPress={() => { setAvatarUrl(null); setLogoDialogVisible(false); }} style={{ marginVertical: 4, justifyContent: 'flex-start' }}>Remove Picture</Button>
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

import { Alert } from 'react-native';
import { CustomAlert } from '../../src/providers/AlertProvider';


const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  inputContainer: { marginBottom: 16 },
  submitBtn: { marginTop: 16, paddingVertical: 6 },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatarBadge: { position: 'absolute', bottom: -10, right: -10 },
});
