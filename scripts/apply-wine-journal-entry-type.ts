/**
 * Hotfix — wine_journal_entries.entry_type missing in production Turso.
 *
 * Migration 0002 adds entry_type to wine_journal_entries and fetched_at
 * to winery_photos. Both columns are referenced by current Drizzle
 * selects (profile, journal pages); without them, queries fail with
 * "no such column" and the pages render the global error boundary.
 *
 * Idempotent: catches "duplicate column" so re-runs no-op. Runs against
 * whichever DB DATABASE_URL points at — run once for local, once for
 * Turso production.
 *
 * Run: npx tsx scripts/apply-wine-journal-entry-type.ts
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
    label: "wine_journal_entries.entry_type",
    sql: "ALTER TABLE wine_journal_entries ADD COLUMN entry_type text NOT NULL DEFAULT 'wine'",
  },
  {
    label: "winery_photos.fetched_at",
    sql: "ALTER TABLE winery_photos ADD COLUMN fetched_at text",
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
      if (msg.includes("duplicate column name") || msg.includes("already exists")) {
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
