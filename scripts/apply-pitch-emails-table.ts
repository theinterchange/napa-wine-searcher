/**
 * Create pitch_emails table on Turso.
 * Idempotent — uses CREATE TABLE/INDEX IF NOT EXISTS.
 *
 * Run: npx tsx scripts/apply-pitch-emails-table.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS pitch_emails (
    id integer PRIMARY KEY AUTOINCREMENT,
    winery_id integer NOT NULL REFERENCES wineries(id),
    recipient_email text NOT NULL,
    subject text NOT NULL,
    sent_at text NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_pitch_emails_winery_id ON pitch_emails(winery_id)`,
];

async function main() {
  for (const sql of STATEMENTS) {
    try {
      await client.execute(sql);
      const preview = sql.replace(/\s+/g, " ").slice(0, 80);
      console.log(`✓ ${preview}${preview.length >= 80 ? "…" : ""}`);
    } catch (err) {
      console.error(`✗ Failed:`, sql.replace(/\s+/g, " ").slice(0, 100));
      console.error(err);
      process.exit(1);
    }
  }
  console.log("\nDone. pitch_emails table ready.");
}

main();
