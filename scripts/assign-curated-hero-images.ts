/**
 * Populate day_trip_routes.hero_image_url for every curated route.
 *
 * Strategy: for each route, pull the stops ordered by stop_order; take the
 * first stop whose winery has a non-null hero_image_url. Write it back.
 *
 * Idempotent: only writes when hero_image_url IS NULL, or when --force is passed.
 *
 * Run: npx tsx scripts/assign-curated-hero-images.ts
 * Force overwrite: npx tsx scripts/assign-curated-hero-images.ts --force
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, asc, isNull, and } from "drizzle-orm";
import {
  dayTripRoutes,
  dayTripStops,
  wineries,
} from "../src/db/schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});
const db = drizzle(client);

async function main() {
  const force = process.argv.includes("--force");

  const routes = await db
    .select({
      id: dayTripRoutes.id,
      slug: dayTripRoutes.slug,
      heroImageUrl: dayTripRoutes.heroImageUrl,
    })
    .from(dayTripRoutes);

  let updated = 0;
  let skipped = 0;

  for (const route of routes) {
    if (route.heroImageUrl && !force) {
      console.log(`  - ${route.slug}: already has hero, skipping`);
      skipped++;
      continue;
    }

    const stops = await db
      .select({
        heroImageUrl: wineries.heroImageUrl,
        name: wineries.name,
        rating: wineries.googleRating,
      })
      .from(dayTripStops)
      .innerJoin(wineries, eq(dayTripStops.wineryId, wineries.id))
      .where(eq(dayTripStops.routeId, route.id))
      .orderBy(asc(dayTripStops.stopOrder));

    const pick = stops
      .filter((s) => s.heroImageUrl)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];

    if (!pick) {
      console.log(`  ! ${route.slug}: no stop with hero image, skipping`);
      continue;
    }

    await db
      .update(dayTripRoutes)
      .set({ heroImageUrl: pick.heroImageUrl })
      .where(eq(dayTripRoutes.id, route.id));

    console.log(`  ✓ ${route.slug}: using ${pick.name} image`);
    updated++;
  }

  console.log(`\nUpdated: ${updated}  Skipped: ${skipped}  Total routes: ${routes.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
