-- Phase 1.5: Featured flag on curated stops
-- Drives admin-side "Featured" pinning; user-facing it renders as a pill on the
-- stop card to signal editorial/sponsor placement.

ALTER TABLE `day_trip_stops` ADD `is_featured` integer DEFAULT 0;
