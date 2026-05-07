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

  const rows = await db.all(sql`
    SELECT name, slug, short_description, why_visit, the_setting, tasting_room_vibe
    FROM wineries
    ORDER BY RANDOM()
    LIMIT 10
  `);

  for (const r of rows as Record<string, string | null>[]) {
    console.log(`\n=== ${r.name} (${r.slug}) ===`);
    console.log(`SHORT: ${r.short_description}`);
    console.log(`WHY VISIT: ${r.why_visit}`);
    console.log(`THE SETTING: ${r.the_setting}`);
    console.log(`TASTING ROOM VIBE: ${r.tasting_room_vibe}`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
