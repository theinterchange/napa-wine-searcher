/**
 * Deletes the plan-approved set of misleading $0 entries from
 * `tasting_experiences`: Bucket A (wine-club-only) + Bucket B (not-actually-a-tasting),
 * by explicit row id. Then recomputes `wineries.tasting_price_min`.
 *
 * Bucket D (placeholder/unclear) is intentionally NOT deleted here — it
 * needs case-by-case sign-off after the audit.
 *
 * Run: npx tsx scripts/remove-misleading-zero-tastings.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@libsql/client";

// Bucket A — wine-club-member tastings (12)
const BUCKET_A_IDS = [649, 523, 504, 799, 798, 800, 1988, 402, 2197, 740, 628, 1935];

// Bucket B — not actually a tasting (5)
const BUCKET_B_IDS = [2090, 2199, 692, 2194, 496];

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  console.log("Target:", process.env.DATABASE_URL);

  const allIds = [...BUCKET_A_IDS, ...BUCKET_B_IDS];

  // Snapshot before delete: each affected winery's current min price
  const { rows: before } = await client.execute(`
    SELECT DISTINCT w.id, w.name, w.tasting_price_min as old_min
    FROM tasting_experiences te
    JOIN wineries w ON w.id = te.winery_id
    WHERE te.id IN (${allIds.join(",")})
    ORDER BY w.name
  `);

  // Delete
  const aDel = await client.execute(
    `DELETE FROM tasting_experiences WHERE id IN (${BUCKET_A_IDS.join(",")})`
  );
  console.log(`Bucket A: deleted ${aDel.rowsAffected} rows`);

  const bDel = await client.execute(
    `DELETE FROM tasting_experiences WHERE id IN (${BUCKET_B_IDS.join(",")})`
  );
  console.log(`Bucket B: deleted ${bDel.rowsAffected} rows`);

  // Recompute tasting_price_min
  console.log("\nRecomputing wineries.tasting_price_min...");
  const upd = await client.execute(`
    UPDATE wineries
    SET tasting_price_min = (
      SELECT MIN(price) FROM tasting_experiences
      WHERE tasting_experiences.winery_id = wineries.id
        AND price IS NOT NULL
    )
  `);
  console.log(`  ✓ updated ${upd.rowsAffected} winery rows`);

  // Diff: per-winery old vs new
  const ids = before.map((r: any) => r.id);
  if (ids.length > 0) {
    const { rows: after } = await client.execute(
      `SELECT id, name, tasting_price_min FROM wineries WHERE id IN (${ids.join(",")})`
    );
    const newByid = new Map(after.map((r: any) => [r.id, r.tasting_price_min]));
    console.log("\nPer-winery min-price diff (only the wineries touched):");
    before.forEach((r: any) => {
      const newMin = newByid.get(r.id);
      const oldStr = r.old_min == null ? "—" : `$${r.old_min}`;
      const newStr = newMin == null ? "(no priced experiences left)" : `$${newMin}`;
      const arrow = String(r.old_min) === String(newMin) ? "·" : "→";
      console.log(`  ${r.name}: ${oldStr} ${arrow} ${newStr}`);
    });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
