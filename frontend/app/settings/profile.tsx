import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, useTheme, Avatar, Text, Surface, IconButton, TextInput, Button } from 'react-native-paper';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useBusinessStore } from '../../src/store/businessStore';
import { database } from '../../src/database';
import { customers, ledgers, products, invoices } from '../../src/database/schema';
import { eq, sql } from 'drizzle-orm';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const { businessesList, activeBusinessId } = useBusinessStore();

  const [stats, setStats] = useState({ customers: 0, transactions: 0, products: 0, invoices: 0 });
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null);

  const memberSince = user?.createdAt ? new Date(user.createdAt * 1000).toLocaleDateString() : 'Today';

  useFocusEffect(
    useCallback(() => {
      if (activeBusinessId) {
        const loadStats = async () => {
          const custRes = await database.select({ count: sql<number>`count(*)` }).from(customers).where(eq(customers.businessId, activeBusinessId));
          const ledgRes = await database.select({ count: sql<number>`count(*)` }).from(ledgers).where(eq(ledgers.businessId, activeBusinessId));
          const prodRes = await database.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.businessId, activeBusinessId));
          const invRes = await database.select({ count: sql<number>`count(*)` }).from(invoices).where(eq(invoices.businessId, activeBusinessId));
          
          setStats({
            customers: custRes[0].count,
            transactions: ledgRes[0].count,
            products: prodRes[0].count,
            invoices: invRes[0].count,
          });
        };
        loadStats();
      }
    }, [activeBusinessId])
  );

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleSaveProfile = () => {
    if (user) {
      useAuthStore.setState({ user: { ...user, name: profileForm.name, phone: profileForm.phone, avatarUrl: avatarUrl as string } as any });
      // In a real app, write to users table and trigger sync queue
    }
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="My Profile" />
        <Button onPress={handleSaveProfile}>Save</Button>
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={handlePickImage} style={{ marginBottom: 12 }}>
            {avatarUrl ? (
              <Avatar.Image size={100} source={{ uri: avatarUrl }} />
            ) : (
              <Avatar.Text size={100} label={(user?.name ?? 'U').slice(0, 2).toUpperCase()} style={{ backgroundColor: theme.colors.primary }} />
            )}
            <View style={{ position: 'absolute', bottom: -5, right: -5, backgroundColor: theme.colors.surface, borderRadius: 12, padding: 2 }}>
              <IconButton icon="camera" size={20} style={{ margin: 0 }} />
            </View>
          </TouchableOpacity>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Member since {memberSince}
          </Text>
        </View>

        <TextInput
          label="Name"
          value={profileForm.name}
          onChangeText={text => setProfileForm(f => ({ ...f, name: text }))}
          mode="flat"
          style={{ backgroundColor: 'transparent', marginBottom: 16 }}
        />
        <TextInput
          label="Phone Number"
          value={profileForm.phone}
          onChangeText={text => setProfileForm(f => ({ ...f, phone: text }))}
          mode="flat"
          keyboardType="phone-pad"
          style={{ backgroundColor: 'transparent', marginBottom: 24 }}
        />

        <Text variant="titleMedium" style={{ marginBottom: 16, fontWeight: 'bold' }}>My Statistics</Text>

        <View style={styles.statsContainer}>
          <TouchableOpacity style={[styles.statBox, { backgroundColor: theme.colors.surface }]} onPress={() => router.push('/businesses/settings')}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>{businessesList.length}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Businesses</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statBox, { backgroundColor: theme.colors.surface }]} onPress={() => router.push('/(tabs)/customers')}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>{stats.customers}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Customers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statBox, { backgroundColor: theme.colors.surface }]} onPress={() => router.push('/')}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>{stats.transactions}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statBox, { backgroundColor: theme.colors.surface }]} onPress={() => router.push('/')}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>{stats.products + stats.invoices}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Items</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  statBox: { flexBasis: '47%', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 1 },
});
