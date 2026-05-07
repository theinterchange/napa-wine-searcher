import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";

async function main() {
  const client = createClient({
    url: "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  const db = drizzle(client);

  // First, check what columns exist
  const schemaRows = await db.all(sql`PRAGMA table_info(accommodations)`);
  const proseCols = (schemaRows as { name: string }[])
    .filter((r) => /description|why|setting|vibe|teaser|story|charm|highlight/i.test(r.name))
    .map((r) => r.name);
  console.log("Prose-ish columns:", proseCols.join(", "));
  console.log();

  const colList = proseCols.map((c) => `"${c}"`).join(", ");
  const rows = await db.all(sql.raw(`
    SELECT name, slug, ${colList}
    FROM accommodations
    ORDER BY RANDOM()
    LIMIT 8
  `));

  for (const r of rows as Record<string, string | null>[]) {
    console.log(`\n=== ${r.name} (${r.slug}) ===`);
    for (const col of proseCols) {
      const val = r[col];
      if (val && val.length > 0) {
        console.log(`${col}: ${String(val).slice(0, 350)}`);
      }
    }
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
