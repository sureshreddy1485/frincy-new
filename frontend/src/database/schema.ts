import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { SyncStatus } from '../constants/sync.constants';

// Reusable base columns for every synchronized table
const baseColumns = {
  id: text('id').primaryKey(),
  serverId: text('server_id'),
  version: integer('version').notNull().default(1),
  deviceId: text('device_id'),
  updatedBy: text('updated_by'),
  syncStatus: integer('sync_status').notNull().default(SyncStatus.PENDING),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
};

export const appMetadata = sqliteTable('app_metadata', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation').notNull(), // CREATE, UPDATE, DELETE
  payload: text('payload'),
  retryCount: integer('retry_count').notNull().default(0),
  nextRetryAt: integer('next_retry_at'),
  lastError: text('last_error'),
  createdAt: integer('created_at').notNull(),
}, (table) => [
  index('sync_queue_table_idx').on(table.tableName),
  index('sync_queue_record_idx').on(table.recordId),
]);

export const users = sqliteTable('users', {
  ...baseColumns,
  email: text('email').notNull(),
  phone: text('phone'),
  name: text('name'),
  avatarUrl: text('avatar_url'),
});

export const userSettings = sqliteTable('user_settings', {
  ...baseColumns,
  userId: text('user_id').notNull(),
  darkMode: integer('dark_mode', { mode: 'boolean' }).notNull().default(false),
  language: text('language').notNull().default('en'),
}, (table) => [index('user_settings_user_id_idx').on(table.userId)]);

export const businesses = sqliteTable('businesses', {
  ...baseColumns,
  name: text('name').notNull(),
  currency: text('currency').notNull(),
  logoUrl: text('logo_url'),
});

export const businessSettings = sqliteTable('business_settings', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  timezone: text('timezone').notNull(),
}, (table) => [index('business_settings_business_id_idx').on(table.businessId)]);

export const businessMembers = sqliteTable('business_members', {
  ...baseColumns,
  userId: text('user_id').notNull(),
  businessId: text('business_id').notNull(),
  role: text('role').notNull(),
}, (table) => [
  index('business_members_user_id_idx').on(table.userId),
  index('business_members_business_id_idx').on(table.businessId),
]);

export const userPermissions = sqliteTable('user_permissions', {
  ...baseColumns,
  memberId: text('member_id').notNull(),
  businessId: text('business_id').notNull(),
  canEditSettings: integer('can_edit_settings', { mode: 'boolean' }).default(false),
  canManageUsers: integer('can_manage_users', { mode: 'boolean' }).default(false),
  canDeleteData: integer('can_delete_data', { mode: 'boolean' }).default(false),
}, (table) => [
  index('user_permissions_member_id_idx').on(table.memberId),
  index('user_permissions_business_id_idx').on(table.businessId),
]);

export const invitations = sqliteTable('invitations', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  email: text('email'),
  phone: text('phone'),
  role: text('role').notNull().default('STAFF'),
  status: text('status').notNull().default('PENDING'), // PENDING, ACCEPTED, DECLINED, EXPIRED
  token: text('token').notNull(),
}, (table) => [
  index('invitations_business_id_idx').on(table.businessId),
  index('invitations_email_idx').on(table.email),
]);

export const customerGroups = sqliteTable('customer_groups', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
}, (table) => [index('customer_groups_business_id_idx').on(table.businessId)]);

export const customers = sqliteTable('customers', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  groupId: text('group_id'),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  avatarUrl: text('avatar_url'),
  balance: real('balance').notNull().default(0),
}, (table) => [
  index('customers_business_id_idx').on(table.businessId),
  index('customers_group_id_idx').on(table.groupId),
  index('customers_phone_idx').on(table.phone),
  index('customers_sync_status_idx').on(table.syncStatus),
  index('customers_deleted_at_idx').on(table.deletedAt),
]);

export const ledgers = sqliteTable('ledgers', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  customerId: text('customer_id'),
  name: text('name').notNull(),
  type: text('type').notNull(),
}, (table) => [
  index('ledgers_business_id_idx').on(table.businessId),
  index('ledgers_customer_id_idx').on(table.customerId),
]);

export const categories = sqliteTable('categories', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
}, (table) => [index('categories_business_id_idx').on(table.businessId)]);

export const tags = sqliteTable('tags', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  name: text('name').notNull(),
  color: text('color'),
}, (table) => [index('tags_business_id_idx').on(table.businessId)]);

export const transactions = sqliteTable('transactions', {
  ...baseColumns,
  ledgerId: text('ledger_id').notNull(),
  categoryId: text('category_id'),
  customerId: text('customer_id'),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // credit/debit
  date: integer('date').notNull(),
  note: text('note'),
}, (table) => [
  index('transactions_ledger_id_idx').on(table.ledgerId),
  index('transactions_category_id_idx').on(table.categoryId),
  index('transactions_customer_id_idx').on(table.customerId),
  index('transactions_date_idx').on(table.date),
  index('transactions_sync_status_idx').on(table.syncStatus),
  index('transactions_deleted_at_idx').on(table.deletedAt),
]);

export const transactionTags = sqliteTable('transaction_tags', {
  ...baseColumns,
  transactionId: text('transaction_id').notNull(),
  tagId: text('tag_id').notNull(),
}, (table) => [
  index('transaction_tags_transaction_id_idx').on(table.transactionId),
  index('transaction_tags_tag_id_idx').on(table.tagId),
]);

