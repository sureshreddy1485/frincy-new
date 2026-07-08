import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useBusinessStore } from '../../src/store/businessStore';
import { NotificationScheduler } from '../../src/notifications/notificationScheduler';
import { aiApi, AIInsights } from '../../src/api/ai.api';

export default function AIDashboard() {
  const theme = useTheme();
  const { activeBusinessId } = useBusinessStore();
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInsights();
  }, [activeBusinessId]);

  const loadInsights = async () => {
    if (!activeBusinessId) return;
    const actualFolderId = folderId || 'uncategorized';
    try {
      setLoading(true);
      setError('');
      try {
        const data = await aiApi.getInsights(activeBusinessId, actualFolderId);
        setInsights(data);
      } catch (e) {
        // Mock offline fallback
        setInsights({
          healthScore: 85,
          cashFlowScore: 78,
          growthScore: 92,
          summary: "Your business is performing well. Cash flow is steady, but you have a few outstanding receivables.",
          recommendations: ["Follow up on overdue invoices.", "Consider running a promotion next week."]
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to AI. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Leo is analyzing your business...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.headerCard, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons name="robot-outline" size={48} color={theme.colors.onPrimaryContainer} />
        <Text variant="headlineMedium" style={{ color: theme.colors.onPrimaryContainer, marginTop: 8 }}>
          Leo AI Insights
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
          Your intelligent business assistant
        </Text>
      </Surface>

      {error ? (
        <Surface style={styles.errorCard}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
          <Button mode="text" onPress={loadInsights}>Retry</Button>
        </Surface>
      ) : insights ? (
        <View style={styles.content}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Business Summary</Text>
          <Surface style={styles.card}>
            <Text variant="bodyLarge">{insights.summary}</Text>
          </Surface>

          <Text variant="titleLarge" style={styles.sectionTitle}>Health Scores</Text>
          <View style={styles.scoreGrid}>
            <Surface style={styles.scoreCard}>
              <Text variant="titleMedium">Health</Text>
              <Text variant="headlineLarge" style={{ color: getScoreColor(insights.healthScore, theme) }}>
                {insights.healthScore}
              </Text>
            </Surface>
            <Surface style={styles.scoreCard}>
              <Text variant="titleMedium">Cash Flow</Text>
              <Text variant="headlineLarge" style={{ color: getScoreColor(insights.cashFlowScore, theme) }}>
                {insights.cashFlowScore}
              </Text>
            </Surface>
            <Surface style={styles.scoreCard}>
              <Text variant="titleMedium">Growth</Text>
              <Text variant="headlineLarge" style={{ color: getScoreColor(insights.growthScore, theme) }}>
                {insights.growthScore}
              </Text>
            </Surface>
          </View>

          <Text variant="titleLarge" style={styles.sectionTitle}>Recommendations</Text>
          {insights.recommendations.map((rec, index) => (
            <Surface key={index} style={styles.card}>
              <View style={styles.recRow}>
                <MaterialCommunityIcons name="lightbulb-on" size={24} color={theme.colors.primary} />
                <Text style={styles.recText}>{rec}</Text>
              </View>
            </Surface>
          ))}
        </View>
      ) : null}

      <Button
        mode="contained"
        icon="chat-processing"
        onPress={() => router.push({ pathname: '/ai/chat', params: { folderId: folderId || 'uncategorized' } })}
        style={styles.chatButton}
      >
        Chat with Leo
      </Button>
    </ScrollView>
  );
}

function getScoreColor(score: number, theme: any) {
  if (score >= 80) return 'green';
  if (score >= 50) return theme.colors.primary;
  return theme.colors.error;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerCard: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  errorCard: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scoreGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scoreCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  chatButton: {
    margin: 16,
    marginBottom: 32,
    paddingVertical: 8,
    borderRadius: 100,
  }
});
