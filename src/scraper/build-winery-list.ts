/**
 * Build a ranked list of top 150-200 wineries in Napa & Sonoma
 * using the Google Places API (Text Search).
 *
 * Usage: npx tsx src/scraper/build-winery-list.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { config } from "./config";
import type { WineryTarget } from "./types";

const API_KEY = config.googlePlacesApiKey;
const PLACES_API_BASE = "https://places.googleapis.com/v1/places:searchText";

if (!API_KEY) {
  console.error(
    "Missing API key. Set GOOGLE_PLACES_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."
  );
  process.exit(1);
}

// ---- Sub-region mapping ----

interface SubRegionMapping {
  slug: string;
  valley: "napa" | "sonoma";
  cities: string[];
}

const subRegionMappings: SubRegionMapping[] = [
  {
    slug: "calistoga",
    valley: "napa",
    cities: ["Calistoga"],
  },
  {
    slug: "st-helena",
    valley: "napa",
    cities: ["St. Helena", "Saint Helena", "St Helena"],
  },
  {
    slug: "rutherford",
    valley: "napa",
    cities: ["Rutherford"],
  },
  {
    slug: "oakville",
    valley: "napa",
    cities: ["Oakville"],
  },
  {
    slug: "yountville",
    valley: "napa",
    cities: ["Yountville"],
  },
  {
    slug: "stags-leap-district",
    valley: "napa",
    cities: ["Napa"], // Stags Leap is within Napa city limits
  },
  {
    slug: "atlas-peak",
    valley: "napa",
    cities: ["Napa"],
  },
  {
    slug: "mount-veeder",
    valley: "napa",
    cities: ["Napa"],
  },
  {
    slug: "carneros-napa",
    valley: "napa",
    cities: ["Napa", "American Canyon"],
  },
  {
    slug: "howell-mountain",
    valley: "napa",
    cities: ["Angwin", "St. Helena"],
  },
  {
    slug: "sonoma-valley",
    valley: "sonoma",
    cities: ["Sonoma", "Glen Ellen", "Kenwood"],
  },
  {
    slug: "russian-river-valley",
    valley: "sonoma",
    cities: [
      "Healdsburg",
      "Forestville",
      "Sebastopol",
      "Guerneville",
      "Windsor",
    ],
  },
  {
    slug: "dry-creek-valley",
    valley: "sonoma",
    cities: ["Healdsburg", "Geyserville"],
  },
  {
    slug: "alexander-valley",
    valley: "sonoma",
    cities: ["Healdsburg", "Geyserville", "Cloverdale"],
  },
  {
    slug: "carneros-sonoma",
    valley: "sonoma",
    cities: ["Sonoma", "Schellville"],
  },
  {
    slug: "bennett-valley",
    valley: "sonoma",
    cities: ["Santa Rosa", "Glen Ellen"],
  },
  {
    slug: "petaluma-gap",
    valley: "sonoma",
    cities: ["Petaluma", "Penngrove"],
  },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function guessValleyAndSubRegion(
  address: string,
  lat: number,
  lng: number
): { valley: "napa" | "sonoma"; subRegion: string | null } {
  const addrLower = address.toLowerCase();

  // Try city-based matching
  for (const sr of subRegionMappings) {
    for (const city of sr.cities) {
      if (addrLower.includes(city.toLowerCase())) {
        return { valley: sr.valley, subRegion: sr.slug };
      }
    }
  }

  // Fall back to longitude-based valley guess
  // Napa Valley is generally east of -122.5, Sonoma is west
  const valley = lng > -122.5 ? "napa" : "sonoma";
  return { valley, subRegion: null };
}

// ---- Google Places API (new) ----

interface PlacesTextSearchResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  photos?: Array<{ name: string }>;
  types?: string[];
}

async function searchPlaces(
  query: string,
  pageToken?: string
): Promise<PlacesTextSearchResponse> {
  const body: Record<string, unknown> = {
    textQuery: query,
    locationBias: {
      rectangle: {
        low: {
          latitude: config.googlePlaces.searchBounds.south,
          longitude: config.googlePlaces.searchBounds.west,
        },
        high: {
          latitude: config.googlePlaces.searchBounds.north,
          longitude: config.googlePlaces.searchBounds.east,
        },
      },
    },
    maxResultCount: 20,
  };

  if (pageToken) {
    body.pageToken = pageToken;
  }

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.websiteUri",
    "places.nationalPhoneNumber",
    "places.photos",
    "places.types",
    "nextPageToken",
  ].join(",");

  const resp = await fetch(PLACES_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Places API error ${resp.status}: ${text}`);
  }

  return resp.json();
}

function extractCity(address: string): string | null {
  // Address format: "1 California Dr, Yountville, CA 94599, USA"
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 3) {
    return parts[parts.length - 3]; // city is usually 3rd from end
  }
  return null;
}

async function buildWineryList() {
  console.log("Building ranked winery list from Google Places API...\n");

  const allPlaces = new Map<string, GooglePlace>();

  for (const query of config.googlePlaces.searchQueries) {
    console.log(`Searching: "${query}"`);

    try {
      let pageToken: string | undefined;
      let pageCount = 0;

      do {
        const result = await searchPlaces(query, pageToken);
        const places = result.places || [];

        for (const place of places) {
          if (!place.id) continue;

          // Filter: must be within bounding box
          if (place.location) {
            const { latitude, longitude } = place.location;
            const bounds = config.googlePlaces.searchBounds;
            if (
              latitude < bounds.south ||
              latitude > bounds.north ||
              longitude < bounds.west ||
              longitude > bounds.east
            ) {
              continue;
            }
          }

          // Deduplicate by Place ID
          if (!allPlaces.has(place.id)) {
            allPlaces.set(place.id, place);
          }
        }

        console.log(
          `  Page ${pageCount + 1}: ${places.length} results (${allPlaces.size} unique total)`
        );

        pageToken = result.nextPageToken;
        pageCount++;

        // Rate limit between pages
        if (pageToken) {
          await new Promise((r) => setTimeout(r, 500));
        }
      } while (pageToken && pageCount < 3); // Max 3 pages per query
    } catch (err) {
      console.error(`  Error searching "${query}":`, err);
    }

    // Small delay between queries
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nTotal unique places found: ${allPlaces.size}`);

  // Convert to WineryTarget and sort by review count
  const wineries: WineryTarget[] = [];

  for (const place of allPlaces.values()) {
    const name = place.displayName?.text || "Unknown";
    const address = place.formattedAddress || "";
    const lat = place.location?.latitude || 0;
    const lng = place.location?.longitude || 0;
    const { valley, subRegion } = guessValleyAndSubRegion(address, lat, lng);

    const photoRefs = (place.photos || [])
      .slice(0, config.googlePlaces.maxPhotosPerWinery)
      .map((p) => p.name);

    wineries.push({
      name,
      slug: slugify(name),
      websiteUrl: place.websiteUri || null,
      valley,
      subRegion,
      city: extractCity(address),
      address,
      lat,
      lng,
      phone: place.nationalPhoneNumber || null,
      googleRating: place.rating || null,
      googleReviewCount: place.userRatingCount || 0,
      googlePlaceId: place.id,
      googlePhotos: photoRefs,
      rank: 0, // will be set after sorting
    });
  }

  // Sort by review count descending (most popular first)
  wineries.sort((a, b) => b.googleReviewCount - a.googleReviewCount);

  // Take top N and assign ranks
  const topWineries = wineries.slice(
    0,
    config.googlePlaces.targetWineryCount
  );
  topWineries.forEach((w, i) => {
    w.rank = i + 1;
  });

  // Verify well-known wineries are included
  const wellKnown = [
    "opus one",
    "robert mondavi",
    "domaine chandon",
    "silver oak",
    "stag's leap",
    "beringer",
    "caymus",
    "far niente",
    "joseph phelps",
    "duckhorn",
    "kistler",
    "jordan",
    "flowers",
    "williams selyem",
  ];

  const included = new Set(topWineries.map((w) => w.name.toLowerCase()));
  const missing = wellKnown.filter(
    (name) => !Array.from(included).some((w) => w.includes(name))
  );

  if (missing.length > 0) {
    console.log(`\nWell-known wineries missing from top ${topWineries.length}:`);
    missing.forEach((m) => console.log(`  - ${m}`));
    console.log(
      "These may appear below the cutoff or use different names in Google."
    );
  }

  // Write output
  mkdirSync("src/scraper/data", { recursive: true });
  writeFileSync(
    config.paths.wineryTargets,
    JSON.stringify(topWineries, null, 2)
  );

  console.log(`\nWrote ${topWineries.length} wineries to ${config.paths.wineryTargets}`);
  console.log(`Top 10 by review count:`);
  topWineries.slice(0, 10).forEach((w) => {
    console.log(
      `  ${w.rank}. ${w.name} — ${w.googleReviewCount} reviews (${w.googleRating}★) [${w.valley}]`
    );
  });
}

buildWineryList().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
