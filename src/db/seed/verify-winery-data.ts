/**
 * Winery data verification script.
 *
 * Compares the curated winery data in curated-wineries.ts against what's
 * actually in the database (after seeding). Flags any mismatches so we can
 * detect stale or incorrect data.
 *
 * Usage:  npm run db:verify
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { curatedWineries } from "./data/curated-wineries";

import { wineries, wines, tastingExperiences, wineryRatings } from "../schema";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client);

interface Mismatch {
  winery: string;
  field: string;
  expected: string | number | boolean;
  actual: string | number | boolean | null;
}

async function verify() {
  const mismatches: Mismatch[] = [];
  const missing: string[] = [];
  let checked = 0;

  for (const curated of curatedWineries) {
    const [dbWinery] = await db
      .select()
      .from(wineries)
      .where(eq(wineries.slug, curated.slug))
      .limit(1);

    if (!dbWinery) {
      missing.push(curated.slug);
      continue;
    }

    checked++;

    // Compare core fields
    const fieldsToCheck: { field: string; expected: unknown; actual: unknown }[] = [
      { field: "name", expected: curated.name, actual: dbWinery.name },
      { field: "phone", expected: curated.phone, actual: dbWinery.phone },
      { field: "address", expected: curated.address, actual: dbWinery.address },
      { field: "zip", expected: curated.zip, actual: dbWinery.zip },
      { field: "websiteUrl", expected: curated.websiteUrl, actual: dbWinery.websiteUrl },
      { field: "reservationRequired", expected: curated.reservationRequired, actual: dbWinery.reservationRequired },
      { field: "priceLevel", expected: curated.priceLevel, actual: dbWinery.priceLevel },
      { field: "curated", expected: true, actual: dbWinery.curated },
    ];

    for (const { field, expected, actual } of fieldsToCheck) {
      if (String(expected) !== String(actual)) {
        mismatches.push({
          winery: curated.slug,
          field,
          expected: expected as string | number | boolean,
          actual: actual as string | number | boolean | null,
        });
      }
    }

    // Check wine count
    const dbWines = await db
      .select()
      .from(wines)
      .where(eq(wines.wineryId, dbWinery.id));

    if (dbWines.length !== curated.wines.length) {
      mismatches.push({
        winery: curated.slug,
        field: "wines.count",
        expected: curated.wines.length,
        actual: dbWines.length,
      });
    }

    // Spot-check first wine price
    if (curated.wines.length > 0 && dbWines.length > 0) {
      const curatedFirst = curated.wines[0];
      const dbMatch = dbWines.find((w) => w.name === curatedFirst.name);
      if (dbMatch) {
        if (dbMatch.price !== curatedFirst.price) {
          mismatches.push({
            winery: curated.slug,
            field: `wines["${curatedFirst.name}"].price`,
            expected: curatedFirst.price,
            actual: dbMatch.price ?? "null",
          });
        }
      } else {
        mismatches.push({
          winery: curated.slug,
          field: `wines["${curatedFirst.name}"]`,
          expected: "exists",
          actual: "missing",
        });
      }
    }

    // Check tasting count
    const dbTastings = await db
      .select()
      .from(tastingExperiences)
      .where(eq(tastingExperiences.wineryId, dbWinery.id));

    if (dbTastings.length !== curated.tastings.length) {
      mismatches.push({
        winery: curated.slug,
        field: "tastings.count",
        expected: curated.tastings.length,
        actual: dbTastings.length,
      });
    }

    // Spot-check first tasting price
    if (curated.tastings.length > 0 && dbTastings.length > 0) {
      const curatedFirst = curated.tastings[0];
      const dbMatch = dbTastings.find((t) => t.name === curatedFirst.name);
      if (dbMatch) {
        if (dbMatch.price !== curatedFirst.price) {
          mismatches.push({
            winery: curated.slug,
            field: `tastings["${curatedFirst.name}"].price`,
            expected: curatedFirst.price,
            actual: dbMatch.price ?? "null",
          });
        }
      }
    }

    // Check winery ratings count
    const dbRatings = await db
      .select()
      .from(wineryRatings)
      .where(eq(wineryRatings.wineryId, dbWinery.id));

    if (dbRatings.length !== curated.ratings.length) {
      mismatches.push({
        winery: curated.slug,
        field: "ratings.count",
        expected: curated.ratings.length,
        actual: dbRatings.length,
      });
    }
  }

  // Print report
  console.log("\n═══════════════════════════════════════════════");
  console.log("  Winery Data Verification Report");
  console.log("═══════════════════════════════════════════════\n");
  console.log(`  Curated wineries:  ${curatedWineries.length}`);
  console.log(`  Found in DB:       ${checked}`);
  console.log(`  Missing from DB:   ${missing.length}`);
  console.log(`  Mismatches:        ${mismatches.length}`);
  console.log("");

  if (missing.length > 0) {
    console.log("  MISSING FROM DATABASE:");
    for (const slug of missing) {
      console.log(`    - ${slug}`);
    }
    console.log("");
  }

  if (mismatches.length > 0) {
    console.log("  MISMATCHES:");
    for (const m of mismatches) {
      console.log(`    ${m.winery} → ${m.field}`);
      console.log(`      expected: ${m.expected}`);
      console.log(`      actual:   ${m.actual}`);
    }
    console.log("");
  }

  if (missing.length === 0 && mismatches.length === 0) {
    console.log("  All curated winery data matches the database.");
    console.log("");
  }

  console.log("═══════════════════════════════════════════════\n");

  // Exit with error code if there are issues
  if (missing.length > 0 || mismatches.length > 0) {
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
