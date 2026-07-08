import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Appbar, HelperText, Menu, Dialog, Portal, IconButton, Avatar } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerService } from '../../src/services/customer.service';
import { customerGroupService } from '../../src/services/customerGroup.service';
import { customerGroupRepository } from '../../src/repository/customerGroup.repository';
import { CustomerGroup, Customer } from '../../src/database/models';
import { useBusinessStore } from '../../src/store/businessStore';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { CustomAlert } from '../../src/providers/AlertProvider';


const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional(),
  groupId: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { activeBusinessId } = useBusinessStore();

  const [customer, setCustomer] = useState<Customer | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', email: '', address: '', groupId: '' }
  });

  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [folderMenuVisible, setFolderMenuVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [logoDialogVisible, setLogoDialogVisible] = useState(false);
  
  const selectedGroupId = watch('groupId');

  useEffect(() => {
    const loadCustomerAndGroups = async () => {
      if (!activeBusinessId) return;
      try {
        const data = await customerGroupService.getGroups(activeBusinessId);
        setGroups(data);

        const cust = await customerService.getById(id as string);
        if (!cust) throw new Error('Not found');
        setCustomer(cust);
        setAvatarUrl(cust.avatarUrl || null);
        
        reset({
          name: cust.name,
          phone: cust.phone || '',
          email: cust.email || '',
          address: cust.address || '',
          groupId: cust.groupId || '',
        });
      } catch (error) {
        CustomAlert.alert('Error', 'Customer not found.');
        router.back();
      }
    };
    loadCustomerAndGroups();
  }, [id, activeBusinessId, reset]);

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
      if (!activeBusinessId || !customer) return;
      let finalGroupId = data.groupId;
      if (!finalGroupId) {
        const uncat = await customerGroupRepository.getOrCreateUncategorized(activeBusinessId);
        finalGroupId = uncat.id;
      }
      
      await customerService.updateCustomer(activeBusinessId, customer.id, { 
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        groupId: finalGroupId, 
        avatarUrl 
      });
      router.back();
    } catch (error) {
      console.error('Failed to update customer', error);
      CustomAlert.alert('Error', 'Failed to update customer.');
    }
  };

  if (!activeBusinessId || !customer) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Edit Customer" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarContainer}>
          <View>
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={{ width: 80, height: 80, borderRadius: 40 }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <Avatar.Text size={80} label={customer.name.substring(0, 2).toUpperCase()} />
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
                label="Folder"
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
          Save Changes
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  inputContainer: { marginBottom: 16 },
  submitBtn: { marginTop: 16, paddingVertical: 6 },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatarBadge: { position: 'absolute', bottom: -10, right: -10 },
});
