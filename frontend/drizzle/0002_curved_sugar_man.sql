CREATE TABLE `edit_history` (
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
	`user_role` text NOT NULL,
	`record_type` text NOT NULL,
	`record_id` text NOT NULL,
	`previous_value` text NOT NULL,
	`new_value` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `edit_history_record_id_idx` ON `edit_history` (`record_id`);--> statement-breakpoint
CREATE INDEX `edit_history_business_id_idx` ON `edit_history` (`business_id`);--> statement-breakpoint
CREATE TABLE `folder_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`group_id` text NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`max_uses` integer DEFAULT 1 NOT NULL,
	`expires_at` integer
);
--> statement-breakpoint
CREATE INDEX `folder_invites_group_id_idx` ON `folder_invites` (`group_id`);--> statement-breakpoint
CREATE INDEX `folder_invites_token_idx` ON `folder_invites` (`token`);--> statement-breakpoint
CREATE TABLE `folder_members` (
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
	`group_id` text NOT NULL,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `folder_members_user_id_idx` ON `folder_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `folder_members_group_id_idx` ON `folder_members` (`group_id`);--> statement-breakpoint
CREATE TABLE `folder_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`device_id` text,
	`updated_by` text,
	`sync_status` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`member_id` text NOT NULL,
	`can_view` integer DEFAULT true NOT NULL,
	`can_create_customer` integer DEFAULT false NOT NULL,
	`can_edit_customer` integer DEFAULT false NOT NULL,
	`can_delete_customer` integer DEFAULT false NOT NULL,
	`can_create_transaction` integer DEFAULT false NOT NULL,
	`can_edit_transaction` integer DEFAULT false NOT NULL,
	`can_delete_transaction` integer DEFAULT false NOT NULL,
	`can_export` integer DEFAULT false NOT NULL,
	`can_manage_members` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `folder_permissions_member_id_unique` ON `folder_permissions` (`member_id`);--> statement-breakpoint
CREATE INDEX `folder_permissions_member_id_idx` ON `folder_permissions` (`member_id`);