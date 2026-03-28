CREATE TABLE `accommodation_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accommodation_id` integer NOT NULL,
	`photo_url` text,
	`blob_url` text,
	`caption` text,
	`sort_order` integer DEFAULT 0,
	`created_at` text NOT NULL,
	FOREIGN KEY (`accommodation_id`) REFERENCES `accommodations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_accommodation_photos_accommodation_id` ON `accommodation_photos` (`accommodation_id`);--> statement-breakpoint
ALTER TABLE `accommodations` ADD `the_setting` text;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `the_experience` text;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `before_you_book` text;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `best_for_tags` text;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `why_this_hotel` text;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `dog_friendly` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `dog_friendly_note` text;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `kid_friendly` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `kid_friendly_note` text;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `adults_only` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `google_rating` real;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `google_review_count` integer;--> statement-breakpoint
ALTER TABLE `accommodations` ADD `google_place_id` text;