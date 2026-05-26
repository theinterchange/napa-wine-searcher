/**
 * Editor's Picks rotation — data apply.
 *
 * Flips `editors_pick = 1` and assigns rank 1–8 to the slugs below.
 * Does NOT write `spotlight_teaser` — the homepage spotlight + editor's-picks
 * page both fall back to each winery's existing curated copy (whyVisit →
 * shortDescription → whyThisWinery), which is already hand-rewritten.
 *
 * Idempotent: re-runs first clear any prior picks, then re-apply. Updates
 * by slug (per feedback memory — Turso IDs diverge from local).
 *
 * Run: npx tsx scripts/apply-editors-picks-data.ts
 *      npx tsx scripts/apply-editors-picks-data.ts --dry-run
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

// Order = rotation order. Week N of the year picks (N % 8) from this list.
const PICKS: string[] = [
  "hamel",
  "the-donum-estate",
  "frogs-leap",
  "hall-wines",
  "castello-di-amorosa",
  "stags-leap-wine-cellars",
  "iron-horse",
  "jordan-winery",
];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log("Target:", process.env.DATABASE_URL ?? "file:./data/winery.db");
  console.log(dryRun ? "DRY RUN — no writes\n" : "WRITE MODE\n");

  // Sanity: every slug must exist in the DB.
  const placeholders = PICKS.map(() => "?").join(",");
  const existing = await client.execute({
    sql: `SELECT slug, name FROM wineries WHERE slug IN (${placeholders})`,
    args: PICKS,
  });
  const found = new Set(existing.rows.map((r) => r.slug as string));
  const missing = PICKS.filter((s) => !found.has(s));
  if (missing.length > 0) {
    console.error("Missing slugs in DB:", missing);
    process.exit(1);
  }
  console.log(`Verified all ${PICKS.length} slugs present.\n`);

  // First: clear any prior editor's picks so re-runs don't accumulate
  // orphaned rank rows from earlier configurations.
  if (!dryRun) {
    await client.execute(
      "UPDATE wineries SET editors_pick = 0, editors_pick_rank = NULL " +
        "WHERE editors_pick = 1 OR editors_pick_rank IS NOT NULL"
    );
    console.log("Cleared prior editor's picks.\n");
  }

  // Apply the 8 picks in order (rank = index + 1).
  for (let i = 0; i < PICKS.length; i++) {
    const slug = PICKS[i];
    const rank = i + 1;
    const row = existing.rows.find((r) => r.slug === slug);
    const name = row?.name as string;
    console.log(`  [${rank}] ${name} (${slug})`);
    if (!dryRun) {
      await client.execute({
        sql:
          "UPDATE wineries SET editors_pick = 1, editors_pick_rank = ? " +
          "WHERE slug = ?",
        args: [rank, slug],
      });
    }
  }

  console.log(dryRun ? "\nDry run complete. Re-run without --dry-run to apply." : "\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
