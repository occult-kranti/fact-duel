CREATE TABLE `cohort_days` (
	`anon_id` text NOT NULL,
	`install_day` text NOT NULL,
	`day` text NOT NULL,
	`sessions` integer DEFAULT 0 NOT NULL,
	`ms` integer DEFAULT 0 NOT NULL,
	`rounds` integer DEFAULT 0 NOT NULL,
	`matches` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`anon_id`, `day`)
);
