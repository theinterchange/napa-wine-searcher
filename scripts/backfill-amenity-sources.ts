/**
 * Backfill missing dog/kid source URLs for wineries from amenity-audit-v2-report-final.json.
 *
 * 42 wineries currently have kid_friendly set (true/false) but kid_friendly_source IS NULL,
 * because earlier apply runs lost the source. The v2 audit JSON still has them — pull them
 * back so the sidebar can wrap labels in verifiable links.
 *
 * Also handles dog_friendly_source for any winery in the same state.
 *
 * Usage:
 *   npx tsx scripts/backfill-amenity-sources.ts                  # dry run, local
 *   npx tsx scripts/backfill-amenity-sources.ts --apply          # write to local
 *   npx tsx scripts/backfill-amenity-sources.ts --apply --turso  # write to Turso
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { eq, and, isNull, isNotNull } from "drizzle-orm";

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
const db = drizzle(client);

interface V2Entry {
  type: string;
  slug: string;
  flags: {
    dogFriendly?: { value: boolean; sourceUrl?: string; classifiedQuotes?: unknown[] };
    kidFriendly?: { value: boolean; sourceUrl?: string; classifiedQuotes?: unknown[] };
  };
}

const v2: V2Entry[] = JSON.parse(readFileSync("amenity-audit-v2-report-final.json", "utf-8"))
  .filter((e: V2Entry) => e.type === "winery");

// Build slug → sources map
const sourcesBySlug = new Map<string, { dogSource?: string; kidSource?: string }>();
for (const e of v2) {
  const dogSrc = e.flags.dogFriendly?.classifiedQuotes && e.flags.dogFriendly.classifiedQuotes.length > 0
    ? e.flags.dogFriendly.sourceUrl
    : undefined;
  const kidSrc = e.flags.kidFriendly?.classifiedQuotes && e.flags.kidFriendly.classifiedQuotes.length > 0
    ? e.flags.kidFriendly.sourceUrl
    : undefined;
  if (dogSrc || kidSrc) sourcesBySlug.set(e.slug, { dogSource: dogSrc, kidSource: kidSrc });
}

async function main() {
  console.log(shouldApply ? "=== APPLYING ===\n" : "=== DRY RUN ===\n");

  // Find wineries with kid verdict but no source
  const kidNeedsSource = await db
    .select({ slug: wineries.slug, kidFriendly: wineries.kidFriendly })
    .from(wineries)
    .where(and(isNotNull(wineries.kidFriendly), isNull(wineries.kidFriendlySource)));

  const dogNeedsSource = await db
    .select({ slug: wineries.slug, dogFriendly: wineries.dogFriendly })
    .from(wineries)
    .where(and(isNotNull(wineries.dogFriendly), isNull(wineries.dogFriendlySource)));

  console.log(`Wineries needing kid source: ${kidNeedsSource.length}`);
  console.log(`Wineries needing dog source: ${dogNeedsSource.length}\n`);

  let kidFixed = 0, dogFixed = 0, kidUnavailable = 0, dogUnavailable = 0;

  for (const w of kidNeedsSource) {
    const src = sourcesBySlug.get(w.slug)?.kidSource;
    if (!src) { kidUnavailable++; continue; }
    console.log(`🍷 ${w.slug} kid source → ${src}`);
    if (shouldApply) {
      await db.update(wineries).set({ kidFriendlySource: src }).where(eq(wineries.slug, w.slug));
    }
    kidFixed++;
  }

  for (const w of dogNeedsSource) {
    const src = sourcesBySlug.get(w.slug)?.dogSource;
    if (!src) { dogUnavailable++; continue; }
    console.log(`🍷 ${w.slug} dog source → ${src}`);
    if (shouldApply) {
      await db.update(wineries).set({ dogFriendlySource: src }).where(eq(wineries.slug, w.slug));
    }
    dogFixed++;
  }

  console.log("\n========================================");
  console.log(shouldApply ? "        BACKFILL APPLIED" : "     DRY RUN COMPLETE");
  console.log("========================================");
  console.log(`Kid sources backfilled: ${kidFixed} (no v2 data: ${kidUnavailable})`);
  console.log(`Dog sources backfilled: ${dogFixed} (no v2 data: ${dogUnavailable})`);
}

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
