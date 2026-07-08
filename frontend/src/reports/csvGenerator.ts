/**
 * CsvGenerator
 * Converts report data objects to RFC-4180 compliant UTF-8 CSV strings.
 * No external dependencies.
 * Reusable by AI, scheduled reports, cloud export, and email modules.
 */

import {
  FinancialReport,
  CashFlowReport,
  CustomerReport,
  LedgerReport,
  ProfitLossReport,
  ReminderReport,
  TransactionRow,
} from './reportsRepository';
import { formatCompactCurrency } from '../dashboard/useDashboard';

// ─── CSV primitives ───────────────────────────────────────────────────────────

function escapeCell(val: unknown): string {
  const str = val === null || val === undefined ? '' : String(val);
  // Wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(...cells: unknown[]): string {
  return cells.map(escapeCell).join(',');
}

function header(businessId: string, title: string, from: Date, to: Date): string {
  return [
    row('Report', title),
    row('Business ID', businessId),
    row('Period', `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`),
    row('Generated', new Date().toLocaleString()),
    '',
  ].join('\n');
}

function txTable(rows: TransactionRow[]): string {
  const head = row('Date', 'Type', 'Ledger', 'Category', 'Amount', 'Note');
  const body = rows.map((r) =>
    row(
      r.date.toLocaleDateString(),
      r.type,
      r.ledgerName,
      r.categoryName,
      r.amount.toFixed(2),
      r.note,
    ),
  );
  return [head, ...body].join('\n');
}

// ─── Generators ───────────────────────────────────────────────────────────────

export function generateFinancialCsv(report: FinancialReport): string {
  const { meta, summary, transactions } = report;
  const { from, to } = meta.dateFilter;

  const summarySection = [
    row('Income', summary.income.toFixed(2)),
    row('Expense', summary.expense.toFixed(2)),
    row(summary.profit > 0 ? 'Net Profit' : summary.profit < 0 ? 'Net Loss' : 'Break Even', Math.abs(summary.profit).toFixed(2)),
    row('Total Receivable', summary.totalReceivable.toFixed(2)),
    row('Total Payable', summary.totalPayable.toFixed(2)),
    '',
  ].join('\n');

  const txSection = txTable(transactions);

  return [header(meta.businessId, meta.title, from, to), summarySection, txSection].join('\n');
}

export function generateCashFlowCsv(report: CashFlowReport): string {
  const { meta, totalInflows, totalOutflows, closingBalance, rows } = report;
  const { from, to } = meta.dateFilter;

  const summarySection = [
    row('Total Inflows', totalInflows.toFixed(2)),
    row('Total Outflows', totalOutflows.toFixed(2)),
    row('Closing Balance', closingBalance.toFixed(2)),
    '',
  ].join('\n');

  return [header(meta.businessId, meta.title, from, to), summarySection, txTable(rows)].join('\n');
}

export function generateCustomerCsv(report: CustomerReport): string {
  const { meta, summary, rows } = report;
  const { from, to } = meta.dateFilter;

  const summarySection = [
    row('Total Customers', summary.total),
    row('With Due', summary.withDue),
    row('With Credit', summary.withCredit),
    row('Total Receivable', summary.totalReceivable.toFixed(2)),
    row('Total Payable', summary.totalPayable.toFixed(2)),
    '',
  ].join('\n');

  const tableHead = row('Name', 'Phone', 'Email', 'Balance', 'Transactions', 'Last Activity');
  const tableBody = rows.map((r) =>
    row(
      r.name,
      r.phone,
      r.email,
      r.balance.toFixed(2),
      r.totalTransactions,
      r.lastActivityDate?.toLocaleDateString() ?? '—',
    ),
  );

  return [
    header(meta.businessId, meta.title, from, to),
    summarySection,
    [tableHead, ...tableBody].join('\n'),
  ].join('\n');
}

export function generateLedgerCsv(report: LedgerReport): string {
  const { meta, rows, totals } = report;
  const { from, to } = meta.dateFilter;

  const summarySection = [
    row('Total Income', totals.totalIncome.toFixed(2)),
    row('Total Expense', totals.totalExpense.toFixed(2)),
    row(totals.totalIncome - totals.totalExpense > 0 ? 'Net Profit' : totals.totalIncome - totals.totalExpense < 0 ? 'Net Loss' : 'Break Even', Math.abs(totals.totalIncome - totals.totalExpense).toFixed(2)),
    '',
  ].join('\n');

  const tableHead = row('Ledger', 'Type', 'Income', 'Expense', 'Closing Balance', 'Transactions');
  const tableBody = rows.map((r) =>
    row(r.name, r.type, r.totalIncome.toFixed(2), r.totalExpense.toFixed(2), r.closingBalance.toFixed(2), r.transactionCount),
  );

  return [
    header(meta.businessId, meta.title, from, to),
    summarySection,
    [tableHead, ...tableBody].join('\n'),
  ].join('\n');
}

export function generateProfitLossCsv(report: ProfitLossReport): string {
  const { meta, income, expense, netProfit, incomeByCategory, expenseByCategory } = report;
  const { from, to } = meta.dateFilter;

  const summarySection = [
    row('Total Income', income.toFixed(2)),
    row('Total Expense', expense.toFixed(2)),
    row(netProfit > 0 ? 'Net Profit' : netProfit < 0 ? 'Net Loss' : 'Break Even', Math.abs(netProfit).toFixed(2)),
    '',
    'Income by Category',
    row('Category', 'Amount', 'Transactions'),
    ...incomeByCategory.map((c) => row(c.name, c.amount.toFixed(2), c.count)),
    '',
    'Expense by Category',
    row('Category', 'Amount', 'Transactions'),
    ...expenseByCategory.map((c) => row(c.name, c.amount.toFixed(2), c.count)),
  ].join('\n');

  return [header(meta.businessId, meta.title, from, to), summarySection].join('\n');
}

export function generateReminderCsv(report: ReminderReport): string {
  const { meta, pending, overdue } = report;
  const now = new Date();

  const pendingSection = [
    'PENDING REMINDERS',
    row('Title', 'Due Date', 'Status'),
    ...pending.map((r) => row(r.title, r.dueDate.toLocaleDateString(), r.status)),
    '',
    'OVERDUE REMINDERS',
    row('Title', 'Due Date', 'Status'),
    ...overdue.map((r) => row(r.title, r.dueDate.toLocaleDateString(), r.status)),
  ].join('\n');

  return [header(meta.businessId, meta.title, new Date(0), now), pendingSection].join('\n');
}
