CREATE TABLE `payment_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`merchant_reference` text NOT NULL,
	`clerk_user_id` text NOT NULL,
	`comic_id` text NOT NULL,
	`currency` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'created' NOT NULL,
	`capture_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_orders_merchant_reference_unique` ON `payment_orders` (`merchant_reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_orders_capture_id_unique` ON `payment_orders` (`capture_id`);--> statement-breakpoint
CREATE INDEX `payment_orders_user_status_idx` ON `payment_orders` (`clerk_user_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `entitlements_provider_reference_unique` ON `entitlements` (`provider_reference`);