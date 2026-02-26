/**
 * Add generated (non-scraped, non-curated) wineries from the DB to winery-targets.json
 * so they can be processed by the scraper pipeline.
 *
 * Usage:
 *   npm run scrape:add-targets
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { eq, and, ne, or, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries, subRegions } from "../db/schema";
import { config } from "./config";
import type { WineryTarget } from "./types";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client);

async function main() {
  // Query DB for wineries that are NOT curated AND NOT yet scraped
  const generated = await db
    .select({
      slug: wineries.slug,
      name: wineries.name,
      websiteUrl: wineries.websiteUrl,
      lat: wineries.lat,
      lng: wineries.lng,
      city: wineries.city,
      address: wineries.address,
      phone: wineries.phone,
      subRegionId: wineries.subRegionId,
      googlePlaceId: wineries.googlePlaceId,
      googleReviewCount: wineries.googleReviewCount,
      googleRating: wineries.googleRating,
      dataSource: wineries.dataSource,
      curated: wineries.curated,
    })
    .from(wineries)
    .where(
      and(
        or(eq(wineries.curated, false), isNull(wineries.curated)),
        or(ne(wineries.dataSource, "scraped"), isNull(wineries.dataSource))
      )
    );

  if (generated.length === 0) {
    console.log("No generated wineries found — all wineries are already scraped or curated.");
    return;
  }

  console.log(`Found ${generated.length} generated (non-scraped, non-curated) wineries in DB.`);

  // Build sub-region slug lookup
  const allSubRegions = await db.select().from(subRegions);
  const subRegionById = new Map(allSubRegions.map((r) => [r.id, r]));

  // Load existing targets
  let existingTargets: WineryTarget[] = [];
  if (existsSync(config.paths.wineryTargets)) {
    existingTargets = JSON.parse(readFileSync(config.paths.wineryTargets, "utf-8"));
  }
  const existingSlugs = new Set(existingTargets.map((t) => t.slug));

  // Determine next rank
  const maxRank = existingTargets.reduce((max, t) => Math.max(max, t.rank), 0);

  // Build new targets
  const newTargets: WineryTarget[] = [];
  let skipped = 0;

  for (const w of generated) {
    if (existingSlugs.has(w.slug)) {
      skipped++;
      continue;
    }

    if (!w.websiteUrl) {
      console.log(`  SKIP (no website): ${w.name} (${w.slug})`);
      skipped++;
      continue;
    }

    const region = w.subRegionId ? subRegionById.get(w.subRegionId) : null;

    const target: WineryTarget = {
      name: w.name,
      slug: w.slug,
      websiteUrl: w.websiteUrl,
      valley: region?.valley || "napa",
      subRegion: region?.slug || null,
      city: w.city || null,
      address: w.address || null,
      lat: w.lat || 0,
      lng: w.lng || 0,
      phone: w.phone || null,
      googleRating: w.googleRating || null,
      googleReviewCount: w.googleReviewCount || 0,
      googlePlaceId: w.googlePlaceId || "",
      googlePhotos: [],
      rank: maxRank + newTargets.length + 1,
    };

    newTargets.push(target);
  }

  if (newTargets.length === 0) {
    console.log(`No new targets to add (${skipped} already in targets or missing website).`);
    return;
  }

  // Append to targets file
  const allTargets = [...existingTargets, ...newTargets];
  writeFileSync(config.paths.wineryTargets, JSON.stringify(allTargets, null, 2) + "\n");

  console.log(`\nAdded ${newTargets.length} new targets (${skipped} skipped).`);
  console.log(`Total targets: ${allTargets.length}`);
  console.log(`\nNew wineries added:`);
  for (const t of newTargets) {
    console.log(`  ${t.name} (${t.slug}) — ${t.websiteUrl}`);
  }
  console.log(`\nNext step: npm run scrape:map-urls`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
