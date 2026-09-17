CREATE TABLE `identities` (
	`id` text PRIMARY KEY NOT NULL,
	`principal_id` text NOT NULL,
	`provider` text NOT NULL,
	`subject` text NOT NULL,
	`email` text,
	`created_at` integer NOT NULL,
	`last_used_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identities_principal_provider_uq` ON `identities` (`principal_id`,`provider`);--> statement-breakpoint
CREATE INDEX `identities_principal_idx` ON `identities` (`principal_id`);--> statement-breakpoint
CREATE TABLE `magic_links` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`principal_hint` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer
);
--> statement-breakpoint
CREATE INDEX `magic_links_email_idx` ON `magic_links` (`email`,`created_at`);--> statement-breakpoint
CREATE INDEX `magic_links_expiry_idx` ON `magic_links` (`expires_at`);--> statement-breakpoint
CREATE TABLE `match_queue` (
	`principal_id` text PRIMARY KEY NOT NULL,
	`sport` text NOT NULL,
	`mode` text NOT NULL,
	`stake` integer NOT NULL,
	`rating` integer DEFAULT 1000 NOT NULL,
	`enqueued_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`ticket` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `match_queue_lane_idx` ON `match_queue` (`sport`,`mode`,`stake`,`enqueued_at`);--> statement-breakpoint
CREATE TABLE `profile_blobs` (
	`principal_id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`state` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id_hash` text PRIMARY KEY NOT NULL,
	`principal_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE INDEX `sessions_principal_idx` ON `sessions` (`principal_id`);--> statement-breakpoint
CREATE INDEX `sessions_expiry_idx` ON `sessions` (`expires_at`);