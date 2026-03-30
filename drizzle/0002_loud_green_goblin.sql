ALTER TABLE `winery_photos` ADD `fetched_at` text;--> statement-breakpoint
ALTER TABLE `wine_journal_entries` ADD `entry_type` text DEFAULT 'wine' NOT NULL;