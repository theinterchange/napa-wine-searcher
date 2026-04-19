/**
 * Seed defaults for Napa / Sonoma / Both variants on every curated route that's
 * missing one or more variants. Safe default so every route's valley-variant
 * toggle has something to show out of the box; admin can refine in
 * /nalaadmin/routes/[slug].
 *
 * Per variant per route:
 *   - If 2+ stops already tagged with this variant: skip (admin already owns it)
 *   - Else: pull 4 candidates matching the route's theme via getPoolForTheme,
 *     excluding wineries already used in any variant of this route. Insert
 *     with valley_variant set.
 *
 * "Both" variant = 2 Napa + 2 Sonoma (cross-valley feel), not the full pool —
 * so a user who picks "Both" sees a distinct editorial mix rather than the
 * same top matches as the Napa tab.
 *
 * Idempotent: re-runs only fill empty variants.
 *
 * Run: (source .env.local from the repo root, then)
 *   npx tsx scripts/auto-seed-valley-variants.ts
 */
import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, sql, and, notInArray } from "drizzle-orm";
import {
  dayTripRoutes,
  dayTripStops,
  wineries,
  subRegions,
} from "../src/db/schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});
const db = drizzle(client);

const VARIANTS = ["napa", "sonoma", "both"] as const;
type Variant = (typeof VARIANTS)[number];

const MIN_EXISTING = 2; // if this many stops already exist in variant, leave alone
const TARGET_PER_VARIANT = 4;

async function poolForThemeValley(
  theme: string | null,
  valley: "napa" | "sonoma" | null,
  excludeIds: number[],
  limit: number
): Promise<number[]> {
  const conds = [
    sql`${wineries.lat} IS NOT NULL AND ${wineries.lng} IS NOT NULL`,
    sql`(${wineries.curated} = 1 OR (COALESCE(${wineries.googleReviewCount}, 0) >= 50 AND COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) >= 4.0))`,
  ];
  if (valley) conds.push(eq(subRegions.valley, valley));

  switch (theme) {
    case "luxury":
      conds.push(sql`${wineries.priceLevel} >= 3`);
      conds.push(
        sql`COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) >= 4.5`
      );
      break;
    case "budget":
      conds.push(
        sql`(${wineries.priceLevel} <= 2 OR ${wineries.priceLevel} IS NULL)`
      );
      break;
    case "dog-friendly":
      conds.push(eq(wineries.dogFriendly, true));
      break;
    case "kid-friendly":
      conds.push(eq(wineries.kidFriendly, true));
      break;
    case "cabernet":
    case "historic":
    case "pinot-chardonnay":
    default:
      // No extra hard column filter — quality gate + rating sort carry it
      break;
  }

  if (excludeIds.length > 0) conds.push(notInArray(wineries.id, excludeIds));

  const rows = await db
    .select({ id: wineries.id })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(and(...conds))
    .orderBy(
      sql`COALESCE(${wineries.curated}, 0) DESC`,
      sql`(COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) * LN(1 + COALESCE(${wineries.googleReviewCount}, 0))) DESC`,
      sql`COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) DESC`
    )
    .limit(limit);

  return rows.map((r) => r.id);
}

async function main() {
  console.log("Target:", process.env.DATABASE_URL);

  const routes = await db
    .select({
      id: dayTripRoutes.id,
      slug: dayTripRoutes.slug,
      theme: dayTripRoutes.theme,
    })
    .from(dayTripRoutes);

  for (const route of routes) {
    console.log(`\n== ${route.slug}  (theme=${route.theme})`);

    // Load current stops grouped by variant
    const existing = await db
      .select({
        id: dayTripStops.id,
        wineryId: dayTripStops.wineryId,
        stopOrder: dayTripStops.stopOrder,
        variant: dayTripStops.valleyVariant,
      })
      .from(dayTripStops)
      .where(eq(dayTripStops.routeId, route.id));

    const byVariant = new Map<Variant, typeof existing>();
    for (const s of existing) {
      const v = (s.variant ?? "both") as Variant;
      const arr = byVariant.get(v) ?? [];
      arr.push(s);
      byVariant.set(v, arr);
    }
    const existingIds = existing.map((s) => s.wineryId);
    let nextOrder = existing.length > 0
      ? Math.max(...existing.map((s) => s.stopOrder)) + 1
      : 0;

    for (const variant of VARIANTS) {
      const current = byVariant.get(variant) ?? [];
      if (current.length >= MIN_EXISTING) {
        console.log(`  ${variant}: ${current.length} already — skip`);
        continue;
      }

      const needed = TARGET_PER_VARIANT - current.length;
      // Track ids we'll insert this run so Both doesn't overlap Napa/Sonoma we just inserted
      const runExcludeIds = [...existingIds];
      let toInsertIds: number[] = [];

      if (variant === "both") {
        // Half from each valley for a real cross-valley mix
        const half = Math.ceil(needed / 2);
        const napaIds = await poolForThemeValley(
          route.theme ?? null,
          "napa",
          runExcludeIds,
          half
        );
        runExcludeIds.push(...napaIds);
        const sonomaIds = await poolForThemeValley(
          route.theme ?? null,
          "sonoma",
          runExcludeIds,
          needed - napaIds.length
        );
        toInsertIds = [...napaIds, ...sonomaIds];
      } else {
        toInsertIds = await poolForThemeValley(
          route.theme ?? null,
          variant,
          runExcludeIds,
          needed
        );
      }

      if (toInsertIds.length === 0) {
        console.log(`  ${variant}: 0 candidates found — leaving empty`);
        continue;
      }

      await db.insert(dayTripStops).values(
        toInsertIds.map((wineryId) => ({
          routeId: route.id,
          wineryId,
          stopOrder: nextOrder++,
          valleyVariant: variant,
        }))
      );
      existingIds.push(...toInsertIds);
      console.log(`  ${variant}: +${toInsertIds.length} seeded`);
    }
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
