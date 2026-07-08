CREATE TABLE `invitations` (
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
	`email` text,
	`phone` text,
	`role` text DEFAULT 'STAFF' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`token` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invitations_business_id_idx` ON `invitations` (`business_id`);--> statement-breakpoint
CREATE INDEX `invitations_email_idx` ON `invitations` (`email`);--> statement-breakpoint
CREATE TABLE `user_permissions` (
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
	`business_id` text NOT NULL,
	`can_edit_settings` integer DEFAULT false,
	`can_manage_users` integer DEFAULT false,
	`can_delete_data` integer DEFAULT false
);
--> statement-breakpoint
CREATE INDEX `user_permissions_member_id_idx` ON `user_permissions` (`member_id`);--> statement-breakpoint
CREATE INDEX `user_permissions_business_id_idx` ON `user_permissions` (`business_id`);