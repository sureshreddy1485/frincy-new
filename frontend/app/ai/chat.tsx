import React, { useState, useRef, useEffect, memo } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Surface, TextInput, IconButton, useTheme, ActivityIndicator, Appbar } from 'react-native-paper';
import { useBusinessStore } from '../../src/store/businessStore';
import { useSyncStore } from '../../src/store/syncStore';
import { aiApi } from '../../src/api/ai.api';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_SUGGESTIONS = [
  "Who owes me the most?",
  "Today's sales",
  "Outstanding balance",
  "This month's profit",
  "Low stock items",
  "Show overdue customers"
];

const TypingIndicator = () => {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 500 }), withTiming(0.3, { duration: 500 })),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.loadingContainer}>
      <Surface style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer, marginLeft: 16 }]}>
        <MaterialCommunityIcons name="robot" size={20} color={theme.colors.onPrimaryContainer} />
      </Surface>
      <Surface style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: theme.colors.surfaceVariant, paddingHorizontal: 24, paddingVertical: 16 }]}>
        <Animated.View style={[animatedStyle, { flexDirection: 'row', gap: 4, alignItems: 'center' }]}>
          <View style={[styles.dot, { backgroundColor: theme.colors.onSurfaceVariant }]} />
          <View style={[styles.dot, { backgroundColor: theme.colors.onSurfaceVariant }]} />
          <View style={[styles.dot, { backgroundColor: theme.colors.onSurfaceVariant }]} />
        </Animated.View>
      </Surface>
    </View>
  );
};

const ChatBubble = memo(({ item, theme }: { item: Message, theme: any }) => {
  const isUser = item.role === 'user';
  return (
    <Animated.View 
      entering={FadeInDown.duration(300)}
      style={[
        styles.messageWrapper,
        isUser ? styles.userWrapper : styles.assistantWrapper
      ]}
    >
      {!isUser && (
        <Surface style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name="robot" size={20} color={theme.colors.onPrimaryContainer} />
        </Surface>
      )}
      
      <View style={{ maxWidth: '100%' }}>
        <Surface style={[
          styles.messageBubble,
          isUser 
            ? [styles.userBubble, { backgroundColor: theme.colors.primary }]
            : [styles.assistantBubble, { backgroundColor: theme.colors.surfaceVariant }]
        ]}>
          <Text style={{ 
            color: isUser ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
            fontSize: 15,
            lineHeight: 22
          }}>
            {item.content}
          </Text>
        </Surface>
        <Text style={[styles.timestamp, { 
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          color: theme.colors.onSurfaceVariant 
        }]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
});

export default function AIChat() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeBusinessId } = useBusinessStore();
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const isOnline = useSyncStore(s => s.isOnline);
  const addLog = useSyncStore(s => s.addLog);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm Leo 👋\n\nI can help you understand your business, customers, sales, expenses, and cash flow.\n\nAsk me anything.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const handleSendPrompt = async (prompt: string) => {
    if (!prompt.trim() || !activeBusinessId || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (!isOnline) {
        throw new Error('OFFLINE');
      }

      const actualFolderId = folderId || 'uncategorized';
      const response = await aiApi.chat(activeBusinessId, actualFolderId, userMsg.content);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      addLog({ event: 'SYNC_COMPLETED', message: 'AI Chat successful', timestamp: Date.now() });
    } catch (error: any) {
      let errorMsg = 'An unexpected error occurred.';
      
      if (error.message === 'OFFLINE') {
        errorMsg = "I am operating in offline mode right now, but you can still record transactions and manage customers safely!";
        addLog({ event: 'SYNC_FAILED', message: 'AI Chat failed: Device offline', timestamp: Date.now() });
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMsg = "Authentication failed. You might not have access to this folder.";
        addLog({ event: 'SYNC_FAILED', message: `AI Chat Auth Error: ${error.response?.status}`, timestamp: Date.now() });
      } else if (error.response?.status >= 500 || error.message.includes('Network')) {
        errorMsg = "The server is temporarily unavailable. Please try again later.";
        addLog({ event: 'SYNC_FAILED', message: `AI Chat Server Error: ${error.message}`, timestamp: Date.now() });
      } else {
        errorMsg = `Error: ${error.message || 'Could not reach servers.'}`;
        addLog({ event: 'SYNC_FAILED', message: `AI Chat Error: ${error.message}`, timestamp: Date.now() });
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderConnectionStatus = () => {
    let color = theme.colors.error;
    let label = 'Offline';
    if (isOnline) {
      color = '#22c55e'; // Green
      label = 'Online';
    }
    return (
      <View style={styles.connectionIndicator}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Surface style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.colors.surface }]} elevation={2}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <View style={styles.headerTitleContainer}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Chat with Leo</Text>
            {renderConnectionStatus()}
          </View>
          <View style={{ width: 48 }} />
        </View>
      </Surface>
      
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.chatContainer, { paddingBottom: 24 }]}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => <ChatBubble item={item} theme={theme} />}
        ListFooterComponent={() => (
          <>
            {messages.length === 1 && (
              <Animated.View entering={FadeIn.delay(500)} style={styles.suggestionsContainer}>
                <Text variant="labelMedium" style={[styles.suggestionTitle, { color: theme.colors.onSurfaceVariant }]}>
                  Try asking:
                </Text>
                <View style={styles.chipWrapper}>
                  {QUICK_SUGGESTIONS.map(s => (
                    <TouchableOpacity 
                      key={s} 
                      style={[styles.suggestionChip, { backgroundColor: theme.colors.secondaryContainer }]}
                      onPress={() => handleSendPrompt(s)}
                      disabled={isLoading}
                    >
                      <Text style={{ color: theme.colors.onSecondaryContainer }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}
            {isLoading && <TypingIndicator />}
          </>
        )}
      />

      <Surface style={[styles.inputContainer, { 
        borderTopColor: theme.colors.outlineVariant,
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 24)
      }]}>
        <TextInput
          mode="outlined"
          placeholder="Ask Leo about your business..."
          value={input}
          onChangeText={setInput}
          style={styles.input}
          multiline
          maxLength={500}
          right={<TextInput.Icon icon="send" disabled={!input.trim() || isLoading} onPress={() => handleSendPrompt(input)} />}
        />
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chatContainer: {
    padding: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  assistantWrapper: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 2,
    marginBottom: 16,
  },
  messageBubble: {
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 1,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  suggestionsContainer: {
    marginTop: 8,
    marginLeft: 42,
    marginBottom: 24,
  },
  suggestionTitle: {
    marginBottom: 8,
    opacity: 0.8,
  },
  chipWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    marginBottom: 4,
  },
  inputContainer: {
    padding: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    elevation: 8,
  },
  input: {
    maxHeight: 120,
    justifyContent: 'center',
  }
});
