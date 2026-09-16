CREATE TABLE `ledger_accounts` (
	`account_id` text PRIMARY KEY NOT NULL,
	`ledger` text NOT NULL,
	`kind` text NOT NULL,
	`owner` text NOT NULL,
	`flags` integer DEFAULT 0 NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`entry_seq` integer DEFAULT 0 NOT NULL,
	`opened_at` integer NOT NULL,
	CONSTRAINT "ledger_accounts_no_overdraft" CHECK(("ledger_accounts"."flags" & 1) = 0 OR "ledger_accounts"."balance" >= 0)
);
--> statement-breakpoint
CREATE INDEX `ledger_accounts_owner_idx` ON `ledger_accounts` (`ledger`,`owner`);--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`entry_id` text PRIMARY KEY NOT NULL,
	`tx_id` text NOT NULL,
	`account_id` text NOT NULL,
	`leg` integer NOT NULL,
	`amount` integer NOT NULL,
	`seq` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "ledger_entries_nonzero" CHECK("ledger_entries"."amount" <> 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_entries_account_seq_uq` ON `ledger_entries` (`account_id`,`seq`);--> statement-breakpoint
CREATE INDEX `ledger_entries_tx_idx` ON `ledger_entries` (`tx_id`);--> statement-breakpoint
CREATE TABLE `ledger_transactions` (
	`tx_id` text PRIMARY KEY NOT NULL,
	`op_key` text NOT NULL,
	`ledger` text NOT NULL,
	`kind` text NOT NULL,
	`memo` text,
	`meta` text DEFAULT '{}' NOT NULL,
	`effective_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_transactions_op_key_unique` ON `ledger_transactions` (`op_key`);--> statement-breakpoint
CREATE INDEX `ledger_transactions_created_idx` ON `ledger_transactions` (`created_at`);