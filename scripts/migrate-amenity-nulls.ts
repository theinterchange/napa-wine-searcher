/**
 * One-shot migration: backfill the amenity "no info" vs "explicit false" bug.
 *
 * Background: dog_friendly / kid_friendly / adults_only used to default to 0,
 * so "we never verified this" and "we explicitly know it's not allowed"
 * collapsed into the same value. This script wipes the orphaned-false rows
 * (no source URL, no note) back to NULL so the sidebar can correctly omit them.
 *
 * Usage:
 *   npx tsx scripts/migrate-amenity-nulls.ts                  # dry run, local
 *   npx tsx scripts/migrate-amenity-nulls.ts --apply          # write to local
 *   npx tsx scripts/migrate-amenity-nulls.ts --apply --turso  # write to Turso
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const shouldApply = process.argv.includes("--apply");
const useTurso = process.argv.includes("--turso");

let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  if (!shouldApply) { console.error("--turso requires --apply"); process.exit(1); }
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    const { execSync } = require("child_process") as typeof import("child_process");
    dbAuthToken = execSync("turso db tokens create napa-winery-search", { encoding: "utf-8" }).trim();
  }
  console.log("Target: Turso production\n");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Target: local database\n");
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });

async function countRows(label: string, sql: string) {
  const r = await client.execute(sql);
  const count = (r.rows[0] as Record<string, unknown>).c as number;
  console.log(`  ${label}: ${count}`);
  return count;
}

async function main() {
  console.log(shouldApply ? "=== APPLYING ===\n" : "=== DRY RUN ===\n");

  console.log("BEFORE:");
  await countRows(
    "wineries dog=0 no source no note",
    "SELECT COUNT(*) AS c FROM wineries WHERE dog_friendly = 0 AND dog_friendly_source IS NULL AND dog_friendly_note IS NULL"
  );
  await countRows(
    "wineries kid=0 no source no note (low/no conf)",
    "SELECT COUNT(*) AS c FROM wineries WHERE kid_friendly = 0 AND kid_friendly_source IS NULL AND kid_friendly_note IS NULL AND (kid_friendly_confidence IS NULL OR kid_friendly_confidence = 'low')"
  );
  await countRows(
    "accommodations dog=0 no source no note",
    "SELECT COUNT(*) AS c FROM accommodations WHERE dog_friendly = 0 AND dog_friendly_source IS NULL AND dog_friendly_note IS NULL"
  );
  await countRows(
    "accommodations adults_only=0 no kid signal",
    "SELECT COUNT(*) AS c FROM accommodations WHERE adults_only = 0 AND kid_friendly_source IS NULL AND kid_friendly_note IS NULL"
  );
  await countRows(
    "accommodations kid=0 no source no note no adults_only",
    "SELECT COUNT(*) AS c FROM accommodations WHERE kid_friendly = 0 AND kid_friendly_source IS NULL AND kid_friendly_note IS NULL AND adults_only IS NOT 1"
  );

  if (shouldApply) {
    console.log("\nUpdating...");

    const r1 = await client.execute(
      "UPDATE wineries SET dog_friendly = NULL WHERE dog_friendly = 0 AND dog_friendly_source IS NULL AND dog_friendly_note IS NULL"
    );
    console.log(`  wineries dog → NULL: ${r1.rowsAffected} rows`);

    const r2 = await client.execute(
      "UPDATE wineries SET kid_friendly = NULL, kid_friendly_confidence = NULL WHERE kid_friendly = 0 AND kid_friendly_source IS NULL AND kid_friendly_note IS NULL AND (kid_friendly_confidence IS NULL OR kid_friendly_confidence = 'low')"
    );
    console.log(`  wineries kid → NULL: ${r2.rowsAffected} rows`);

    const r3 = await client.execute(
      "UPDATE accommodations SET dog_friendly = NULL WHERE dog_friendly = 0 AND dog_friendly_source IS NULL AND dog_friendly_note IS NULL"
    );
    console.log(`  accommodations dog → NULL: ${r3.rowsAffected} rows`);

    const r4 = await client.execute(
      "UPDATE accommodations SET adults_only = NULL WHERE adults_only = 0 AND kid_friendly_source IS NULL AND kid_friendly_note IS NULL"
    );
    console.log(`  accommodations adults_only → NULL: ${r4.rowsAffected} rows`);

    const r5 = await client.execute(
      "UPDATE accommodations SET kid_friendly = NULL WHERE kid_friendly = 0 AND kid_friendly_source IS NULL AND kid_friendly_note IS NULL AND adults_only IS NOT 1"
    );
    console.log(`  accommodations kid → NULL: ${r5.rowsAffected} rows`);

    console.log("\nAFTER:");
    await countRows(
      "wineries dog=0 no source no note",
      "SELECT COUNT(*) AS c FROM wineries WHERE dog_friendly = 0 AND dog_friendly_source IS NULL AND dog_friendly_note IS NULL"
    );
    await countRows(
      "wineries dog IS NULL",
      "SELECT COUNT(*) AS c FROM wineries WHERE dog_friendly IS NULL"
    );
    await countRows(
      "wineries kid IS NULL",
      "SELECT COUNT(*) AS c FROM wineries WHERE kid_friendly IS NULL"
    );
    await countRows(
      "accommodations dog IS NULL",
      "SELECT COUNT(*) AS c FROM accommodations WHERE dog_friendly IS NULL"
    );
    await countRows(
      "accommodations adults_only IS NULL",
      "SELECT COUNT(*) AS c FROM accommodations WHERE adults_only IS NULL"
    );
  }

  console.log("\nDone.");
}

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
