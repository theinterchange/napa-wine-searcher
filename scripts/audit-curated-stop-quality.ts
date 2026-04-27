import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

/**
 * Per-stop data-quality audit for curated trips. Every stop in a curated
 * route must pass these gates before launch:
 *
 *   - curated = true              (Michael personally vetted)
 *   - lat/lng present             (map + distance)
 *   - hours_json present          (we can render today's hours honestly)
 *   - whyVisit OR knownFor        (so the stop card has an editorial line)
 *   - amenity sources for each TRUE amenity (per memory rule)
 *
 * Read-only. Outputs a markdown punch list grouped by route.
 *
 * Run: npx tsx scripts/audit-curated-stop-quality.ts
 */

interface Issue {
  routeSlug: string;
  routeTitle: string;
  stopOrder: number;
  wineryName: string;
  wineryslug: string;
  problems: string[];
}

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });

  const r = await client.execute(`
    SELECT
      r.slug AS route_slug, r.title AS route_title,
      s.stop_order,
      w.slug AS w_slug, w.name AS w_name,
      w.curated, w.lat, w.lng, w.hours_json,
      w.why_visit, w.known_for,
      w.dog_friendly, w.dog_friendly_source,
      w.kid_friendly, w.kid_friendly_source,
      w.picnic_friendly, w.picnic_friendly_source,
      w.sustainable_farming, w.sustainable_source
    FROM day_trip_stops s
    JOIN day_trip_routes r ON r.id = s.route_id
    JOIN wineries w ON w.id = s.winery_id
    ORDER BY r.slug, s.stop_order
  `);

  const issues: Issue[] = [];

  for (const row of r.rows) {
    const problems: string[] = [];
    if (row.curated !== 1) problems.push("not curated=true");
    if (row.lat == null || row.lng == null) problems.push("missing lat/lng");
    if (!row.hours_json) problems.push("missing hours_json");
    if (!row.why_visit && !row.known_for) {
      problems.push("no whyVisit or knownFor (no editorial line)");
    }
    if (row.dog_friendly === 1 && !row.dog_friendly_source) {
      problems.push("dog_friendly=true; missing source");
    }
    if (row.kid_friendly === 1 && !row.kid_friendly_source) {
      problems.push("kid_friendly=true; missing source");
    }
    if (row.picnic_friendly === 1 && !row.picnic_friendly_source) {
      problems.push("picnic_friendly=true; missing source");
    }
    if (row.sustainable_farming === 1 && !row.sustainable_source) {
      problems.push("sustainable=true; missing source");
    }
    if (problems.length > 0) {
      issues.push({
        routeSlug: String(row.route_slug),
        routeTitle: String(row.route_title),
        stopOrder: Number(row.stop_order),
        wineryName: String(row.w_name),
        wineryslug: String(row.w_slug),
        problems,
      });
    }
  }

  const totalStops = r.rows.length;
  const cleanStops = totalStops - issues.length;
  console.log(`# Curated stop quality audit\n`);
  console.log(
    `Stops clean: ${cleanStops}/${totalStops} (${(
      (cleanStops / totalStops) *
      100
    ).toFixed(1)}%)\n`
  );

  if (issues.length === 0) {
    console.log(`All curated stops pass. Launch gate: PASS.`);
    return;
  }

  // Group by route
  const byRoute = new Map<string, Issue[]>();
  for (const i of issues) {
    if (!byRoute.has(i.routeSlug)) byRoute.set(i.routeSlug, []);
    byRoute.get(i.routeSlug)!.push(i);
  }

  for (const [slug, list] of byRoute) {
    const title = list[0].routeTitle;
    console.log(`\n## ${title}  (\`${slug}\`)\n`);
    for (const i of list) {
      console.log(
        `- Stop ${i.stopOrder} · **${i.wineryName}** [${i.wineryslug}]: ${i.problems.join(
          "; "
        )}`
      );
    }
  }

  const launchGate = cleanStops / totalStops >= 1.0;
  console.log(
    `\nLaunch gate (100% of curated stops clean): ${launchGate ? "PASS" : "FAIL"}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
