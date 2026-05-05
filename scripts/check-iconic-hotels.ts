import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

async function main() {
  const c = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  const r = await c.execute({
    sql:
      "SELECT id, slug, name, google_rating, google_review_count, hero_image_url IS NOT NULL as has_hero FROM accommodations WHERE slug IN ('auberge-du-soleil','solage-auberge-collection','singlethread-farm-restaurant-inn','meadowood-napa-valley','las-alcobas-napa-valley','the-setting-inn-napa-valley','calistoga-motor-lodge-and-spa','the-george') ORDER BY google_rating DESC",
    args: [],
  });
  for (const row of r.rows) console.log(row);
}
main();
