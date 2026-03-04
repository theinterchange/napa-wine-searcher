CREATE TABLE `accounts` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE TABLE `day_trip_routes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`region` text,
	`theme` text,
	`estimated_hours` real
);
--> statement-breakpoint
CREATE UNIQUE INDEX `day_trip_routes_slug_unique` ON `day_trip_routes` (`slug`);--> statement-breakpoint
CREATE TABLE `day_trip_stops` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`route_id` integer NOT NULL,
	`winery_id` integer NOT NULL,
	`stop_order` integer NOT NULL,
	`notes` text,
	`suggested_duration` integer,
	FOREIGN KEY (`route_id`) REFERENCES `day_trip_routes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sub_regions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`valley` text NOT NULL,
	`slug` text NOT NULL,
	`color` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sub_regions_slug_unique` ON `sub_regions` (`slug`);--> statement-breakpoint
CREATE TABLE `wineries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`sub_region_id` integer,
	`description` text,
	`short_description` text,
	`hero_image_url` text,
	`thumbnail_url` text,
	`address` text,
	`city` text,
	`state` text DEFAULT 'CA',
	`zip` text,
	`lat` real,
	`lng` real,
	`phone` text,
	`email` text,
	`website_url` text,
	`hours_json` text,
	`reservation_required` integer DEFAULT false,
	`dog_friendly` integer DEFAULT false,
	`dog_friendly_note` text,
	`dog_friendly_source` text,
	`picnic_friendly` integer DEFAULT false,
	`kid_friendly` integer DEFAULT false,
	`kid_friendly_note` text,
	`kid_friendly_source` text,
	`kid_friendly_confidence` text,
	`price_level` integer,
	`aggregate_rating` real,
	`total_ratings` integer DEFAULT 0,
	`curated` integer DEFAULT false,
	`curated_at` text,
	`data_source` text,
	`last_scraped_at` text,
	`google_place_id` text,
	`google_review_count` integer,
	`google_rating` real,
	`updated_at` text,
	FOREIGN KEY (`sub_region_id`) REFERENCES `sub_regions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wineries_slug_unique` ON `wineries` (`slug`);--> statement-breakpoint
CREATE TABLE `wine_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`winery_id` integer NOT NULL,
	`wine_type_id` integer,
	`name` text NOT NULL,
	`vintage` integer,
	`price` real,
	`description` text,
	`rating` real,
	`rating_source` text,
	`rating_count` integer,
	`source_url` text,
	`updated_at` text,
	FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wine_type_id`) REFERENCES `wine_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasting_experiences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`winery_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real,
	`duration_minutes` integer,
	`includes` text,
	`reservation_required` integer DEFAULT false,
	`min_group_size` integer,
	`max_group_size` integer,
	`source_url` text,
	`updated_at` text,
	FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wine_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`wine_id` integer NOT NULL,
	`provider` text NOT NULL,
	`score` real,
	`max_score` real,
	`review_count` integer,
	`critic_name` text,
	`fetched_at` text,
	FOREIGN KEY (`wine_id`) REFERENCES `wines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `winery_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`winery_id` integer NOT NULL,
	`provider` text NOT NULL,
	`score` real,
	`max_score` real,
	`review_count` integer,
	`fetched_at` text,
	FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`user_id` text NOT NULL,
	`winery_id` integer NOT NULL,
	PRIMARY KEY(`user_id`, `winery_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `visited` (
	`user_id` text NOT NULL,
	`winery_id` integer NOT NULL,
	`visited_date` text,
	PRIMARY KEY(`user_id`, `winery_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `winery_notes` (
	`user_id` text NOT NULL,
	`winery_id` integer NOT NULL,
	`content` text,
	PRIMARY KEY(`user_id`, `winery_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scrape_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`winery_id` integer NOT NULL,
	`scraped_at` text NOT NULL,
	`status` text NOT NULL,
	`wines_found` integer,
	`tastings_found` integer,
	`content_hash` text,
	`error_message` text,
	FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `winery_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`winery_id` integer NOT NULL,
	`url` text NOT NULL,
	`source` text NOT NULL,
	`alt_text` text,
	FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `winery_photos_winery_id_url_unique` ON `winery_photos` (`winery_id`,`url`);--> statement-breakpoint
CREATE TABLE `email_subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`source` text NOT NULL,
	`subscribed_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_subscribers_email_unique` ON `email_subscribers` (`email`);--> statement-breakpoint
CREATE TABLE `outbound_clicks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`winery_id` integer,
	`click_type` text NOT NULL,
	`destination_url` text NOT NULL,
	`source_page` text,
	`source_component` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE no action
);
