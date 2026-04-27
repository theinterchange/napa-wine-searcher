import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });

  const routes = await client.execute(
    "SELECT id, slug FROM day_trip_routes LIMIT 10"
  );

  async function measure(label: string, ids: number[]) {
    if (ids.length === 0) {
      console.log(`${label} — no stops`);
      return;
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
    const avgs: number[] = [];
    for (const [, perStop] of byHotel) {
      if (perStop.size !== ids.length) continue;
      const ds = ids.map((id) => perStop.get(id)!);
      if (Math.max(...ds) > 15) continue;
      avgs.push(ds.reduce((s, n) => s + n, 0) / ds.length);
    }
    avgs.sort((a, b) => a - b);
    const medAvg =
      avgs.length > 0 ? avgs[Math.floor(avgs.length / 2)] : null;
    console.log(
      `${label} (${ids.length} stops) → ${avgs.length} eligible. median avg: ${
        medAvg ? medAvg.toFixed(1) + "mi (~" + Math.round(medAvg * 2) + " min)" : "—"
      }`
    );
  }

  for (const r of routes.rows) {
    const stops = await client.execute({
      sql: "SELECT winery_id, valley_variant FROM day_trip_stops WHERE route_id = ? ORDER BY stop_order",
      args: [r.id as number],
    });
    const napa = stops.rows
      .filter((s) => s.valley_variant === "napa" || s.valley_variant === "both")
      .map((s) => Number(s.winery_id))
      .slice(0, 4);
    const sonoma = stops.rows
      .filter((s) => s.valley_variant === "sonoma" || s.valley_variant === "both")
      .map((s) => Number(s.winery_id))
      .slice(0, 4);
    await measure(`${r.slug} [napa 4-stop]`, napa);
    await measure(`${r.slug} [sonoma 4-stop]`, sonoma);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
