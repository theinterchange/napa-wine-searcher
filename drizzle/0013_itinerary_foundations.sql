-- Phase 0 — Itinerary foundations

-- 1. Extend day_trip_routes with curated metadata
ALTER TABLE `day_trip_routes` ADD `hero_image_url` text;
ALTER TABLE `day_trip_routes` ADD `group_vibe` text;
ALTER TABLE `day_trip_routes` ADD `duration` text;
ALTER TABLE `day_trip_routes` ADD `seo_keywords` text;
ALTER TABLE `day_trip_routes` ADD `faq_json` text;
ALTER TABLE `day_trip_routes` ADD `editorial_pull` text;
ALTER TABLE `day_trip_routes` ADD `curated_at` text;

-- 2. Pre-computed segment cache on day_trip_stops
ALTER TABLE `day_trip_stops` ADD `pre_computed_drive_minutes_to_next` real;
ALTER TABLE `day_trip_stops` ADD `pre_computed_miles_to_next` real;

-- 3. Saved trips: forked-from + origin capture
ALTER TABLE `saved_trips` ADD `forked_from_route_id` integer;
ALTER TABLE `saved_trips` ADD `origin_lat` real;
ALTER TABLE `saved_trips` ADD `origin_lng` real;
ALTER TABLE `saved_trips` ADD `origin_label` text;

-- 4. Anonymous trips (shareable without account)
CREATE TABLE `anonymous_trips` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `share_code` text NOT NULL,
  `name` text,
  `theme` text,
  `valley` text,
  `forked_from_route_id` integer,
  `origin_lat` real,
  `origin_lng` real,
  `origin_label` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `last_viewed_at` text,
  FOREIGN KEY (`forked_from_route_id`) REFERENCES `day_trip_routes`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE UNIQUE INDEX `anonymous_trips_share_code_unique` ON `anonymous_trips` (`share_code`);
CREATE INDEX `idx_anon_trips_share_code` ON `anonymous_trips` (`share_code`);

CREATE TABLE `anonymous_trip_stops` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `trip_id` integer NOT NULL,
  `winery_id` integer NOT NULL,
  `stop_order` integer NOT NULL,
  `notes` text,
  FOREIGN KEY (`trip_id`) REFERENCES `anonymous_trips`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`winery_id`) REFERENCES `wineries`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `idx_anon_trip_stops_trip_id` ON `anonymous_trip_stops` (`trip_id`);

-- 5. Drive-time / route cache (ready for Phase 8 paid tier)
CREATE TABLE `route_cache` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `cache_key` text NOT NULL,
  `from_lat` real NOT NULL,
  `from_lng` real NOT NULL,
  `to_lat` real NOT NULL,
  `to_lng` real NOT NULL,
  `miles` real NOT NULL,
  `minutes` real NOT NULL,
  `min_range_minutes` real NOT NULL,
  `max_range_minutes` real NOT NULL,
  `source` text NOT NULL,
  `polyline_encoded` text,
  `computed_at` text NOT NULL,
  `expires_at` text
);
CREATE UNIQUE INDEX `route_cache_cache_key_unique` ON `route_cache` (`cache_key`);
CREATE INDEX `idx_route_cache_key` ON `route_cache` (`cache_key`);

-- 6. Itinerary analytics events (for weekly stats + sponsorship pitch panel)
CREATE TABLE `itinerary_analytics_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `event_name` text NOT NULL,
  `trip_id` integer,
  `share_code` text,
  `mode` text,
  `payload_json` text,
  `session_id` text,
  `user_id` text,
  `created_at` text NOT NULL
);
CREATE INDEX `idx_itin_events_event_name` ON `itinerary_analytics_events` (`event_name`);
CREATE INDEX `idx_itin_events_created_at` ON `itinerary_analytics_events` (`created_at`);
