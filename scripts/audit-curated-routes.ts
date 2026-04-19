/**
 * Audit every curated route (day_trip_routes) for:
 *   - total drive time hand-ordered vs geographically optimized
 *   - candidate pool size (wineries matching theme+valley+strictSources)
 *   - flags routes where optimized < 80% of hand-ordered (route backtracks)
 *   - flags routes where pool size > 3x stop count (curation arbitrarily narrow)
 *
 * Read-only. Outputs markdown-ish report to stdout.
 *
 * Run: npx tsx scripts/audit-curated-routes.ts
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, asc, and, sql } from "drizzle-orm";
import {
  dayTripRoutes,
  dayTripStops,
  wineries,
  subRegions,
} from "../src/db/schema";
import { computeSegments, optimizeStopOrder } from "../src/lib/geo";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});
const db = drizzle(client);

const THEME_AMENITY: Record<string, string> = {
  "dog-friendly": "dogFriendly",
  "kid-friendly": "kidFriendly",
  picnic: "picnicFriendly",
};

function valleyFromRegion(region: string | null): "napa" | "sonoma" | null {
  if (!region) return null;
  const r = region.toLowerCase();
  if (r.includes("napa") && !r.includes("sonoma")) return "napa";
  if (r.includes("sonoma") || r.includes("carneros")) return "sonoma";
  return null;
}

async function main() {
  const routes = await db
    .select({
      id: dayTripRoutes.id,
      slug: dayTripRoutes.slug,
      title: dayTripRoutes.title,
      region: dayTripRoutes.region,
      theme: dayTripRoutes.theme,
    })
    .from(dayTripRoutes);

  console.log("# Curated Routes Audit\n");
  console.log(`Routes: ${routes.length}\n`);

  const flags: string[] = [];

  for (const route of routes) {
    console.log(`\n## ${route.title}  (\`${route.slug}\`)`);
    console.log(`   region=${route.region}   theme=${route.theme}`);

    const stops = await db
      .select({
        id: wineries.id,
        name: wineries.name,
        city: wineries.city,
        lat: wineries.lat,
        lng: wineries.lng,
        priceLevel: wineries.priceLevel,
        rating: sql<number>`COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0)`,
        stopOrder: dayTripStops.stopOrder,
      })
      .from(dayTripStops)
      .innerJoin(wineries, eq(dayTripStops.wineryId, wineries.id))
      .where(eq(dayTripStops.routeId, route.id))
      .orderBy(asc(dayTripStops.stopOrder));

    if (stops.length === 0) {
      console.log("   (no stops)");
      continue;
    }

    // Hand-ordered total
    const handSegs = computeSegments(stops);
    const handMiles = handSegs.reduce((s, x) => s + x.miles, 0);
    const handMin = handSegs.reduce((s, x) => s + x.minutes, 0);

    // Optimized
    const coords = stops
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => ({ lat: s.lat!, lng: s.lng! }));
    const order = optimizeStopOrder(coords);
    const optimized = order.map((i) => stops[i]);
    const optSegs = computeSegments(optimized);
    const optMiles = optSegs.reduce((s, x) => s + x.miles, 0);
    const optMin = optSegs.reduce((s, x) => s + x.minutes, 0);

    const driveDelta =
      handMin > 0 ? ((handMin - optMin) / handMin) * 100 : 0;

    console.log("   Stops (hand order):");
    stops.forEach((s, i) =>
      console.log(`     ${i + 1}. ${s.name}  (${s.city}, rating ${Number(s.rating).toFixed(1)}, $${s.priceLevel ?? "?"})`)
    );
    console.log(
      `   Hand drive: ${handMin.toFixed(0)} min / ${handMiles.toFixed(1)} mi`
    );
    console.log(
      `   Optimized:  ${optMin.toFixed(0)} min / ${optMiles.toFixed(1)} mi  (${driveDelta.toFixed(0)}% savings)`
    );
    if (driveDelta > 20) {
      console.log("   Optimized order:");
      optimized.forEach((s, i) => console.log(`     ${i + 1}. ${s.name}  (${s.city})`));
      flags.push(
        `${route.slug}: hand-ordered route is ${driveDelta.toFixed(0)}% longer than optimal (${handMin.toFixed(0)} vs ${optMin.toFixed(0)} min)`
      );
    }

    // Candidate pool: wineries matching theme+valley with rating/review quality
    const valley = valleyFromRegion(route.region);
    const conds = [sql`${wineries.lat} IS NOT NULL`];
    if (valley) {
      conds.push(eq(subRegions.valley, valley));
    }
    // Theme-based constraint
    if (route.theme === "luxury") {
      conds.push(sql`${wineries.priceLevel} >= 3`);
      conds.push(
        sql`COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) >= 4.5`
      );
    } else if (route.theme === "budget") {
      conds.push(sql`${wineries.priceLevel} <= 2 OR ${wineries.priceLevel} IS NULL`);
    } else if (route.theme === "dog-friendly") {
      conds.push(eq(wineries.dogFriendly, true));
    } else if (route.theme === "historic") {
      // no specific DB column — skip pool calc
    } else if (route.theme === "pinot-chardonnay") {
      // Would need wines join; approximate by valley+region
    }
    // Quality gate (strict sources)
    conds.push(
      sql`(${wineries.curated} = 1 OR (COALESCE(${wineries.googleReviewCount}, 0) >= 50 AND COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) >= 4.0))`
    );

    const pool = await db
      .select({ id: wineries.id })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(and(...conds));

    const poolRatio = stops.length > 0 ? pool.length / stops.length : 0;
    console.log(`   Candidate pool: ${pool.length} wineries (${poolRatio.toFixed(1)}× stop count)`);
    if (poolRatio > 3) {
      flags.push(
        `${route.slug}: pool is ${pool.length} wineries but only ${stops.length} are shown (${poolRatio.toFixed(1)}×) — shuffle/pool UI should surface the rest`
      );
    }
  }

  console.log("\n\n# Flags\n");
  if (flags.length === 0) {
    console.log("(none)");
  } else {
    flags.forEach((f) => console.log(`- ${f}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
