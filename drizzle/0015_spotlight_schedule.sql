-- Phase 4.5: Spotlight scheduling
-- Adds manual override scheduling for the homepage Spotlight slot on both
-- wineries and accommodations. NULL spotlight_year_month = use auto-rotation
-- fallback in src/app/page.tsx. Partial unique indexes prevent two rows from
-- claiming the same calendar month while still permitting many NULLs.

ALTER TABLE `wineries` ADD `spotlight_year_month` text;

CREATE UNIQUE INDEX `idx_wineries_spotlight_unique`
  ON `wineries` (`spotlight_year_month`)
  WHERE `spotlight_year_month` IS NOT NULL;

ALTER TABLE `accommodations` ADD `curated` integer DEFAULT 0;
ALTER TABLE `accommodations` ADD `curated_at` text;
ALTER TABLE `accommodations` ADD `spotlight_year_month` text;

CREATE UNIQUE INDEX `idx_accommodations_spotlight_unique`
  ON `accommodations` (`spotlight_year_month`)
  WHERE `spotlight_year_month` IS NOT NULL;
