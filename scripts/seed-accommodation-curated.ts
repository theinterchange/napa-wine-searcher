/**
 * Bootstrap the homepage accommodation spotlight pool with a hand-picked
 * set of well-known Napa/Sonoma properties. Reversible via the admin UI
 * (/nalaadmin/accommodations toggles curated on/off).
 *
 * Run: npx tsx scripts/seed-accommodation-curated.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const SLUGS = [
  "auberge-du-soleil",
  "solage-auberge-collection",
  "singlethread-farm-restaurant-inn",
  "meadowood-napa-valley",
  "the-george",
  "the-setting-inn-napa-valley",
];

async function main() {
  const c = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  const now = new Date().toISOString();
  for (const slug of SLUGS) {
    const r = await c.execute({
      sql:
        "UPDATE accommodations SET curated = 1, curated_at = ? WHERE slug = ? RETURNING name",
      args: [now, slug],
    });
    if (r.rows.length === 0) {
      console.log(`  ✗ slug not found: ${slug}`);
    } else {
      console.log(`  ✓ curated: ${r.rows[0].name}`);
    }
  }

  const total = await c.execute(
    "SELECT COUNT(*) as n FROM accommodations WHERE curated = 1"
  );
  console.log(`\nTotal curated accommodations: ${total.rows[0].n}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
