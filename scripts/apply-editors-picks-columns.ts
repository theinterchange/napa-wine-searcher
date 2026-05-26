/**
 * Editor's Picks rotation — schema migration.
 *
 * Adds `editors_pick` + `editors_pick_rank` to wineries. Drops the now-unused
 * monthly assignment system (`spotlight_year_month` + partial unique index on
 * wineries). `spotlight_teaser` stays — it's the editorial blurb the homepage
 * spotlight already renders; the Editor's Picks rotation feeds the same field.
 *
 * Accommodations' spotlight columns are intentionally untouched — separate
 * concern, separate UX, no overlap with the wineries Editor's Picks system.
 *
 * Idempotent: ALTERs that re-fail with "duplicate column" or "no such column"
 * are treated as no-ops so re-runs are safe. Runs against whichever DB
 * DATABASE_URL points at — run once for local, once for Turso.
 *
 * Run: npx tsx scripts/apply-editors-picks-columns.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

const STATEMENTS: Array<{ label: string; sql: string }> = [
  {
    label: "wineries.editors_pick",
    sql: "ALTER TABLE wineries ADD COLUMN editors_pick integer DEFAULT 0",
  },
  {
    label: "wineries.editors_pick_rank",
    sql: "ALTER TABLE wineries ADD COLUMN editors_pick_rank integer",
  },
  {
    label: "idx_wineries_editors_pick_rank (partial unique)",
    sql:
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_wineries_editors_pick_rank " +
      "ON wineries (editors_pick_rank) " +
      "WHERE editors_pick_rank IS NOT NULL",
  },
  // Drop the legacy monthly assignment plumbing for wineries.
  // Index must drop before the column it references.
  {
    label: "drop idx_wineries_spotlight_unique",
    sql: "DROP INDEX IF EXISTS idx_wineries_spotlight_unique",
  },
  {
    label: "drop wineries.spotlight_year_month",
    sql: "ALTER TABLE wineries DROP COLUMN spotlight_year_month",
  },
];

async function main() {
  console.log("Target:", process.env.DATABASE_URL ?? "file:./data/winery.db");
  for (const { label, sql } of STATEMENTS) {
    try {
      await client.execute(sql);
      console.log("  ✓", label);
    } catch (err) {
      const msg = (err as Error).message;
      if (
        msg.includes("duplicate column name") ||
        msg.includes("already exists") ||
        msg.includes("no such column")
      ) {
        console.log("  − already applied:", label);
      } else {
        console.log("  ✗", label, "=>", msg);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
