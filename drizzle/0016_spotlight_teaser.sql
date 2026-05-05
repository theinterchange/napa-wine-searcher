-- Phase 4.5b: Spotlight teaser content
-- Per-entity 2-sentence editorial dek written by Sonnet for the homepage
-- spotlight surface. Distinct from whyVisit/whyThisWinery (detail page reveal)
-- so the spotlight tease and the detail page payoff don't duplicate.

ALTER TABLE `wineries` ADD `spotlight_teaser` text;
ALTER TABLE `accommodations` ADD `spotlight_teaser` text;
