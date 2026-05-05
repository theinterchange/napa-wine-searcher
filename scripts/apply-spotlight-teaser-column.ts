/**
 * Phase 4.5b — Spotlight teaser content.
 *
 * Adds spotlight_teaser TEXT column to wineries + accommodations.
 * Idempotent: skips on duplicate-column errors. Runs against whichever
 * DB DATABASE_URL points at — run once for local, once for Turso.
 *
 * Run: npx tsx scripts/apply-spotlight-teaser-column.ts
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
    label: "wineries.spotlight_teaser",
    sql: "ALTER TABLE wineries ADD COLUMN spotlight_teaser text",
  },
  {
    label: "accommodations.spotlight_teaser",
    sql: "ALTER TABLE accommodations ADD COLUMN spotlight_teaser text",
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
