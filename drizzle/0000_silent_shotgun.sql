CREATE TABLE `cache` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cache_expires_idx` ON `cache` (`expires_at`);--> statement-breakpoint
CREATE TABLE `config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` integer NOT NULL,
	`level` text NOT NULL,
	`tool` text,
	`action` text,
	`arguments` text,
	`result` text,
	`error` text,
	`duration` integer,
	`session_id` text,
	`project_id` text,
	`server_id` text,
	`metadata` text
);
--> statement-breakpoint
CREATE INDEX `logs_timestamp_idx` ON `logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `logs_level_idx` ON `logs` (`level`);--> statement-breakpoint
CREATE INDEX `logs_session_idx` ON `logs` (`session_id`);--> statement-breakpoint
CREATE INDEX `logs_tool_idx` ON `logs` (`tool`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`user_id` text DEFAULT '' NOT NULL,
	`username` text,
	`created_at` integer NOT NULL,
	`last_active_at` integer NOT NULL,
	`is_active` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_phone_unique` ON `sessions` (`phone`);--> statement-breakpoint
CREATE INDEX `sessions_phone_idx` ON `sessions` (`phone`);--> statement-breakpoint
CREATE INDEX `sessions_active_idx` ON `sessions` (`is_active`);--> statement-breakpoint
CREATE TABLE `stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`metric_name` text NOT NULL,
	`metric_value` real NOT NULL,
	`timestamp` integer NOT NULL,
	`tags` text
);
--> statement-breakpoint
CREATE INDEX `stats_metric_idx` ON `stats` (`metric_name`);--> statement-breakpoint
CREATE INDEX `stats_timestamp_idx` ON `stats` (`timestamp`);