CREATE TABLE `ad_nonces` (
	`id` text PRIMARY KEY NOT NULL,
	`principal_id` text NOT NULL,
	`placement` text NOT NULL,
	`region` text NOT NULL,
	`reward` integer NOT NULL,
	`issued_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`min_ms` integer NOT NULL,
	`redeemed_at` integer
);
--> statement-breakpoint
CREATE INDEX `ad_nonces_principal_idx` ON `ad_nonces` (`principal_id`,`issued_at`);--> statement-breakpoint
CREATE INDEX `ad_nonces_expiry_idx` ON `ad_nonces` (`expires_at`);--> statement-breakpoint
CREATE TABLE `ad_redemptions` (
	`nonce_id` text PRIMARY KEY NOT NULL,
	`principal_id` text NOT NULL,
	`day_key` text NOT NULL,
	`amount` integer NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ad_redemptions_day_idx` ON `ad_redemptions` (`principal_id`,`day_key`);--> statement-breakpoint
CREATE TABLE `principals` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text DEFAULT 'anon' NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`promoted_to` text
);