export const attachments = sqliteTable('attachments', {
  ...baseColumns,
  transactionId: text('transaction_id').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
}, (table) => [index('attachments_transaction_id_idx').on(table.transactionId)]);

export const products = sqliteTable('products', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  name: text('name').notNull(),
  price: real('price').notNull().default(0),
  quantity: integer('quantity').notNull().default(0),
}, (table) => [
  index('products_business_id_idx').on(table.businessId),
  index('products_sync_status_idx').on(table.syncStatus),
]);

export const invoices = sqliteTable('invoices', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  customerId: text('customer_id').notNull(),
  total: real('total').notNull().default(0),
  status: text('status').notNull(), // DRAFT, PAID, OVERDUE, CANCELLED
}, (table) => [
  index('invoices_business_id_idx').on(table.businessId),
  index('invoices_customer_id_idx').on(table.customerId),
  index('invoices_sync_status_idx').on(table.syncStatus),
]);

export const invoiceItems = sqliteTable('invoice_items', {
  ...baseColumns,
  invoiceId: text('invoice_id').notNull(),
  productId: text('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(),
}, (table) => [
  index('invoice_items_invoice_id_idx').on(table.invoiceId),
  index('invoice_items_product_id_idx').on(table.productId),
]);

export const activityLogs = sqliteTable('activity_logs', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  metadata: text('metadata'),
}, (table) => [
  index('activity_logs_business_id_idx').on(table.businessId),
  index('activity_logs_user_id_idx').on(table.userId),
]);

export const reminders = sqliteTable('reminders', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  title: text('title').notNull(),
  dueDate: integer('due_date').notNull(),
  status: text('status').notNull(),
  relatedId: text('related_id'),
}, (table) => [
  index('reminders_business_id_idx').on(table.businessId),
]);

export const notifications = sqliteTable('notifications', {
  ...baseColumns,
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
}, (table) => [
  index('notifications_user_id_idx').on(table.userId),
]);

export const folderMembers = sqliteTable('folder_members', {
  ...baseColumns,
  userId: text('user_id').notNull(),
  groupId: text('group_id').notNull(), // maps to customer_groups.id
  role: text('role').notNull(), // MANAGER, WORKER, VIEWER
}, (table) => [
  index('folder_members_user_id_idx').on(table.userId),
  index('folder_members_group_id_idx').on(table.groupId),
]);

export const folderInvites = sqliteTable('folder_invites', {
  ...baseColumns,
  groupId: text('group_id').notNull(),
  token: text('token').notNull(), // ABC-123 or QR token
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, USED, EXPIRED
  usageCount: integer('usage_count').notNull().default(0),
  maxUses: integer('max_uses').notNull().default(1),
  expiresAt: integer('expires_at'),
}, (table) => [
  index('folder_invites_group_id_idx').on(table.groupId),
  index('folder_invites_token_idx').on(table.token),
]);

export const folderPermissions = sqliteTable('folder_permissions', {
  ...baseColumns,
  memberId: text('member_id').notNull().unique(), // maps to folder_members.id
  canView: integer('can_view', { mode: 'boolean' }).notNull().default(true),
  canCreateCustomer: integer('can_create_customer', { mode: 'boolean' }).notNull().default(false),
  canEditCustomer: integer('can_edit_customer', { mode: 'boolean' }).notNull().default(false),
  canDeleteCustomer: integer('can_delete_customer', { mode: 'boolean' }).notNull().default(false),
  canCreateTransaction: integer('can_create_transaction', { mode: 'boolean' }).notNull().default(false),
  canEditTransaction: integer('can_edit_transaction', { mode: 'boolean' }).notNull().default(false),
  canDeleteTransaction: integer('can_delete_transaction', { mode: 'boolean' }).notNull().default(false),
  canExport: integer('can_export', { mode: 'boolean' }).notNull().default(false),
  canManageMembers: integer('can_manage_members', { mode: 'boolean' }).notNull().default(false),
}, (table) => [
  index('folder_permissions_member_id_idx').on(table.memberId),
]);

export const editHistory = sqliteTable('edit_history', {
  ...baseColumns,
  businessId: text('business_id').notNull(),
  userId: text('user_id').notNull(), // ID of person making edit
  userRole: text('user_role').notNull(), // e.g. WORKER, MANAGER
  recordType: text('record_type').notNull(), // Customer, Transaction
  recordId: text('record_id').notNull(),
  previousValue: text('previous_value').notNull(), // JSON
  newValue: text('new_value').notNull(), // JSON
}, (table) => [
  index('edit_history_record_id_idx').on(table.recordId),
  index('edit_history_business_id_idx').on(table.businessId),
]);

export const schemaTables: Record<string, any> = {
  app_metadata: appMetadata,
  sync_queue: syncQueue,
  users: users,
  user_settings: userSettings,
  businesses: businesses,
  business_settings: businessSettings,
  business_members: businessMembers,
  customer_groups: customerGroups,
  customers: customers,
  ledgers: ledgers,
  categories: categories,
  tags: tags,
  transactions: transactions,
  transaction_tags: transactionTags,
  attachments: attachments,
  products: products,
  invoices: invoices,
  invoice_items: invoiceItems,
  activity_logs: activityLogs,
  reminders: reminders,
  notifications: notifications,
  user_permissions: userPermissions,
  invitations: invitations,
  folder_members: folderMembers,
  folder_invites: folderInvites,
  folder_permissions: folderPermissions,
  edit_history: editHistory,
};
