import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

/**
 * Backfill picnic_friendly_source for the two curated-route wineries the
 * audit flagged. Both have picnic areas as a primary public feature; the
 * source URLs are the wineries' own pages describing them.
 */
const FIXES = [
  {
    slug: "v-sattui",
    source: "https://vsattui.com/visit/",
    note: "Public picnic grounds on the estate; deli on-site (per V. Sattui visit page).",
  },
  {
    slug: "buena-vista",
    source: "https://www.buenavistawinery.com/visit-us/",
    note: "Historic Champagne Cellars and gardens with picnic areas (per visit page).",
  },
];

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });

  for (const f of FIXES) {
    const r = await client.execute({
      sql: `UPDATE wineries
              SET picnic_friendly_source = ?,
                  picnic_friendly_note = COALESCE(picnic_friendly_note, ?)
              WHERE slug = ?`,
      args: [f.source, f.note, f.slug],
    });
    console.log(`${f.slug}: rows updated = ${r.rowsAffected}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
