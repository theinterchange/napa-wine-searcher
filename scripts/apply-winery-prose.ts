/**
 * Apply regenerated winery prose from data/winery-prose-v2.json to the wineries table.
 *
 * Companion to scripts/regenerate-winery-prose.ts. Only writes entries marked
 * ok:true. Updates exactly five voice-sensitive columns (shortDescription,
 * whyVisit, theSetting, tastingRoomVibe, whyThisWinery) — never touches
 * hand-curated columns per feedback_isolate_writes_to_trusted_columns.md.
 * Uses slug as the WHERE clause per feedback_apply_script_use_slug.md.
 *
 * Usage:
 *   npx tsx scripts/apply-winery-prose.ts                       # dry run, local
 *   npx tsx scripts/apply-winery-prose.ts --apply                # local write
 *   npx tsx scripts/apply-winery-prose.ts --apply --turso        # production
 *   npx tsx scripts/apply-winery-prose.ts --in=data/sample.json  # custom input
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { eq } from "drizzle-orm";

const shouldApply = process.argv.includes("--apply");
const useTurso = process.argv.includes("--turso");
const inArg = process.argv.find((a) => a.startsWith("--in="))?.split("=")[1];
const inPath = inArg ? path.resolve(inArg) : path.resolve("data/winery-prose-v2.json");
// --include-slugs=foo,bar,baz — rescue specific failed entries despite ok:false.
// Used after manual review of the failure list. Apply the validator-failed
// entry's last-attempted output anyway.
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
  whyVisit: string;
  theSetting: string;
  tastingRoomVibe: string;
  whyThisWinery: string[];
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
  tokenUsage: { input: number; output: number };
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
  console.log(`  ok:       ${okEntries.length} (will be applied)`);
  if (rescuedEntries.length > 0) {
    console.log(`  rescued:  ${rescuedEntries.length} (--include-slugs override)`);
    for (const e of rescuedEntries) console.log(`    + ${e.slug}`);
  }
  console.log(`  skipped:  ${skippedFailures.length} (validator-failed, kept existing prose)\n`);

  // Validate that all --include-slugs values were actually found in the JSON
  const okOrRescuedSet = new Set(toApply.map((e) => e.slug));
  const missingFromInclude = [...includeSlugs].filter(
    (s) => !okOrRescuedSet.has(s) && !allEntries.find((e) => e.slug === s)
  );
  if (missingFromInclude.length > 0) {
    console.error(`✗ --include-slugs references slugs not in JSON: ${missingFromInclude.join(", ")}`);
    process.exit(1);
  }
  // Also warn if a slug is in --include-slugs but already passed (would be applied anyway)
  const redundantInclude = [...includeSlugs].filter((s) => okEntries.find((e) => e.slug === s));
  if (redundantInclude.length > 0) {
    console.warn(`⚠ --include-slugs lists slugs that already passed: ${redundantInclude.join(", ")} (redundant, no harm)`);
  }

  // Verify slugs exist in DB before writing
  const allWineries = await db.select({ slug: wineries.slug }).from(wineries);
  const dbSlugs = new Set(allWineries.map((w) => w.slug));

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
        .update(wineries)
        .set({
          shortDescription: o.shortDescription,
          whyVisit: o.whyVisit,
          theSetting: o.theSetting,
          tastingRoomVibe: o.tastingRoomVibe,
          whyThisWinery: JSON.stringify(o.whyThisWinery),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(wineries.slug, e.slug));
      applied++;
      if (applied % 25 === 0) console.log(`  applied ${applied}/${toApply.length}...`);
    }
  }

  if (shouldApply) {
    console.log(`\n✓ Wrote ${applied} winery rows to ${useTurso ? "Turso production" : "local DB"}`);
  } else {
    console.log(`Dry run — would write ${toApply.length} winery rows.`);
    console.log("Sample of what would change:");
    for (const e of toApply.slice(0, 3)) {
      const o = e.output!;
      console.log(`\n  ${e.name} (${e.slug}):`);
      console.log(`    shortDescription: ${o.shortDescription}`);
      console.log(`    whyVisit: ${o.whyVisit.slice(0, 120)}...`);
    }
  }

  if (skippedFailures.length > 0) {
    console.log(`\n${skippedFailures.length} entries skipped (validator failed, no rescue):`);
    for (const e of skippedFailures) {
      console.log(`  ✗ ${e.slug}: ${e.violations.map((v) => v.type).join(", ")}`);
    }
    console.log("\nThese keep their existing prose. To rescue: re-run with --include-slugs=slug1,slug2");
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
