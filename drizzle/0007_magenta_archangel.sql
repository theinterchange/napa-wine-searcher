CREATE TABLE `accommodation_nearby_wineries` (
	`accommodation_id` integer NOT NULL,
	`winery_id` integer NOT NULL,
	`distance_miles` real,
	`drive_minutes` real,
	PRIMARY KEY(`accommodation_id`, `winery_id`),
	FOREIGN KEY (`accommodation_id`) REFERENCES `accommodations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `accommodations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`sub_region_id` integer,
	`valley` text NOT NULL,
	`description` text,
	`short_description` text,
	`hero_image_url` text,
	`thumbnail_url` text,
	`address` text,
	`city` text,
	`state` text DEFAULT 'CA',
	`lat` real,
	`lng` real,
	`phone` text,
	`website_url` text,
	`booking_url` text,
	`booking_provider` text DEFAULT 'booking_com',
	`price_tier` integer,
	`price_range_min` integer,
	`price_range_max` integer,
	`amenities_json` text,
	`wine_features` text,
	`why_stay_here` text,
	`best_for` text,
	`updated_at` text,
	FOREIGN KEY (`sub_region_id`) REFERENCES `sub_regions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accommodations_slug_unique` ON `accommodations` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_accommodations_slug` ON `accommodations` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_accommodations_valley` ON `accommodations` (`valley`);--> statement-breakpoint
CREATE INDEX `idx_accommodations_sub_region_id` ON `accommodations` (`sub_region_id`);--> statement-breakpoint
ALTER TABLE `outbound_clicks` ADD `accommodation_id` integer;