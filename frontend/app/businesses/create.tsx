import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, Appbar, HelperText } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { database } from '../../src/database';
import { businesses, businessMembers } from '../../src/database/schema';
import { useAuthStore } from '../../src/store/authStore';
import { useBusinessStore } from '../../src/store/businessStore';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const businessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  currency: z.string().min(3, 'Currency code (e.g. USD, EUR)').max(3),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

export default function CreateBusinessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const { loadBusinesses, setActiveBusiness } = useBusinessStore();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: { name: '', currency: 'USD' }
  });

  const onSubmit = async (data: BusinessFormValues) => {
    if (!user) return;
    try {
      const businessId = generateId();
      
      await database.insert(businesses).values({
        id: businessId,
        name: data.name.trim(),
        currency: data.currency.toUpperCase(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      await database.insert(businessMembers).values({
        id: generateId(),
        businessId: businessId,
        userId: user.id,
        role: 'OWNER',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await loadBusinesses(user.id);
      await setActiveBusiness(businessId);

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to create business', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Action icon="close" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} />
        <Appbar.Content title="Create Business" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>Let's setup your business!</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Create a new business workspace to start tracking your customers and cash flow.
        </Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Business Name *"
                mode="flat"
                style={{ backgroundColor: 'transparent' }}
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
          name="currency"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Currency Code (e.g. USD, EUR) *"
                mode="flat"
                style={{ backgroundColor: 'transparent' }}
                autoCapitalize="characters"
                maxLength={3}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.currency}
              />
              {errors.currency && <HelperText type="error">{errors.currency.message}</HelperText>}
            </View>
          )}
        />

        <Button 
          mode="contained" 
          onPress={handleSubmit(onSubmit)} 
          loading={isSubmitting}
          style={styles.submitBtn}
        >
          Create Workspace
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  submitBtn: {
    marginTop: 24,
    paddingVertical: 6,
  }
});
