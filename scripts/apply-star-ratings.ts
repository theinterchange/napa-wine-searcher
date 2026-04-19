/**
 * Apply star ratings from user-reviewed CSV to Turso production.
 *
 * Usage:
 *   npx tsx scripts/apply-star-ratings.ts                 # dry run
 *   npx tsx scripts/apply-star-ratings.ts --apply --turso  # production
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { accommodations } from "../src/db/schema/accommodations";
import { eq } from "drizzle-orm";

const applyMode = process.argv.includes("--apply");
const useTurso = process.argv.includes("--turso");

const dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
let dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
if (!dbAuthToken) {
  const { execSync } = require("child_process");
  dbAuthToken = execSync("turso db tokens create napa-winery-search", { encoding: "utf-8" }).trim();
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

// Parse CSV
const csvPath = "/Users/michaelchen/Downloads/Untitled spreadsheet - star-rating-review.csv";
const lines = readFileSync(csvPath, "utf-8").split("\n").filter(l => l.trim());
const header = lines[0].split(",");
const slugIdx = header.indexOf("slug");
const starIdx = header.indexOf("star_rating");

interface Entry { slug: string; star_rating: number | null; }

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { fields.push(current); current = ""; continue; }
    current += ch;
  }
  fields.push(current);
  return fields;
}

const entries: Entry[] = [];
for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  const slug = fields[slugIdx]?.trim();
  const starStr = fields[starIdx]?.trim();
  if (!slug) continue;
  entries.push({
    slug,
    star_rating: starStr && starStr !== "" ? Number(starStr) : null,
  });
}

(async () => {
  console.log(`Mode: ${applyMode ? (useTurso ? "PRODUCTION TURSO" : "LOCAL DB") : "DRY RUN"}`);
  console.log(`Entries: ${entries.length}`);

  // Fetch current star_rating from DB for comparison
  const current = await client.execute("SELECT slug, star_rating FROM accommodations ORDER BY slug");
  const currentMap: Record<string, number | null> = {};
  for (const r of current.rows) {
    currentMap[r.slug as string] = r.star_rating as number | null;
  }

  let updates = 0;
  let skipped = 0;
  let unchanged = 0;

  for (const e of entries) {
    const cur = currentMap[e.slug];
    if (cur === e.star_rating || (cur == null && e.star_rating == null)) {
      unchanged++;
      continue;
    }
    if (!(e.slug in currentMap)) {
      console.log(`  [SKIP] ${e.slug} — not found in DB`);
      skipped++;
      continue;
    }

    console.log(`  [UPDATE] ${e.slug}: ${cur ?? "NULL"} → ${e.star_rating ?? "NULL"}`);
    updates++;

    if (applyMode) {
      await db
        .update(accommodations)
        .set({ starRating: e.star_rating })
        .where(eq(accommodations.slug, e.slug));
    }
  }

  console.log(`\nSummary: ${updates} updates, ${unchanged} unchanged, ${skipped} skipped`);
  if (!applyMode) console.log("(dry run — add --apply --turso to write)");
})();
