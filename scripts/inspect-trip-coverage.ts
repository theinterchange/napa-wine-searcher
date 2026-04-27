import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });

  const trips = await client.execute(`
    SELECT share_code, name, valley
    FROM anonymous_trips
    ORDER BY created_at DESC
    LIMIT 6
  `);

  for (const t of trips.rows) {
    const sc = t.share_code as string;
    const tripRow = await client.execute({
      sql: "SELECT id FROM anonymous_trips WHERE share_code = ?",
      args: [sc],
    });
    if (tripRow.rows.length === 0) continue;
    const tripId = tripRow.rows[0].id;

    const stops = await client.execute({
      sql: `SELECT s.winery_id, w.name, w.city, w.lat, w.lng
            FROM anonymous_trip_stops s
            JOIN wineries w ON w.id = s.winery_id
            WHERE s.trip_id = ?
            ORDER BY s.stop_order`,
      args: [tripId as number],
    });
    const ids = stops.rows.map((s) => Number(s.winery_id));
    if (ids.length === 0) {
      console.log(`\n${sc} ${t.name} — no stops`);
      continue;
    }
    console.log(
      `\n${sc} "${t.name}" (${t.valley}) — ${stops.rows.length} stops:`
    );
    for (const s of stops.rows) {
      console.log(`  · ${s.name} (${s.city})`);
    }

    const placeholders = ids.map(() => "?").join(",");
    const pairs = await client.execute({
      sql: `SELECT accommodation_id, winery_id, distance_miles
            FROM accommodation_nearby_wineries
            WHERE winery_id IN (${placeholders})`,
      args: ids,
    });

    const byHotel = new Map<number, Map<number, number>>();
    for (const p of pairs.rows) {
      const hid = Number(p.accommodation_id);
      const wid = Number(p.winery_id);
      const dm = Number(p.distance_miles);
      if (!byHotel.has(hid)) byHotel.set(hid, new Map());
      byHotel.get(hid)!.set(wid, dm);
    }
    let eligible = 0;
    let onlyOne = 0;
    for (const [, perStop] of byHotel) {
      if (perStop.size === ids.length) eligible++;
      onlyOne++;
    }
    console.log(
      `  Eligible (≤15mi from ALL stops): ${eligible}, hotels with at least one nearby stop: ${onlyOne}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
