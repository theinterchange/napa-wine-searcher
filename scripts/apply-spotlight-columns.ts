/**
 * Phase 4.5 — Spotlight scheduling.
 *
 * Adds spotlight_year_month to wineries; adds curated/curated_at/
 * spotlight_year_month to accommodations; creates partial unique indexes
 * on both spotlight columns so two rows cannot claim the same month.
 *
 * Idempotent: each ALTER/CREATE INDEX is wrapped so re-runs no-op. Runs
 * against whichever DB DATABASE_URL points at — run once for local, once
 * for Turso.
 *
 * Run: npx tsx scripts/apply-spotlight-columns.ts
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
    label: "wineries.spotlight_year_month",
    sql: "ALTER TABLE wineries ADD COLUMN spotlight_year_month text",
  },
  {
    label: "idx_wineries_spotlight_unique (partial unique)",
    sql:
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_wineries_spotlight_unique " +
      "ON wineries (spotlight_year_month) " +
      "WHERE spotlight_year_month IS NOT NULL",
  },
  {
    label: "accommodations.curated",
    sql: "ALTER TABLE accommodations ADD COLUMN curated integer DEFAULT 0",
  },
  {
    label: "accommodations.curated_at",
    sql: "ALTER TABLE accommodations ADD COLUMN curated_at text",
  },
  {
    label: "accommodations.spotlight_year_month",
    sql: "ALTER TABLE accommodations ADD COLUMN spotlight_year_month text",
  },
  {
    label: "idx_accommodations_spotlight_unique (partial unique)",
    sql:
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_accommodations_spotlight_unique " +
      "ON accommodations (spotlight_year_month) " +
      "WHERE spotlight_year_month IS NOT NULL",
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
