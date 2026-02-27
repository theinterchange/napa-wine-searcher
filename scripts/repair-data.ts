/**
 * Manual data repair script.
 * Reads data/corrections.json and applies additive fixes to the DB
 * without deleting existing data (unless explicitly replacing).
 *
 * Usage:
 *   npx tsx scripts/repair-data.ts              # Apply all corrections
 *   npx tsx scripts/repair-data.ts --dry-run    # Preview what would change
 *   npx tsx scripts/repair-data.ts --winery <slug>  # Single winery
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { readFileSync, existsSync } from "fs";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, and } from "drizzle-orm";
import {
  wineries,
  wines,
  wineTypes,
  tastingExperiences,
} from "../src/db/schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});
const db = drizzle(client);

interface CorrectionWine {
  name: string;
  wineType?: string;
  vintage?: number | null;
  price?: number | null;
  description?: string | null;
}

interface CorrectionTasting {
  name: string;
  description?: string | null;
  price?: number | null;
  durationMinutes?: number | null;
  reservationRequired?: boolean;
  includes?: string | null;
}

interface WineryCorrection {
  wines?: CorrectionWine[];
  tastings?: CorrectionTasting[];
  /** If true, replace all wines instead of merging */
  replaceWines?: boolean;
  /** If true, replace all tastings instead of merging */
  replaceTastings?: boolean;
}

type Corrections = Record<string, WineryCorrection>;

// Cache wine types
let wineTypeMap: Map<string, number> | null = null;
async function getWineTypeMap(): Promise<Map<string, number>> {
  if (!wineTypeMap) {
    const types = await db.select().from(wineTypes);
    wineTypeMap = new Map(types.map((t) => [t.name, t.id]));
  }
  return wineTypeMap;
}

