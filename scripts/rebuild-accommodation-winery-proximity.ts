/**
 * Rebuild `accommodation_nearby_wineries` with every hotel↔winery pair
 * within RADIUS_MILES (20 by default).
 *
 * The original seed kept only the 6 closest wineries per hotel, which
 * made the trip-picker sparse: a hotel only surfaced for a trip if one
 * of its 6 nearest wineries happened to be a stop. With a full 20-mile
 * radius the picker has real range — any trip in the neighborhood
 * surfaces the right set of hotels.
 *
 * Idempotent: wipes the table and reinserts.
 *
 * Run: npx tsx scripts/rebuild-accommodation-winery-proximity.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const RADIUS_MILES = 15;

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });
  console.log("Target:", process.env.DATABASE_URL ?? "file:./data/winery.db");

  const hotels = await client.execute(
    "SELECT id, name, lat, lng FROM accommodations WHERE lat IS NOT NULL AND lng IS NOT NULL"
  );
  const wineries = await client.execute(
    "SELECT id, name, lat, lng FROM wineries WHERE lat IS NOT NULL AND lng IS NOT NULL"
  );
  console.log(
    `Hotels with coords: ${hotels.rows.length}, wineries with coords: ${wineries.rows.length}`
  );

  // Compute all pairs within radius.
  type Pair = {
    accommodationId: number;
    wineryId: number;
    distanceMiles: number;
    driveMinutes: number;
  };
  const pairs: Pair[] = [];
  for (const h of hotels.rows) {
    const hLat = Number(h.lat);
    const hLng = Number(h.lng);
    const hId = Number(h.id);
    for (const w of wineries.rows) {
      const d = haversineMiles(hLat, hLng, Number(w.lat), Number(w.lng));
      if (d <= RADIUS_MILES) {
        pairs.push({
          accommodationId: hId,
          wineryId: Number(w.id),
          distanceMiles: Math.round(d * 10) / 10,
          driveMinutes: Math.round(d * 2.5),
        });
      }
    }
  }

  console.log(`Computed ${pairs.length} pairs within ${RADIUS_MILES} mi`);
  const byHotel = new Map<number, number>();
  for (const p of pairs) {
    byHotel.set(p.accommodationId, (byHotel.get(p.accommodationId) ?? 0) + 1);
  }
  const counts = [...byHotel.values()];
  const avg = counts.length
    ? Math.round((counts.reduce((s, n) => s + n, 0) / counts.length) * 10) / 10
    : 0;
  console.log(
    `Per-hotel nearby wineries — min: ${Math.min(...counts)}, avg: ${avg}, max: ${Math.max(...counts)}`
  );

  console.log("Wiping accommodation_nearby_wineries...");
  await client.execute("DELETE FROM accommodation_nearby_wineries");

  console.log("Inserting pairs in batches of 500...");
  const BATCH = 500;
  for (let i = 0; i < pairs.length; i += BATCH) {
    const slice = pairs.slice(i, i + BATCH);
    const stmts = slice.map((p) => ({
      sql: "INSERT OR IGNORE INTO accommodation_nearby_wineries (accommodation_id, winery_id, distance_miles, drive_minutes) VALUES (?, ?, ?, ?)",
      args: [p.accommodationId, p.wineryId, p.distanceMiles, p.driveMinutes],
    }));
    await client.batch(stmts, "write");
    process.stdout.write(
      `\r  inserted ${Math.min(i + BATCH, pairs.length)}/${pairs.length}`
    );
  }
  process.stdout.write("\n");

  const after = await client.execute(
    "SELECT COUNT(*) as n, MAX(distance_miles) as max FROM accommodation_nearby_wineries"
  );
  console.log("Final row count:", after.rows[0].n, "max distance:", after.rows[0].max);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
