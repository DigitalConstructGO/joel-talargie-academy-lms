CREATE TABLE `account_link_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`purpose` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_link_tokens_token_hash_unique` ON `account_link_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `account_link_tokens_user_idx` ON `account_link_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `account_link_tokens_expires_idx` ON `account_link_tokens` (`expires_at`);