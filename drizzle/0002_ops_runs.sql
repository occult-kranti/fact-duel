CREATE TABLE `ops_flags` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ops_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`ok` integer DEFAULT 0 NOT NULL,
	`detail` text
);
--> statement-breakpoint
CREATE INDEX `ops_runs_kind_idx` ON `ops_runs` (`kind`,`started_at`);