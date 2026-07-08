CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`business_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE INDEX `activity_logs_business_id_idx` ON `activity_logs` (`business_id`);--> statement-breakpoint
CREATE INDEX `activity_logs_user_id_idx` ON `activity_logs` (`user_id`);--> statement-breakpoint
CREATE TABLE `app_metadata` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`transaction_id` text NOT NULL,
	`file_url` text NOT NULL,
	`file_type` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `attachments_transaction_id_idx` ON `attachments` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `business_members` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`user_id` text NOT NULL,
	`business_id` text NOT NULL,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `business_members_user_id_idx` ON `business_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `business_members_business_id_idx` ON `business_members` (`business_id`);--> statement-breakpoint
CREATE TABLE `business_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`business_id` text NOT NULL,
	`timezone` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `business_settings_business_id_idx` ON `business_settings` (`business_id`);--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`currency` text NOT NULL,
	`logo_url` text
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `categories_business_id_idx` ON `categories` (`business_id`);--> statement-breakpoint
CREATE TABLE `customer_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE INDEX `customer_groups_business_id_idx` ON `customer_groups` (`business_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`business_id` text NOT NULL,
	`group_id` text,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`balance` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customers_business_id_idx` ON `customers` (`business_id`);--> statement-breakpoint
CREATE INDEX `customers_group_id_idx` ON `customers` (`group_id`);--> statement-breakpoint
CREATE INDEX `customers_phone_idx` ON `customers` (`phone`);--> statement-breakpoint
CREATE INDEX `customers_sync_status_idx` ON `customers` (`sync_status`);--> statement-breakpoint
CREATE INDEX `customers_deleted_at_idx` ON `customers` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`invoice_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` real NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invoice_items_invoice_id_idx` ON `invoice_items` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `invoice_items_product_id_idx` ON `invoice_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`business_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`total` real DEFAULT 0 NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invoices_business_id_idx` ON `invoices` (`business_id`);--> statement-breakpoint
CREATE INDEX `invoices_customer_id_idx` ON `invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `invoices_sync_status_idx` ON `invoices` (`sync_status`);--> statement-breakpoint
CREATE TABLE `ledgers` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`business_id` text NOT NULL,
	`customer_id` text,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ledgers_business_id_idx` ON `ledgers` (`business_id`);--> statement-breakpoint
CREATE INDEX `ledgers_customer_id_idx` ON `ledgers` (`customer_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notifications_user_id_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `products_business_id_idx` ON `products` (`business_id`);--> statement-breakpoint
CREATE INDEX `products_sync_status_idx` ON `products` (`sync_status`);--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`business_id` text NOT NULL,
	`title` text NOT NULL,
	`due_date` integer NOT NULL,
	`status` text NOT NULL,
	`related_id` text
);
--> statement-breakpoint
CREATE INDEX `reminders_business_id_idx` ON `reminders` (`business_id`);--> statement-breakpoint
CREATE TABLE `sync_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`table_name` text NOT NULL,
	`record_id` text NOT NULL,
	`operation` text NOT NULL,
	`payload` text,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`next_retry_at` integer,
	`last_error` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sync_queue_table_idx` ON `sync_queue` (`table_name`);--> statement-breakpoint
CREATE INDEX `sync_queue_record_idx` ON `sync_queue` (`record_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text
);
--> statement-breakpoint
CREATE INDEX `tags_business_id_idx` ON `tags` (`business_id`);--> statement-breakpoint
CREATE TABLE `transaction_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`transaction_id` text NOT NULL,
	`tag_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `transaction_tags_transaction_id_idx` ON `transaction_tags` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `transaction_tags_tag_id_idx` ON `transaction_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`ledger_id` text NOT NULL,
	`category_id` text,
	`customer_id` text,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`date` integer NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE INDEX `transactions_ledger_id_idx` ON `transactions` (`ledger_id`);--> statement-breakpoint
CREATE INDEX `transactions_category_id_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `transactions_customer_id_idx` ON `transactions` (`customer_id`);--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `transactions_sync_status_idx` ON `transactions` (`sync_status`);--> statement-breakpoint
CREATE INDEX `transactions_deleted_at_idx` ON `transactions` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`user_id` text NOT NULL,
	`dark_mode` integer DEFAULT false NOT NULL,
	`language` text DEFAULT 'en' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `user_settings_user_id_idx` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`email` text NOT NULL,
	`phone` text,
	`name` text,
	`avatar_url` text
);
