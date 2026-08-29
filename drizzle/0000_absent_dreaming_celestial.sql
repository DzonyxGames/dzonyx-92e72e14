CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`comic_id` text NOT NULL,
	`kind` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`position` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assets_object_key_unique` ON `assets` (`object_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `assets_comic_position_unique` ON `assets` (`comic_id`,`position`);--> statement-breakpoint
CREATE INDEX `assets_comic_kind_idx` ON `assets` (`comic_id`,`kind`);--> statement-breakpoint
CREATE TABLE `comics` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`collection_name` text NOT NULL,
	`issue_number` integer NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price_eur_cents` integer DEFAULT 50 NOT NULL,
	`price_usd_cents` integer DEFAULT 50 NOT NULL,
	`included_in_pass` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`cover_asset_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comics_slug_unique` ON `comics` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `comics_collection_issue_unique` ON `comics` (`collection_name`,`issue_number`);--> statement-breakpoint
CREATE INDEX `comics_status_updated_idx` ON `comics` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` text PRIMARY KEY NOT NULL,
	`clerk_user_id` text NOT NULL,
	`comic_id` text,
	`kind` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`provider_reference` text,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`comic_id`) REFERENCES `comics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `entitlements_user_status_idx` ON `entitlements` (`clerk_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `entitlements_comic_user_idx` ON `entitlements` (`comic_id`,`clerk_user_id`);--> statement-breakpoint
CREATE TABLE `store_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`pass_name` text DEFAULT 'Dzonyx Universe Pass' NOT NULL,
	`pass_eur_cents` integer DEFAULT 200 NOT NULL,
	`pass_usd_cents` integer DEFAULT 250 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
