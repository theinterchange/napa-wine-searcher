import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });

  const { rows: total } = await client.execute("SELECT COUNT(*) as n FROM wineries");
  const { rows: withTastings } = await client.execute(
    "SELECT COUNT(DISTINCT winery_id) as n FROM tasting_experiences WHERE price IS NOT NULL"
  );
  const { rows: priceDist } = await client.execute(`
    SELECT
      CASE
        WHEN min_price < 25 THEN '<$25'
        WHEN min_price < 50 THEN '$25-49'
        WHEN min_price < 75 THEN '$50-74'
        WHEN min_price < 100 THEN '$75-99'
        WHEN min_price < 150 THEN '$100-149'
        ELSE '$150+'
      END as bucket,
      COUNT(*) as n
    FROM (
      SELECT winery_id, MIN(price) as min_price
      FROM tasting_experiences
      WHERE price IS NOT NULL
      GROUP BY winery_id
    )
    GROUP BY bucket
  `);
  const { rows: samples } = await client.execute(`
    SELECT w.name, w.price_level, MIN(te.price) as min_price, COUNT(te.id) as experience_count
    FROM wineries w
    LEFT JOIN tasting_experiences te ON te.winery_id = w.id AND te.price IS NOT NULL
    GROUP BY w.id
    HAVING min_price IS NOT NULL
    ORDER BY w.total_ratings DESC
    LIMIT 10
  `);
  const { rows: byPriceLevel } = await client.execute(`
    SELECT w.price_level, COUNT(*) as total, COUNT(min_price) as with_price
    FROM wineries w
    LEFT JOIN (
      SELECT winery_id, MIN(price) as min_price
      FROM tasting_experiences WHERE price IS NOT NULL GROUP BY winery_id
    ) t ON t.winery_id = w.id
    GROUP BY w.price_level
    ORDER BY w.price_level
  `);

  console.log(`Wineries total: ${total[0].n}`);
  console.log(`Wineries with at least one priced tasting: ${withTastings[0].n}`);
  const pct = ((Number(withTastings[0].n) / Number(total[0].n)) * 100).toFixed(1);
  console.log(`Coverage: ${pct}%`);
  console.log(`\nCoverage by priceLevel ($/$$/$$$/$$$$):`);
  byPriceLevel.forEach((r: any) => {
    const pl = r.price_level ?? "null";
    const cov = r.total > 0 ? ((Number(r.with_price) / Number(r.total)) * 100).toFixed(0) : "—";
    console.log(`  level ${pl}: ${r.with_price}/${r.total} (${cov}%)`);
  });
  console.log(`\nMin-price distribution:`);
  priceDist.forEach((r: any) => console.log(`  ${r.bucket}: ${r.n}`));
  console.log(`\nTop-10 ranked wineries with prices:`);
  samples.forEach((r: any) => console.log(`  ${r.name} (priceLevel ${r.price_level}): from $${r.min_price} (${r.experience_count} experiences)`));
}

main().catch((e) => { console.error(e); process.exit(1); });
