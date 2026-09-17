CREATE TABLE `daily_marks` (
	`key` text PRIMARY KEY NOT NULL,
	`principal_id` text NOT NULL,
	`kind` text NOT NULL,
	`at` integer NOT NULL
);
