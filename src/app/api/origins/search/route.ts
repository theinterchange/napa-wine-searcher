import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accommodations } from "@/db/schema";
import { like, or, and, isNotNull, desc, sql } from "drizzle-orm";

/** Escape SQL LIKE wildcards so a user typing '%' doesn't blow things up. */
function escapeLike(raw: string): string {
  return raw.replace(/[\\%_]/g, "\\$&");
}

/**
 * Autocomplete source for the trip-builder's starting-point input.
 * Combines:
 *   1. Matched accommodations in our DB (hotels the user might stay at)
 *   2. Matched preset cities / airports (common starting points)
 *
 * No external Places API — everything comes from our own data + a tight
 * preset list. Results merged and capped at 10.
 */

type OriginResult = {
  id: string;
  kind: "hotel" | "city";
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
};

const PRESETS: OriginResult[] = [
  {
    id: "city-sfo",
    kind: "city",
    name: "SFO / San Francisco Airport",
    subtitle: "International airport",
    lat: 37.6188,
    lng: -122.3756,
  },
  {
    id: "city-sf",
    kind: "city",
    name: "San Francisco",
    subtitle: "Bay Area",
    lat: 37.7749,
    lng: -122.4194,
  },
  {
    id: "city-napa",
    kind: "city",
    name: "Napa (downtown)",
    subtitle: "Napa Valley",
    lat: 38.2975,
    lng: -122.2869,
  },
  {
    id: "city-yountville",
    kind: "city",
    name: "Yountville",
    subtitle: "Napa Valley",
    lat: 38.401,
    lng: -122.362,
  },
  {
    id: "city-sthelena",
    kind: "city",
    name: "St. Helena",
    subtitle: "Napa Valley",
    lat: 38.505,
    lng: -122.471,
  },
  {
    id: "city-calistoga",
    kind: "city",
    name: "Calistoga",
    subtitle: "Napa Valley",
    lat: 38.5788,
    lng: -122.5797,
  },
  {
    id: "city-healdsburg",
    kind: "city",
    name: "Healdsburg",
    subtitle: "Sonoma County",
    lat: 38.6103,
    lng: -122.8695,
  },
  {
    id: "city-sonoma",
    kind: "city",
    name: "Sonoma (downtown)",
    subtitle: "Sonoma County",
    lat: 38.2919,
    lng: -122.4584,
  },
  {
    id: "city-santarosa",
    kind: "city",
    name: "Santa Rosa",
    subtitle: "Sonoma County",
    lat: 38.4405,
    lng: -122.7144,
  },
  {
    id: "city-kenwood",
    kind: "city",
    name: "Glen Ellen / Kenwood",
    subtitle: "Sonoma Valley",
    lat: 38.3785,
    lng: -122.5447,
  },
  {
    id: "city-oak",
    kind: "city",
    name: "OAK / Oakland Airport",
    subtitle: "International airport",
    lat: 37.7213,
    lng: -122.2209,
  },
];

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  const limit = Math.min(
    15,
    Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "10", 10))
  );

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const needle = q.toLowerCase();
  const pattern = `%${escapeLike(needle)}%`;

  try {
    const hotelRows = await db
      .select({
        id: accommodations.id,
        name: accommodations.name,
        city: accommodations.city,
        lat: accommodations.lat,
        lng: accommodations.lng,
      })
      .from(accommodations)
      .where(
        and(
          isNotNull(accommodations.lat),
          isNotNull(accommodations.lng),
          or(
            like(sql`lower(${accommodations.name})`, pattern),
            like(sql`lower(${accommodations.city})`, pattern)
          )
        )
      )
      .orderBy(desc(accommodations.googleRating))
      .limit(limit);

    const hotelResults: OriginResult[] = hotelRows
      .filter((r): r is typeof r & { lat: number; lng: number } =>
        r.lat != null && r.lng != null
      )
      .map((r) => ({
        id: `hotel-${r.id}`,
        kind: "hotel",
        name: r.name,
        subtitle: r.city ? `${r.city} · Hotel` : "Hotel",
        lat: r.lat,
        lng: r.lng,
      }));

    // Presets: substring match against name
    const cityResults = PRESETS.filter((p) =>
      p.name.toLowerCase().includes(needle)
    );

    // Merge: cities/airports first (most people start from one), hotels
    // below. Cap at `limit`.
    const merged: OriginResult[] = [];
    const seen = new Set<string>();
    for (const r of [...cityResults, ...hotelResults]) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      merged.push(r);
      if (merged.length >= limit) break;
    }
    return NextResponse.json(merged);
  } catch (err) {
    console.error("GET /api/origins/search error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
