/**
 * ExportService
 * Orchestrates PDF, CSV, and future XLSX exports.
 * Uses expo-print for PDF rendering and expo-sharing for distribution.
 * Extensible: future email/cloud modules can call generatePdfUri() directly.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import {
  FinancialReport,
  CashFlowReport,
  CustomerReport,
  LedgerReport,
  ProfitLossReport,
  ReminderReport,
} from './reportsRepository';
import {
  generateFinancialPdf,
  generateProfitLossPdf,
  generateCashFlowPdf,
  generateCustomerPdf,
  generateLedgerPdf,
  generateReminderPdf,
} from './pdfGenerator';
import {
  generateFinancialCsv,
  generateCashFlowCsv,
  generateCustomerCsv,
  generateLedgerCsv,
  generateProfitLossCsv,
  generateReminderCsv,
} from './csvGenerator';

export type ExportFormat = 'pdf' | 'csv';

// ─── PDF ──────────────────────────────────────────────────────────────────────

async function printHtml(html: string): Promise<void> {
  await Print.printAsync({ html });
}

async function savePdf(html: string, filename: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html });
  // Move to a named file for sharing
  const dest = `${FileSystem.documentDirectory}${filename}.pdf`;
  await FileSystem.moveAsync({ from: uri, to: dest });
  return dest;
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

async function saveCsv(csv: string, filename: string): Promise<string> {
  const path = `${FileSystem.documentDirectory}${filename}.csv`;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  return path;
}

// ─── Share ────────────────────────────────────────────────────────────────────

async function shareFile(uri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const ExportService = {
  // Financial
  async exportFinancial(report: FinancialReport, format: ExportFormat): Promise<string> {
    const slug = `financial_${Date.now()}`;
    if (format === 'pdf') return savePdf(generateFinancialPdf(report), slug);
    return saveCsv(generateFinancialCsv(report), slug);
  },

  async printFinancial(report: FinancialReport): Promise<void> {
    await printHtml(generateFinancialPdf(report));
  },
  
  async printProfitLoss(report: ProfitLossReport): Promise<void> {
    await printHtml(generateProfitLossPdf(report));
  },
  
  async printCashFlow(report: CashFlowReport): Promise<void> {
    await printHtml(generateCashFlowPdf(report));
  },
  
  async printCustomers(report: CustomerReport): Promise<void> {
    await printHtml(generateCustomerPdf(report));
  },
  
  async printLedgers(report: LedgerReport): Promise<void> {
    await printHtml(generateLedgerPdf(report));
  },
  
  async printReminders(report: ReminderReport): Promise<void> {
    await printHtml(generateReminderPdf(report));
  },

  // Profit & Loss
  async exportProfitLoss(report: ProfitLossReport, format: ExportFormat): Promise<string> {
    const slug = `profit_loss_${Date.now()}`;
    if (format === 'pdf') return savePdf(generateProfitLossPdf(report), slug);
    return saveCsv(generateProfitLossCsv(report), slug);
  },

  // Cash Flow
  async exportCashFlow(report: CashFlowReport, format: ExportFormat): Promise<string> {
    const slug = `cash_flow_${Date.now()}`;
    if (format === 'pdf') return savePdf(generateCashFlowPdf(report), slug);
    return saveCsv(generateCashFlowCsv(report), slug);
  },

  // Customers
  async exportCustomers(report: CustomerReport, format: ExportFormat): Promise<string> {
    const slug = `customers_${Date.now()}`;
    if (format === 'pdf') return savePdf(generateCustomerPdf(report), slug);
    return saveCsv(generateCustomerCsv(report), slug);
  },

  // Ledgers
  async exportLedgers(report: LedgerReport, format: ExportFormat): Promise<string> {
    const slug = `ledgers_${Date.now()}`;
    if (format === 'pdf') return savePdf(generateLedgerPdf(report), slug);
    return saveCsv(generateLedgerCsv(report), slug);
  },

  // Reminders
  async exportReminders(report: ReminderReport, format: ExportFormat): Promise<string> {
    const slug = `reminders_${Date.now()}`;
    if (format === 'pdf') return savePdf(generateReminderPdf(report), slug);
    return saveCsv(generateReminderCsv(report), slug);
  },

  // Sharing
  async share(uri: string): Promise<void> {
    await shareFile(uri);
  },

  // Generic PDF preview (returns HTML for WebView)
  previewHtml: {
    financial: generateFinancialPdf,
    profitLoss: generateProfitLossPdf,
    cashFlow: generateCashFlowPdf,
    customer: generateCustomerPdf,
    ledger: generateLedgerPdf,
    reminder: generateReminderPdf,
  },
};
