import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";

/**
 * Top-N winery data audit. Picks the N wineries by Google review count
 * (best proxy for "people will plan trips that include this place") and
 * reports which fields are missing or stale.
 *
 * Fields checked, with rationale:
 *   - hoursJson           required to render "open today" honestly
 *   - reservationRequired required so we can warn ahead of visit
 *   - lat/lng             required for map + distance calcs + Stay22 ranking
 *   - dogFriendlySource   required if dogFriendly is true (per memory)
 *   - kidFriendlySource   required if kidFriendly is true
 *   - picnicFriendlySource required if picnicFriendly is true
 *   - sustainableSource   required if sustainableFarming is true
 *   - lastScrapedAt       freshness; flag if older than 60 days
 *
 * Read-only. Outputs a markdown punch list to stdout.
 *
 * Run: npx tsx scripts/audit-top-wineries.ts [topN=100]
 */

interface Issue {
  slug: string;
  name: string;
  reviews: number;
  problems: string[];
}

const STALE_DAYS = 60;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

async function main() {
  const topN = Number(process.argv[2] ?? 100);
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./data/winery.db",
    authToken: process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, ""),
  });

  const r = await client.execute({
    sql: `
      SELECT
        slug, name,
        google_review_count, google_rating,
        hours_json, reservation_required,
        lat, lng,
        dog_friendly,        dog_friendly_source,
        kid_friendly,        kid_friendly_source,
        picnic_friendly,     picnic_friendly_source,
        sustainable_farming, sustainable_source,
        last_scraped_at, curated
      FROM wineries
      WHERE google_review_count IS NOT NULL
      ORDER BY google_review_count DESC
      LIMIT ?
    `,
    args: [topN],
  });

  const issues: Issue[] = [];
  const counters = {
    missingHours: 0,
    missingReservationFlag: 0,
    missingCoords: 0,
    unsourcedDog: 0,
    unsourcedKid: 0,
    unsourcedPicnic: 0,
    unsourcedSustainable: 0,
    staleScrape: 0,
  };

  for (const row of r.rows) {
    const problems: string[] = [];

    if (!row.hours_json) {
      problems.push("hours_json missing");
      counters.missingHours++;
    }
    // reservation_required is a tri-state in spirit (true / false / unknown).
    // Default false in schema means we can't tell "unknown" from "no", so
    // flag only when null since some rows came in pre-default.
    if (row.reservation_required == null) {
      problems.push("reservation_required null");
      counters.missingReservationFlag++;
    }
    if (row.lat == null || row.lng == null) {
      problems.push("lat/lng missing");
      counters.missingCoords++;
    }
    if (row.dog_friendly === 1 && !row.dog_friendly_source) {
      problems.push("dog_friendly=true but no source");
      counters.unsourcedDog++;
    }
    if (row.kid_friendly === 1 && !row.kid_friendly_source) {
      problems.push("kid_friendly=true but no source");
      counters.unsourcedKid++;
    }
    if (row.picnic_friendly === 1 && !row.picnic_friendly_source) {
      problems.push("picnic_friendly=true but no source");
      counters.unsourcedPicnic++;
    }
    if (row.sustainable_farming === 1 && !row.sustainable_source) {
      problems.push("sustainable=true but no source");
      counters.unsourcedSustainable++;
    }
    const stale = daysSince(row.last_scraped_at as string | null);
    if (stale != null && stale > STALE_DAYS) {
      problems.push(`scrape stale ${stale}d`);
      counters.staleScrape++;
    } else if (stale == null) {
      problems.push("never scraped");
      counters.staleScrape++;
    }

    if (problems.length > 0) {
      issues.push({
        slug: String(row.slug),
        name: String(row.name),
        reviews: Number(row.google_review_count ?? 0),
        problems,
      });
    }
  }

  const total = r.rows.length;
  const clean = total - issues.length;
  console.log(`# Top ${total} winery data audit\n`);
  console.log(`Clean: ${clean}/${total} (${((clean / total) * 100).toFixed(1)}%)\n`);
  console.log(`## Per-field coverage gaps`);
  console.log(`| Field | Missing in top ${total} |`);
  console.log(`|---|---:|`);
  console.log(`| hours_json | ${counters.missingHours} |`);
  console.log(`| reservation_required | ${counters.missingReservationFlag} |`);
  console.log(`| lat/lng | ${counters.missingCoords} |`);
  console.log(`| dog_friendly source | ${counters.unsourcedDog} |`);
  console.log(`| kid_friendly source | ${counters.unsourcedKid} |`);
  console.log(`| picnic_friendly source | ${counters.unsourcedPicnic} |`);
  console.log(`| sustainable source | ${counters.unsourcedSustainable} |`);
  console.log(`| stale or never-scraped (>${STALE_DAYS}d) | ${counters.staleScrape} |`);

  if (issues.length === 0) {
    console.log(`\nAll ${total} rows clean. Launch gate: PASS.`);
    return;
  }

  console.log(`\n## Punch list (${issues.length} rows)\n`);
  console.log(`| Reviews | Slug | Issues |`);
  console.log(`|---:|---|---|`);
  for (const i of issues) {
    console.log(`| ${i.reviews} | ${i.slug} | ${i.problems.join("; ")} |`);
  }

  const launchGate = clean / total >= 0.95;
  console.log(
    `\nLaunch gate (≥95% clean): ${launchGate ? "PASS" : "FAIL"} — currently ${(
      (clean / total) *
      100
    ).toFixed(1)}%`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
