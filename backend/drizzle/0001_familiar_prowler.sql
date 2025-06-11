PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_agent_metrics_24h` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` integer NOT NULL,
	`timestamp` text DEFAULT 'CURRENT_TIMESTAMP',
	`cpu_usage` real,
	`cpu_cores` integer,
	`cpu_model` text,
	`memory_total` integer,
	`memory_used` integer,
	`memory_free` integer,
	`memory_usage_rate` real,
	`load_1` real,
	`load_5` real,
	`load_15` real,
	`disk_metrics` text,
	`network_metrics` text,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_agent_metrics_24h`("id", "agent_id", "timestamp", "cpu_usage", "cpu_cores", "cpu_model", "memory_total", "memory_used", "memory_free", "memory_usage_rate", "load_1", "load_5", "load_15", "disk_metrics", "network_metrics") SELECT "id", "agent_id", "timestamp", "cpu_usage", "cpu_cores", "cpu_model", "memory_total", "memory_used", "memory_free", "memory_usage_rate", "load_1", "load_5", "load_15", "disk_metrics", "network_metrics" FROM `agent_metrics_24h`;--> statement-breakpoint
DROP TABLE `agent_metrics_24h`;--> statement-breakpoint
ALTER TABLE `__new_agent_metrics_24h` RENAME TO `agent_metrics_24h`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_agents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`token` text NOT NULL,
	`created_by` integer NOT NULL,
	`status` text DEFAULT 'inactive',
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`hostname` text,
	`ip_addresses` text,
	`os` text,
	`version` text,
	`keepalive` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_agents`("id", "name", "token", "created_by", "status", "created_at", "updated_at", "hostname", "ip_addresses", "os", "version", "keepalive") SELECT "id", "name", "token", "created_by", "status", "created_at", "updated_at", "hostname", "ip_addresses", "os", "version", "keepalive" FROM `agents`;--> statement-breakpoint
DROP TABLE `agents`;--> statement-breakpoint
ALTER TABLE `__new_agents` RENAME TO `agents`;--> statement-breakpoint
CREATE UNIQUE INDEX `agents_token_unique` ON `agents` (`token`);--> statement-breakpoint
CREATE TABLE `__new_monitor_daily_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monitor_id` integer NOT NULL,
	`date` text NOT NULL,
	`total_checks` integer DEFAULT 0 NOT NULL,
	`up_checks` integer DEFAULT 0 NOT NULL,
	`down_checks` integer DEFAULT 0 NOT NULL,
	`avg_response_time` integer DEFAULT 0,
	`min_response_time` integer DEFAULT 0,
	`max_response_time` integer DEFAULT 0,
	`availability` real DEFAULT 0,
	`created_at` text NOT NULL,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_monitor_daily_stats`("id", "monitor_id", "date", "total_checks", "up_checks", "down_checks", "avg_response_time", "min_response_time", "max_response_time", "availability", "created_at") SELECT "id", "monitor_id", "date", "total_checks", "up_checks", "down_checks", "avg_response_time", "min_response_time", "max_response_time", "availability", "created_at" FROM `monitor_daily_stats`;--> statement-breakpoint
DROP TABLE `monitor_daily_stats`;--> statement-breakpoint
ALTER TABLE `__new_monitor_daily_stats` RENAME TO `monitor_daily_stats`;--> statement-breakpoint
CREATE TABLE `__new_monitor_status_history_24h` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monitor_id` integer NOT NULL,
	`status` text NOT NULL,
	`timestamp` text DEFAULT 'CURRENT_TIMESTAMP',
	`response_time` integer,
	`status_code` integer,
	`error` text,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_monitor_status_history_24h`("id", "monitor_id", "status", "timestamp", "response_time", "status_code", "error") SELECT "id", "monitor_id", "status", "timestamp", "response_time", "status_code", "error" FROM `monitor_status_history_24h`;--> statement-breakpoint
DROP TABLE `monitor_status_history_24h`;--> statement-breakpoint
ALTER TABLE `__new_monitor_status_history_24h` RENAME TO `monitor_status_history_24h`;--> statement-breakpoint
CREATE TABLE `__new_monitors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`method` text NOT NULL,
	`interval` integer NOT NULL,
	`timeout` integer NOT NULL,
	`expected_status` integer NOT NULL,
	`headers` text NOT NULL,
	`body` text,
	`created_by` integer NOT NULL,
	`active` integer NOT NULL,
	`status` text DEFAULT 'pending',
	`response_time` integer DEFAULT 0,
	`last_checked` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_monitors`("id", "name", "url", "method", "interval", "timeout", "expected_status", "headers", "body", "created_by", "active", "status", "response_time", "last_checked", "created_at", "updated_at") SELECT "id", "name", "url", "method", "interval", "timeout", "expected_status", "headers", "body", "created_by", "active", "status", "response_time", "last_checked", "created_at", "updated_at" FROM `monitors`;--> statement-breakpoint
DROP TABLE `monitors`;--> statement-breakpoint
ALTER TABLE `__new_monitors` RENAME TO `monitors`;--> statement-breakpoint
CREATE TABLE `__new_notification_channels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`config` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_notification_channels`("id", "name", "type", "config", "enabled", "created_by", "created_at", "updated_at") SELECT "id", "name", "type", "config", "enabled", "created_by", "created_at", "updated_at" FROM `notification_channels`;--> statement-breakpoint
DROP TABLE `notification_channels`;--> statement-breakpoint
ALTER TABLE `__new_notification_channels` RENAME TO `notification_channels`;--> statement-breakpoint
CREATE TABLE `__new_notification_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`target_id` integer,
	`channel_id` integer NOT NULL,
	`template_id` integer NOT NULL,
	`status` text NOT NULL,
	`content` text NOT NULL,
	`error` text,
	`sent_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`channel_id`) REFERENCES `notification_channels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `notification_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_notification_history`("id", "type", "target_id", "channel_id", "template_id", "status", "content", "error", "sent_at") SELECT "id", "type", "target_id", "channel_id", "template_id", "status", "content", "error", "sent_at" FROM `notification_history`;--> statement-breakpoint
