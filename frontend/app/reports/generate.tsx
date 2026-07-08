import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Appbar, useTheme, Button, Portal, Dialog, RadioButton, Text, IconButton, Menu } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';

import { useBusinessStore } from '../../src/store/businessStore';
import { reportsRepo } from '../../src/reports/reportsRepository';
import { DateRange, DateFilter, getDateFilter } from '../../src/services/dashboard.service';
import { ExportService, ExportFormat } from '../../src/reports/exportService';

const REPORT_NAMES: Record<string, string> = {
  'financial': 'Financial Summary',
  'profit-loss': 'Profit & Loss',
  'cash-flow': 'Cash Flow Statement',
  'customer': 'Customer Summary',
  'ledger': 'Ledger Statement',
  'reminder': 'Reminders Report',
};

export default function GenerateReportScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { activeBusinessId } = useBusinessStore();

  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [loading, setLoading] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);

  const [isDateDialogVisible, setDateDialogVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const title = REPORT_NAMES[type ?? 'financial'] ?? 'Report';

  useEffect(() => {
    generatePreview();
  }, [dateRange, type, activeBusinessId]);

  const generatePreview = async () => {
    if (!activeBusinessId || !type) return;
    setLoading(true);
    setHtmlPreview('');
    setReportData(null);

    try {
      const filter = getDateFilter(dateRange);
      let data: any;
      let html = '';

      switch (type) {
        case 'financial':
          data = await reportsRepo.getFinancialReport(activeBusinessId, filter);
          html = ExportService.previewHtml.financial(data);
          break;
        case 'profit-loss':
          data = await reportsRepo.getProfitLossReport(activeBusinessId, filter);
          html = ExportService.previewHtml.profitLoss(data);
          break;
        case 'cash-flow':
          data = await reportsRepo.getCashFlowReport(activeBusinessId, filter);
          html = ExportService.previewHtml.cashFlow(data);
          break;
        case 'customer':
          data = await reportsRepo.getCustomerReport(activeBusinessId, filter);
          html = ExportService.previewHtml.customer(data);
          break;
        case 'ledger':
          data = await reportsRepo.getLedgerReport(activeBusinessId, filter);
          html = ExportService.previewHtml.ledger(data);
          break;
        case 'reminder':
          data = await reportsRepo.getReminderReport(activeBusinessId);
          html = ExportService.previewHtml.reminder(data);
          break;
        default:
          html = '<h1>Unknown Report Type</h1>';
      }

      setReportData(data);
      setHtmlPreview(html);
    } catch (e) {
      setHtmlPreview(`<h2>Error generating report: ${String(e)}</h2>`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!reportData || !type) return;
    try {
      setLoading(true);
      let uri = '';
      switch (type) {
        case 'financial': uri = await ExportService.exportFinancial(reportData, format); break;
        case 'profit-loss': uri = await ExportService.exportProfitLoss(reportData, format); break;
        case 'cash-flow': uri = await ExportService.exportCashFlow(reportData, format); break;
        case 'customer': uri = await ExportService.exportCustomers(reportData, format); break;
        case 'ledger': uri = await ExportService.exportLedgers(reportData, format); break;
        case 'reminder': uri = await ExportService.exportReminders(reportData, format); break;
      }
      await ExportService.share(uri);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setMenuVisible(false);
    }
  };

  const handlePrint = async () => {
    if (!reportData || !type) return;
    try {
      switch (type) {
        case 'financial': await ExportService.printFinancial(reportData); break;
        case 'profit-loss': await ExportService.printProfitLoss(reportData); break;
        case 'cash-flow': await ExportService.printCashFlow(reportData); break;
        case 'customer': await ExportService.printCustomers(reportData); break;
        case 'ledger': await ExportService.printLedgers(reportData); break;
        case 'reminder': await ExportService.printReminders(reportData); break;
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={title} />
        <Appbar.Action icon="calendar" onPress={() => setDateDialogVisible(true)} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
        >
          <Menu.Item onPress={() => handleExport('pdf')} title="Share as PDF" leadingIcon="file-pdf-box" />
          <Menu.Item onPress={() => handleExport('csv')} title="Share as CSV" leadingIcon="file-excel" />
          <Menu.Item onPress={handlePrint} title="Print" leadingIcon="printer" />
        </Menu>
      </Appbar.Header>

      <View style={styles.content}>
        {loading && !htmlPreview ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>Generating report...</Text>
          </View>
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ html: htmlPreview }}
            style={styles.webview}
            scalesPageToFit={false}
          />
        )}
      </View>

      <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="contained"
          icon="export"
          onPress={() => setMenuVisible(true)}
          style={styles.exportBtn}
          disabled={loading || !reportData}
        >
          Export Options
        </Button>
      </View>

      <Portal>
        <Dialog visible={isDateDialogVisible} onDismiss={() => setDateDialogVisible(false)}>
          <Dialog.Title>Select Period</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={value => {
                setDateRange(value as DateRange);
                setDateDialogVisible(false);
              }}
              value={dateRange}
            >
              <RadioButton.Item label="Today" value="today" />
              <RadioButton.Item label="This Week" value="week" />
              <RadioButton.Item label="This Month" value="month" />
              <RadioButton.Item label="This Year" value="year" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDateDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exportBtn: {
    borderRadius: 8,
    paddingVertical: 4,
  }
});