async function applyCorrections(
  corrections: Corrections,
  opts: { dryRun: boolean; filterSlug?: string }
) {
  const slugs = Object.keys(corrections);
  const toProcess = opts.filterSlug
    ? slugs.filter((s) => s === opts.filterSlug)
    : slugs;

  if (toProcess.length === 0) {
    console.log("No corrections to apply.");
    return;
  }

  const typeMap = await getWineTypeMap();
  const now = new Date().toISOString();
  let totalWinesAdded = 0;
  let totalTastingsAdded = 0;
  let totalWinesUpdated = 0;
  let totalTastingsUpdated = 0;

  for (const slug of toProcess) {
    const correction = corrections[slug];

    // Look up winery
    const [winery] = await db
      .select({ id: wineries.id, name: wineries.name })
      .from(wineries)
      .where(eq(wineries.slug, slug))
      .limit(1);

    if (!winery) {
      console.log(`  SKIP: Winery "${slug}" not found in DB`);
      continue;
    }

    console.log(`\n--- ${winery.name} (${slug}) ---`);

    // Handle wines
    if (correction.wines && correction.wines.length > 0) {
      if (correction.replaceWines) {
        console.log(`  Replacing all wines with ${correction.wines.length} corrections`);
        if (!opts.dryRun) {
          await db.delete(wines).where(eq(wines.wineryId, winery.id));
        }
        for (const wine of correction.wines) {
          const wineTypeId = wine.wineType ? typeMap.get(wine.wineType) || null : null;
          console.log(`  + Wine: ${wine.name}${wine.price ? ` ($${wine.price})` : ""}`);
          if (!opts.dryRun) {
            await db.insert(wines).values({
              wineryId: winery.id,
              wineTypeId,
              name: wine.name,
              vintage: wine.vintage ?? null,
              price: wine.price ?? null,
              description: wine.description ?? null,
              sourceUrl: "manual-correction",
              updatedAt: now,
            });
          }
          totalWinesAdded++;
        }
      } else {
        // Merge: check existing wines by name, update or insert
        const existingWines = await db
          .select({ id: wines.id, name: wines.name })
          .from(wines)
          .where(eq(wines.wineryId, winery.id));
        const existingNames = new Map(existingWines.map((w) => [w.name.toLowerCase(), w.id]));

        for (const wine of correction.wines) {
          const existingId = existingNames.get(wine.name.toLowerCase());
          if (existingId) {
            // Update existing wine
            const updates: Record<string, unknown> = { updatedAt: now };
            if (wine.price !== undefined) updates.price = wine.price;
            if (wine.description !== undefined) updates.description = wine.description;
            if (wine.vintage !== undefined) updates.vintage = wine.vintage;
            if (wine.wineType) {
              const wineTypeId = typeMap.get(wine.wineType);
              if (wineTypeId) updates.wineTypeId = wineTypeId;
            }
            console.log(`  ~ Wine (update): ${wine.name}`);
            if (!opts.dryRun) {
              await db.update(wines).set(updates).where(eq(wines.id, existingId));
            }
            totalWinesUpdated++;
          } else {
            // Insert new wine
            const wineTypeId = wine.wineType ? typeMap.get(wine.wineType) || null : null;
            console.log(`  + Wine (add): ${wine.name}${wine.price ? ` ($${wine.price})` : ""}`);
            if (!opts.dryRun) {
              await db.insert(wines).values({
                wineryId: winery.id,
                wineTypeId,
                name: wine.name,
                vintage: wine.vintage ?? null,
                price: wine.price ?? null,
                description: wine.description ?? null,
                sourceUrl: "manual-correction",
                updatedAt: now,
              });
            }
            totalWinesAdded++;
          }
        }
      }
    }

    // Handle tastings
    if (correction.tastings && correction.tastings.length > 0) {
      if (correction.replaceTastings) {
        console.log(`  Replacing all tastings with ${correction.tastings.length} corrections`);
        if (!opts.dryRun) {
          await db.delete(tastingExperiences).where(eq(tastingExperiences.wineryId, winery.id));
        }
        for (const tasting of correction.tastings) {
          console.log(`  + Tasting: ${tasting.name}${tasting.price ? ` ($${tasting.price})` : ""}`);
          if (!opts.dryRun) {
            await db.insert(tastingExperiences).values({
              wineryId: winery.id,
              name: tasting.name,
              description: tasting.description ?? null,
              price: tasting.price ?? null,
              durationMinutes: tasting.durationMinutes ?? null,
              reservationRequired: tasting.reservationRequired ?? false,
              includes: tasting.includes ?? null,
              sourceUrl: "manual-correction",
              updatedAt: now,
            });
          }
          totalTastingsAdded++;
        }
      } else {
        // Merge: check existing tastings by name, update or insert
        const existingTastings = await db
          .select({ id: tastingExperiences.id, name: tastingExperiences.name })
          .from(tastingExperiences)
          .where(eq(tastingExperiences.wineryId, winery.id));
        const existingNames = new Map(existingTastings.map((t) => [t.name.toLowerCase(), t.id]));

        for (const tasting of correction.tastings) {
          const existingId = existingNames.get(tasting.name.toLowerCase());
          if (existingId) {
            const updates: Record<string, unknown> = { updatedAt: now };
            if (tasting.price !== undefined) updates.price = tasting.price;
            if (tasting.description !== undefined) updates.description = tasting.description;
            if (tasting.durationMinutes !== undefined) updates.durationMinutes = tasting.durationMinutes;
            if (tasting.reservationRequired !== undefined) updates.reservationRequired = tasting.reservationRequired;
            if (tasting.includes !== undefined) updates.includes = tasting.includes;
            console.log(`  ~ Tasting (update): ${tasting.name}`);
            if (!opts.dryRun) {
              await db.update(tastingExperiences).set(updates).where(eq(tastingExperiences.id, existingId));
            }
            totalTastingsUpdated++;
          } else {
            console.log(`  + Tasting (add): ${tasting.name}${tasting.price ? ` ($${tasting.price})` : ""}`);
            if (!opts.dryRun) {
              await db.insert(tastingExperiences).values({
                wineryId: winery.id,
                name: tasting.name,
                description: tasting.description ?? null,
                price: tasting.price ?? null,
                durationMinutes: tasting.durationMinutes ?? null,
                reservationRequired: tasting.reservationRequired ?? false,
                includes: tasting.includes ?? null,
                sourceUrl: "manual-correction",
                updatedAt: now,
              });
            }
            totalTastingsAdded++;
          }
        }
      }
    }
  }

  console.log("\n=== Repair Summary ===");
  console.log(`Wineries processed: ${toProcess.length}`);
  console.log(`Wines added: ${totalWinesAdded}, updated: ${totalWinesUpdated}`);
  console.log(`Tastings added: ${totalTastingsAdded}, updated: ${totalTastingsUpdated}`);
  if (opts.dryRun) console.log("(DRY RUN — no changes made)");
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filterSlug = args.includes("--winery")
    ? args[args.indexOf("--winery") + 1]
    : undefined;

  const correctionsPath = "data/corrections.json";
  if (!existsSync(correctionsPath)) {
    console.error(`Missing ${correctionsPath}. Create it first.`);
    process.exit(1);
  }

  const corrections: Corrections = JSON.parse(
    readFileSync(correctionsPath, "utf-8")
  );

  console.log(`Loaded corrections for ${Object.keys(corrections).length} wineries`);
  if (dryRun) console.log("DRY RUN mode — no DB changes will be made\n");

  await applyCorrections(corrections, { dryRun, filterSlug });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