DROP TABLE `notification_history`;--> statement-breakpoint
ALTER TABLE `__new_notification_history` RENAME TO `notification_history`;--> statement-breakpoint
CREATE TABLE `__new_notification_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`target_type` text DEFAULT 'global' NOT NULL,
	`target_id` integer,
	`enabled` integer DEFAULT 1 NOT NULL,
	`on_down` integer DEFAULT 1 NOT NULL,
	`on_recovery` integer DEFAULT 1 NOT NULL,
	`on_offline` integer DEFAULT 1 NOT NULL,
	`on_cpu_threshold` integer DEFAULT 0 NOT NULL,
	`cpu_threshold` integer DEFAULT 90 NOT NULL,
	`on_memory_threshold` integer DEFAULT 0 NOT NULL,
	`memory_threshold` integer DEFAULT 85 NOT NULL,
	`on_disk_threshold` integer DEFAULT 0 NOT NULL,
	`disk_threshold` integer DEFAULT 90 NOT NULL,
	`channels` text DEFAULT '[]',
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_notification_settings`("id", "user_id", "target_type", "target_id", "enabled", "on_down", "on_recovery", "on_offline", "on_cpu_threshold", "cpu_threshold", "on_memory_threshold", "memory_threshold", "on_disk_threshold", "disk_threshold", "channels", "created_at", "updated_at") SELECT "id", "user_id", "target_type", "target_id", "enabled", "on_down", "on_recovery", "on_offline", "on_cpu_threshold", "cpu_threshold", "on_memory_threshold", "memory_threshold", "on_disk_threshold", "disk_threshold", "channels", "created_at", "updated_at" FROM `notification_settings`;--> statement-breakpoint
DROP TABLE `notification_settings`;--> statement-breakpoint
ALTER TABLE `__new_notification_settings` RENAME TO `notification_settings`;--> statement-breakpoint
CREATE TABLE `__new_notification_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`subject` text NOT NULL,
	`content` text NOT NULL,
	`is_default` integer DEFAULT 0 NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_notification_templates`("id", "name", "type", "subject", "content", "is_default", "created_by", "created_at", "updated_at") SELECT "id", "name", "type", "subject", "content", "is_default", "created_by", "created_at", "updated_at" FROM `notification_templates`;--> statement-breakpoint
DROP TABLE `notification_templates`;--> statement-breakpoint
ALTER TABLE `__new_notification_templates` RENAME TO `notification_templates`;--> statement-breakpoint
CREATE TABLE `__new_status_page_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text DEFAULT '系统状态' NOT NULL,
	`description` text DEFAULT '系统当前运行状态',
	`logo_url` text DEFAULT '',
	`custom_css` text DEFAULT '',
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_status_page_config`("id", "user_id", "title", "description", "logo_url", "custom_css", "created_at", "updated_at") SELECT "id", "user_id", "title", "description", "logo_url", "custom_css", "created_at", "updated_at" FROM `status_page_config`;--> statement-breakpoint
DROP TABLE `status_page_config`;--> statement-breakpoint
ALTER TABLE `__new_status_page_config` RENAME TO `status_page_config`;