import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from './schema';

export type Business = InferSelectModel<typeof schema.businesses>;
export type NewBusiness = InferInsertModel<typeof schema.businesses>;

export type BusinessMember = InferSelectModel<typeof schema.businessMembers>;
export type NewBusinessMember = InferInsertModel<typeof schema.businessMembers>;

export type UserPermission = InferSelectModel<typeof schema.userPermissions>;
export type NewUserPermission = InferInsertModel<typeof schema.userPermissions>;

export type Invitation = InferSelectModel<typeof schema.invitations>;
export type NewInvitation = InferInsertModel<typeof schema.invitations>;

export type Customer = InferSelectModel<typeof schema.customers>;
export type NewCustomer = InferInsertModel<typeof schema.customers>;

export type CustomerGroup = InferSelectModel<typeof schema.customerGroups>;
export type NewCustomerGroup = InferInsertModel<typeof schema.customerGroups>;

export type Ledger = InferSelectModel<typeof schema.ledgers>;
export type NewLedger = InferInsertModel<typeof schema.ledgers>;

export type Transaction = InferSelectModel<typeof schema.transactions>;
export type NewTransaction = InferInsertModel<typeof schema.transactions>;

export type Attachment = InferSelectModel<typeof schema.attachments>;
export type NewAttachment = InferInsertModel<typeof schema.attachments>;

export type Product = InferSelectModel<typeof schema.products>;
export type NewProduct = InferInsertModel<typeof schema.products>;

export type Reminder = InferSelectModel<typeof schema.reminders>;
export type NewReminder = InferInsertModel<typeof schema.reminders>;

export type Notification = InferSelectModel<typeof schema.notifications>;
export type NewNotification = InferInsertModel<typeof schema.notifications>;

export type Invoice = InferSelectModel<typeof schema.invoices>;
export type NewInvoice = InferInsertModel<typeof schema.invoices>;
export type InvoiceItem = InferSelectModel<typeof schema.invoiceItems>;
export type NewInvoiceItem = InferInsertModel<typeof schema.invoiceItems>;
