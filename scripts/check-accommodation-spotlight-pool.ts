/**
 * Reports why the homepage accommodation spotlight may not be rendering.
 * Counts: curated, with-hero-image, and the actual eligible pool size.
 *
 * Run: npx tsx scripts/check-accommodation-spotlight-pool.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/winery.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
});

async function main() {
  console.log("Target:", process.env.DATABASE_URL ?? "file:./data/winery.db");

  const total = await client.execute(
    "SELECT COUNT(*) as n FROM accommodations"
  );
  const curated = await client.execute(
    "SELECT COUNT(*) as n FROM accommodations WHERE curated = 1"
  );
  const withHero = await client.execute(
    "SELECT COUNT(*) as n FROM accommodations WHERE hero_image_url IS NOT NULL"
  );
  const eligible = await client.execute(
    "SELECT COUNT(*) as n FROM accommodations WHERE curated = 1 AND hero_image_url IS NOT NULL"
  );

  console.log("Total accommodations:", total.rows[0].n);
  console.log("Curated:", curated.rows[0].n);
  console.log("With hero image:", withHero.rows[0].n);
  console.log("Eligible for spotlight pool (curated AND hero):", eligible.rows[0].n);

  const topHero = await client.execute({
    sql: "SELECT id, slug, name, google_rating, google_review_count FROM accommodations WHERE hero_image_url IS NOT NULL ORDER BY google_rating DESC, google_review_count DESC LIMIT 8",
    args: [],
  });
  console.log("\nTop 8 hotels with hero image (candidates to curate):");
  for (const r of topHero.rows) {
    console.log(`  ${r.google_rating} ★  (${r.google_review_count} reviews)  ${r.name}  [${r.slug}]`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
