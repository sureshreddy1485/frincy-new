import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface, TextInput, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { Stack, router } from 'expo-router';
import { SearchService, SearchResult } from '../../src/services/search.service';
import { useAppStore } from '../../src/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../../src/utils/currency';

export default function GlobalSearch() {
  const theme = useTheme();
  const { currentBusiness } = useAppStore();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult>({ customers: [], ledgers: [], transactions: [] });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || !currentBusiness?.id) {
      setResults({ customers: [], ledgers: [], transactions: [] });
      return;
    }

    setIsSearching(true);
    try {
      const res = await SearchService.globalSearch(searchQuery, currentBusiness.id);
      setResults(res);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const hasResults = results.customers.length > 0 || results.ledgers.length > 0 || results.transactions.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ 
        title: 'Global Search',
        headerShown: false // Custom header
      }} />

      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.searchRow}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <TextInput
            mode="outlined"
            placeholder="Search customers, ledgers, amounts..."
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={styles.searchInput}
            left={<TextInput.Icon icon="magnify" />}
            right={query ? <TextInput.Icon icon="close" onPress={() => setQuery('')} /> : null}
          />
        </View>
      </Surface>

      {isSearching && (
        <ActivityIndicator style={{ marginTop: 24 }} size="large" />
      )}

      {!isSearching && query.trim() !== '' && !hasResults && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="text-box-search-outline" size={64} color={theme.colors.outline} />
          <Text variant="titleMedium" style={{ marginTop: 16, color: theme.colors.outline }}>
            No results found for "{query}"
          </Text>
        </View>
      )}

      {!isSearching && hasResults && (
        <FlatList
          contentContainerStyle={styles.listContainer}
          data={[
            ...results.customers.map(c => ({ type: 'customer', data: c })),
            ...results.ledgers.map(l => ({ type: 'ledger', data: l })),
            ...results.transactions.map(t => ({ type: 'transaction', data: t }))
          ]}
          keyExtractor={(item: any) => `${item.type}-${item.data.id}`}
          renderItem={({ item }: any) => {
            if (item.type === 'customer') {
              return (
                <TouchableOpacity onPress={() => router.push(`/customers/${item.data.id}`)}>
                  <Surface style={styles.resultCard}>
                    <MaterialCommunityIcons name="account" size={24} color={theme.colors.primary} />
                    <View style={styles.resultInfo}>
                      <Text variant="titleMedium">{item.data.name}</Text>
                      <Text variant="bodySmall">Customer • {item.data.phone || 'No phone'}</Text>
                    </View>
                  </Surface>
                </TouchableOpacity>
              );
            } else if (item.type === 'ledger') {
              return (
                <TouchableOpacity onPress={() => router.push(`/customers/${item.data.customerId}`)}>
                  <Surface style={styles.resultCard}>
                    <MaterialCommunityIcons name="book-open" size={24} color={theme.colors.secondary} />
                    <View style={styles.resultInfo}>
                      <Text variant="titleMedium">{item.data.name}</Text>
                      <Text variant="bodySmall">Ledger • {item.data.type}</Text>
                    </View>
                  </Surface>
                </TouchableOpacity>
              );
            } else if (item.type === 'transaction') {
              const isIncome = item.data.type === 'income' || item.data.type === 'receive';
              return (
                <TouchableOpacity onPress={() => router.push(`/transactions/${item.data.id}`)}>
                  <Surface style={styles.resultCard}>
                    <MaterialCommunityIcons 
                      name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'} 
                      size={24} 
                      color={isIncome ? 'green' : 'red'} 
                    />
                    <View style={styles.resultInfo}>
                      <Text variant="titleMedium">{item.data.note || 'Transaction'}</Text>
                      <Text variant="bodySmall">
                        {formatCurrency(item.data.amount, currentBusiness?.currency || 'USD')} • {new Date(item.data.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </Surface>
                </TouchableOpacity>
              );
            }
            return null;
          }}
        />
      )}
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 48, // approximate status bar height
    paddingBottom: 16,
    paddingHorizontal: 8,
    elevation: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  resultCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
  },
  resultInfo: {
    marginLeft: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
