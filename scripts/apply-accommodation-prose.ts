/**
 * Apply regenerated accommodation prose from data/accommodation-prose-v2.json
 * to the accommodations table.
 *
 * Companion to scripts/regenerate-accommodation-prose.ts. Only writes entries
 * marked ok:true. Updates exactly five voice-sensitive columns
 * (shortDescription, whyStayHere, theSetting, theExperience, whyThisHotel) —
 * never touches hand-curated columns. Uses slug as WHERE clause.
 *
 * Usage:
 *   npx tsx scripts/apply-accommodation-prose.ts                       # dry run, local
 *   npx tsx scripts/apply-accommodation-prose.ts --apply                # local write
 *   npx tsx scripts/apply-accommodation-prose.ts --apply --turso        # production
 *   npx tsx scripts/apply-accommodation-prose.ts --in=data/sample.json  # custom input
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { accommodations } from "../src/db/schema";
import { eq } from "drizzle-orm";

const shouldApply = process.argv.includes("--apply");
const useTurso = process.argv.includes("--turso");
const inArg = process.argv.find((a) => a.startsWith("--in="))?.split("=")[1];
const inPath = inArg ? path.resolve(inArg) : path.resolve("data/accommodation-prose-v2.json");
const includeSlugsArg = process.argv
  .find((a) => a.startsWith("--include-slugs="))
  ?.split("=")[1];
const includeSlugs = new Set(
  includeSlugsArg ? includeSlugsArg.split(",").map((s) => s.trim()).filter(Boolean) : []
);

if (useTurso && !shouldApply) {
  console.error("--turso requires --apply (no dry-runs against production)");
  process.exit(1);
}

let dbUrl: string;
let dbAuthToken: string | undefined;
if (useTurso) {
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    const { execSync } = require("child_process") as typeof import("child_process");
    dbAuthToken = execSync("turso db tokens create napa-winery-search", { encoding: "utf-8" }).trim();
  }
  console.log("Target: Turso production");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Target: local database");
}
console.log(`Mode:   ${shouldApply ? "APPLY (writing)" : "DRY RUN (no writes)"}`);
console.log(`Input:  ${inPath}\n`);

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

interface ProseOutput {
  shortDescription: string;
  whyStayHere: string;
  theSetting: string;
  theExperience: string;
  whyThisHotel: string[];
}
interface Entry {
  slug: string;
  name: string;
  ok: boolean;
  attempts: number;
  output: ProseOutput | null;
  violations: { type: string; detail: string }[];
}
interface RegenFile {
  generatedAt: string;
  totalEntities: number;
  passed: number;
  failed: number;
  estimatedCost: number;
  entries: Record<string, Entry>;
}

async function main() {
  if (!fs.existsSync(inPath)) {
    console.error(`Input file not found: ${inPath}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(inPath, "utf-8")) as RegenFile;

  const allEntries = Object.values(data.entries);
  const okEntries = allEntries.filter((e) => e.ok && e.output);
  const rescuedEntries = allEntries.filter((e) => !e.ok && includeSlugs.has(e.slug) && e.output);
  const skippedFailures = allEntries.filter((e) => !e.ok && !includeSlugs.has(e.slug));
  const toApply = [...okEntries, ...rescuedEntries];

  console.log(`Loaded ${allEntries.length} entries from ${path.basename(inPath)}`);
  console.log(`  ok:       ${okEntries.length}`);
  if (rescuedEntries.length > 0) {
    console.log(`  rescued:  ${rescuedEntries.length}`);
    for (const e of rescuedEntries) console.log(`    + ${e.slug}`);
  }
  console.log(`  skipped:  ${skippedFailures.length}\n`);

  const allRows = await db.select({ slug: accommodations.slug }).from(accommodations);
  const dbSlugs = new Set(allRows.map((r) => r.slug));
  const missing = toApply.filter((e) => !dbSlugs.has(e.slug));
  if (missing.length > 0) {
    console.error(`✗ ${missing.length} slug(s) in JSON not found in DB:`);
    for (const m of missing) console.error(`  - ${m.slug}`);
    process.exit(1);
  }

  let applied = 0;
  for (const e of toApply) {
    const o = e.output!;
    if (shouldApply) {
      await db
        .update(accommodations)
        .set({
          shortDescription: o.shortDescription,
          whyStayHere: o.whyStayHere,
          theSetting: o.theSetting,
          theExperience: o.theExperience,
          whyThisHotel: JSON.stringify(o.whyThisHotel),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(accommodations.slug, e.slug));
      applied++;
      if (applied % 25 === 0) console.log(`  applied ${applied}/${toApply.length}...`);
    }
  }

  if (shouldApply) {
    console.log(`\n✓ Wrote ${applied} accommodation rows to ${useTurso ? "Turso production" : "local DB"}`);
  } else {
    console.log(`Dry run — would write ${toApply.length} accommodation rows.`);
    for (const e of toApply.slice(0, 3)) {
      const o = e.output!;
      console.log(`\n  ${e.name} (${e.slug}):`);
      console.log(`    shortDescription: ${o.shortDescription}`);
      console.log(`    whyStayHere: ${o.whyStayHere.slice(0, 120)}...`);
    }
  }

  if (skippedFailures.length > 0) {
    console.log(`\n${skippedFailures.length} entries skipped:`);
    for (const e of skippedFailures) {
      console.log(`  ✗ ${e.slug}: ${e.violations.map((v) => v.type).join(", ")}`);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
