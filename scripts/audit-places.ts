/**
 * Comprehensive data accuracy audit using Google Places API (New).
 *
 * Fetches address, phone, website, hours, rating, review count, lat/lng,
 * and business status for ALL wineries (189) and accommodations (128).
 * Compares against our database and generates a mismatch report.
 *
 * One API call per listing — collects everything in a single pass.
 *
 * Usage:
 *   npx tsx scripts/audit-places.ts                    # full audit, local DB
 *   npx tsx scripts/audit-places.ts --turso            # audit against Turso
 *   npx tsx scripts/audit-places.ts --dry-run          # just count, no API calls
 *   npx tsx scripts/audit-places.ts --type=wineries    # wineries only
 *   npx tsx scripts/audit-places.ts --type=accommodations  # accommodations only
 *   npx tsx scripts/audit-places.ts --slug=frogs-leap  # single listing
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { writeFileSync } from "fs";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { accommodations } from "../src/db/schema/accommodations";
import { isNotNull, eq } from "drizzle-orm";

// --- CLI flags ---
const useTurso = process.argv.includes("--turso");
const dryRun = process.argv.includes("--dry-run");
const typeFilter = process.argv.find((a) => a.startsWith("--type="))?.split("=")[1];
const slugFilter = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];

// --- DB setup ---
let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    const { execSync } = require("child_process") as typeof import("child_process");
    dbAuthToken = execSync("turso db tokens create napa-winery-search", { encoding: "utf-8" }).trim();
  }
  console.log("Using Turso production database\n");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Using local database\n");
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY && !dryRun) {
  console.error("Missing GOOGLE_PLACES_API_KEY in .env.local");
  process.exit(1);
}

// --- Constants ---
const DELAY_MS = 150; // ~6.7 req/sec, well within quota
const FIELDS = [
  "displayName",
  "formattedAddress",
  "addressComponents",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
  "regularOpeningHours",
  "businessStatus",
  "rating",
  "userRatingCount",
  "location",
  "googleMapsUri",
].join(",");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Types ---
interface PlaceData {
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: { longText: string; shortText: string; types: string[] }[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    periods?: { open: { day: number; hour: number; minute: number }; close?: { day: number; hour: number; minute: number } }[];
    weekdayDescriptions?: string[];
  };
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
  googleMapsUri?: string;
}

interface Change {
  field: string;
  current: string | number | null;
  google: string | number | null;
  severity: "critical" | "high" | "medium" | "low";
}

interface AuditEntry {
  type: "winery" | "accommodation";
  id: number;
  slug: string;
  name: string;
  businessStatus: string;
  changes: Change[];
  googleData: {
    address?: string;
    phone?: string;
    website?: string;
    hours?: Record<string, string> | null;
    rating?: number;
    reviewCount?: number;
    lat?: number;
    lng?: number;
  };
}

// --- Google Places fetch ---
async function fetchPlaceData(placeId: string): Promise<PlaceData | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=${FIELDS}&key=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error(`  API error: ${res.status} ${res.statusText}`);
    return null;
  }

  return res.json();
}

// --- Hours parsing (reused from refresh-hours.ts) ---
const DAY_MAP: Record<number, string> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

function parseHoursToJson(hours: PlaceData["regularOpeningHours"]): Record<string, string> | null {
  if (!hours?.periods || hours.periods.length === 0) return null;

  const result: Record<string, string> = {
    mon: "Closed", tue: "Closed", wed: "Closed", thu: "Closed",
    fri: "Closed", sat: "Closed", sun: "Closed",
  };

  for (const period of hours.periods) {
    const dayKey = DAY_MAP[period.open.day];
    if (!dayKey || !period.close) continue;

    const openTime = `${String(period.open.hour).padStart(2, "0")}:${String(period.open.minute).padStart(2, "0")}`;
    const closeTime = `${String(period.close.hour).padStart(2, "0")}:${String(period.close.minute).padStart(2, "0")}`;
    result[dayKey] = `${openTime}-${closeTime}`;
  }

  // Validate: at least 2 days open
  const openDays = Object.values(result).filter((v) => v !== "Closed").length;
  if (openDays < 2) return null;

  // Reject 24-hour entries
  if (Object.values(result).some((v) => v.includes("24") || v === "00:00-00:00")) return null;

  return result;
}

// --- Normalization helpers ---
function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/[\s\-().+]/g, "").replace(/^1/, "");
}

function normalizeAddress(addr: string | null | undefined): string {
  if (!addr) return "";
  return addr
    .replace(/,?\s*(USA|United States|US)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

// --- Comparison logic ---
function compareWinery(
  w: { slug: string; name: string; address: string | null; city: string | null; zip: string | null; phone: string | null; websiteUrl: string | null; hoursJson: string | null; aggregateRating: number | null; totalRatings: number | null; googleRating: number | null; googleReviewCount: number | null; lat: number | null; lng: number | null },
  google: PlaceData
): Change[] {
  const changes: Change[] = [];

  // Address
  const googleAddr = normalizeAddress(google.formattedAddress);
  const ourAddr = normalizeAddress([w.address, w.city, w.zip ? `CA ${w.zip}` : "CA"].filter(Boolean).join(", "));
  // Check if the street address portion differs (most important part)
  const googleStreet = google.addressComponents?.find((c) => c.types?.includes("street_number"))?.longText;
  const googleRoute = google.addressComponents?.find((c) => c.types?.includes("route"))?.longText;
  const googleFullStreet = googleStreet && googleRoute ? `${googleStreet} ${googleRoute}` : null;
  if (googleFullStreet && w.address && !normalizeAddress(w.address).includes(googleStreet || "___")) {
    changes.push({ field: "address", current: w.address, google: google.formattedAddress || null, severity: "critical" });
  }

  // City
  const googleCity = google.addressComponents?.find((c) => c.types?.includes("locality"))?.longText;
  if (googleCity && w.city && googleCity.toLowerCase() !== w.city.toLowerCase()) {
    changes.push({ field: "city", current: w.city, google: googleCity, severity: "critical" });
  }

  // ZIP
  const googleZip = google.addressComponents?.find((c) => c.types?.includes("postal_code"))?.shortText;
  if (googleZip && w.zip && googleZip !== w.zip) {
    changes.push({ field: "zip", current: w.zip, google: googleZip, severity: "medium" });
  }

  // Phone
  const googlePhone = normalizePhone(google.nationalPhoneNumber);
  const ourPhone = normalizePhone(w.phone);
  if (googlePhone && ourPhone && googlePhone !== ourPhone) {
    changes.push({ field: "phone", current: w.phone, google: google.nationalPhoneNumber || null, severity: "high" });
  }

  // Website
  const googleUrl = normalizeUrl(google.websiteUri);
  const ourUrl = normalizeUrl(w.websiteUrl);
  if (googleUrl && ourUrl && googleUrl !== ourUrl) {
    // Check if they share a domain (redirects are common)
    const googleDomain = googleUrl.split("/")[0];
    const ourDomain = ourUrl.split("/")[0];
    if (googleDomain !== ourDomain) {
      changes.push({ field: "website_url", current: w.websiteUrl, google: google.websiteUri || null, severity: "high" });
    }
  }

  // Hours
  const googleHours = parseHoursToJson(google.regularOpeningHours);
  if (googleHours && w.hoursJson) {
    try {
      const ourHours = JSON.parse(w.hoursJson);
      const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const hoursDiff = days.filter((d) => (ourHours[d] || "Closed") !== (googleHours[d] || "Closed"));
      if (hoursDiff.length > 0) {
        changes.push({
          field: "hours",
          current: w.hoursJson,
          google: JSON.stringify(googleHours),
          severity: "high",
        });
      }
    } catch {
      changes.push({ field: "hours", current: w.hoursJson, google: JSON.stringify(googleHours), severity: "high" });
    }
  } else if (googleHours && !w.hoursJson) {
    changes.push({ field: "hours", current: null, google: JSON.stringify(googleHours), severity: "high" });
  }

  // Rating
  if (google.rating != null) {
    const ourRating = w.aggregateRating ?? w.googleRating;
    if (ourRating != null && Math.abs(ourRating - google.rating) >= 0.1) {
      changes.push({ field: "rating", current: ourRating, google: google.rating, severity: "low" });
    }
  }

  // Review count
  if (google.userRatingCount != null) {
    const ourCount = w.totalRatings ?? w.googleReviewCount;
    if (ourCount != null && Math.abs(ourCount - google.userRatingCount) > 5) {
      changes.push({ field: "review_count", current: ourCount, google: google.userRatingCount, severity: "low" });
    }
  }

  // Lat/Lng (only flag if >0.001 degree off, ~100m)
  if (google.location) {
    if (w.lat != null && Math.abs(w.lat - google.location.latitude) > 0.001) {
      changes.push({ field: "lat", current: w.lat, google: google.location.latitude, severity: "medium" });
    }
    if (w.lng != null && Math.abs(w.lng - google.location.longitude) > 0.001) {
      changes.push({ field: "lng", current: w.lng, google: google.location.longitude, severity: "medium" });
    }
  }

  return changes;
}

function compareAccommodation(
  a: { slug: string; name: string; address: string | null; city: string | null; phone: string | null; websiteUrl: string | null; googleRating: number | null; googleReviewCount: number | null; lat: number | null; lng: number | null },
  google: PlaceData
): Change[] {
  const changes: Change[] = [];

  // Address — accommodations store full address in one field
  const googleStreet = google.addressComponents?.find((c) => c.types?.includes("street_number"))?.longText;
  const googleRoute = google.addressComponents?.find((c) => c.types?.includes("route"))?.longText;
  if (googleStreet && a.address && !a.address.includes(googleStreet)) {
    changes.push({ field: "address", current: a.address, google: google.formattedAddress || null, severity: "critical" });
  }

  // City
  const googleCity = google.addressComponents?.find((c) => c.types?.includes("locality"))?.longText;
  if (googleCity && a.city && googleCity.toLowerCase() !== a.city.toLowerCase()) {
    changes.push({ field: "city", current: a.city, google: googleCity, severity: "critical" });
  }

  // Phone
  const googlePhone = normalizePhone(google.nationalPhoneNumber);
  const ourPhone = normalizePhone(a.phone);
  if (googlePhone && ourPhone && googlePhone !== ourPhone) {
    changes.push({ field: "phone", current: a.phone, google: google.nationalPhoneNumber || null, severity: "high" });
  }

  // Website
  const googleUrl = normalizeUrl(google.websiteUri);
  const ourUrl = normalizeUrl(a.websiteUrl);
  if (googleUrl && ourUrl) {
    const googleDomain = googleUrl.split("/")[0];
    const ourDomain = ourUrl.split("/")[0];
    if (googleDomain !== ourDomain) {
      changes.push({ field: "website_url", current: a.websiteUrl, google: google.websiteUri || null, severity: "high" });
    }
  }

  // Rating
  if (google.rating != null && a.googleRating != null && Math.abs(a.googleRating - google.rating) >= 0.1) {
    changes.push({ field: "rating", current: a.googleRating, google: google.rating, severity: "low" });
  }

  // Review count
  if (google.userRatingCount != null && a.googleReviewCount != null && Math.abs(a.googleReviewCount - google.userRatingCount) > 5) {
    changes.push({ field: "review_count", current: a.googleReviewCount, google: google.userRatingCount, severity: "low" });
  }

  // Lat/Lng
  if (google.location) {
    if (a.lat != null && Math.abs(a.lat - google.location.latitude) > 0.001) {
      changes.push({ field: "lat", current: a.lat, google: google.location.latitude, severity: "medium" });
    }
    if (a.lng != null && Math.abs(a.lng - google.location.longitude) > 0.001) {
      changes.push({ field: "lng", current: a.lng, google: google.location.longitude, severity: "medium" });
    }
  }

  return changes;
}

// --- Report generation ---
function generateMarkdownReport(entries: AuditEntry[]): string {
  const lines: string[] = [];
  const now = new Date().toISOString().split("T")[0];

  const totalChanges = entries.reduce((s, e) => s + e.changes.length, 0);
  const withChanges = entries.filter((e) => e.changes.length > 0);
  const closedBusinesses = entries.filter((e) => e.businessStatus !== "OPERATIONAL");
  const criticalChanges = entries.filter((e) => e.changes.some((c) => c.severity === "critical"));
  const highChanges = entries.filter((e) => e.changes.some((c) => c.severity === "high"));

  lines.push(`# Data Accuracy Audit Report — ${now}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- **Total listings audited:** ${entries.length}`);
  lines.push(`  - Wineries: ${entries.filter((e) => e.type === "winery").length}`);
  lines.push(`  - Accommodations: ${entries.filter((e) => e.type === "accommodation").length}`);
  lines.push(`- **Listings with mismatches:** ${withChanges.length}`);
  lines.push(`- **Total field mismatches:** ${totalChanges}`);
  lines.push(`- **Critical (wrong address/city):** ${criticalChanges.length}`);
  lines.push(`- **High (wrong phone/website/hours):** ${highChanges.length}`);
  lines.push(`- **Possibly closed businesses:** ${closedBusinesses.length}`);
  lines.push("");

  // Closed businesses first
  if (closedBusinesses.length > 0) {
    lines.push("## Possibly Closed Businesses");
    lines.push("These listings have a non-OPERATIONAL status on Google. **Verify manually before removing.**");
    lines.push("");
    for (const e of closedBusinesses) {
      lines.push(`- **${e.name}** (${e.type}, /${e.slug}) — status: \`${e.businessStatus}\``);
    }
    lines.push("");
  }

  // Critical changes
  if (criticalChanges.length > 0) {
    lines.push("## Critical: Wrong Address or City");
    lines.push("Users could drive to the wrong location. Fix immediately.");
    lines.push("");
    for (const e of criticalChanges) {
      const critical = e.changes.filter((c) => c.severity === "critical");
      lines.push(`### ${e.name} (${e.type})`);
      for (const c of critical) {
        lines.push(`- **${c.field}**: \`${c.current}\` → \`${c.google}\``);
      }
      lines.push("");
    }
  }

  // High severity
  const highOnly = entries.filter((e) => e.changes.some((c) => c.severity === "high") && !e.changes.some((c) => c.severity === "critical"));
  if (highOnly.length > 0 || highChanges.length > 0) {
    lines.push("## High: Wrong Phone, Website, or Hours");
    lines.push("");
    const allHigh = entries.filter((e) => e.changes.some((c) => c.severity === "high"));
    for (const e of allHigh) {
      const high = e.changes.filter((c) => c.severity === "high");
      lines.push(`### ${e.name} (${e.type})`);
      for (const c of high) {
        if (c.field === "hours") {
          lines.push(`- **hours**:`);
          lines.push(`  - Current: \`${c.current}\``);
          lines.push(`  - Google:  \`${c.google}\``);
        } else {
          lines.push(`- **${c.field}**: \`${c.current}\` → \`${c.google}\``);
        }
      }
      lines.push("");
    }
  }

  // Medium severity
  const mediumEntries = entries.filter((e) => e.changes.some((c) => c.severity === "medium"));
  if (mediumEntries.length > 0) {
    lines.push("## Medium: ZIP Code or Coordinates Off");
    lines.push("");
    for (const e of mediumEntries) {
      const medium = e.changes.filter((c) => c.severity === "medium");
      lines.push(`- **${e.name}**: ${medium.map((c) => `${c.field}: \`${c.current}\` → \`${c.google}\``).join(", ")}`);
    }
    lines.push("");
  }

  // Low severity (ratings/reviews) — summary only
  const lowEntries = entries.filter((e) => e.changes.some((c) => c.severity === "low"));
  if (lowEntries.length > 0) {
    lines.push("## Low: Rating or Review Count Changed");
    lines.push(`${lowEntries.length} listings have updated ratings or review counts. These will be auto-applied.`);
    lines.push("");
  }

  // Unchanged
  const unchanged = entries.filter((e) => e.changes.length === 0 && e.businessStatus === "OPERATIONAL");
  lines.push(`## Verified Correct: ${unchanged.length} listings`);
  lines.push("No mismatches found for these listings — data matches Google.");
  lines.push("");

  return lines.join("\n");
}

// --- Main ---
async function main() {
  console.log(`Flags: ${dryRun ? "--dry-run " : ""}${typeFilter ? `--type=${typeFilter} ` : ""}${slugFilter ? `--slug=${slugFilter}` : ""}`);
  console.log(`Fields requested: ${FIELDS}\n`);

  const allEntries: AuditEntry[] = [];
  let apiCalls = 0;

  // --- WINERIES ---
  if (!typeFilter || typeFilter === "wineries") {
    let allWineries = await db
      .select({
        id: wineries.id,
        slug: wineries.slug,
        name: wineries.name,
        address: wineries.address,
        city: wineries.city,
        zip: wineries.zip,
        phone: wineries.phone,
        websiteUrl: wineries.websiteUrl,
        hoursJson: wineries.hoursJson,
        aggregateRating: wineries.aggregateRating,
        totalRatings: wineries.totalRatings,
        googleRating: wineries.googleRating,
        googleReviewCount: wineries.googleReviewCount,
        googlePlaceId: wineries.googlePlaceId,
        lat: wineries.lat,
        lng: wineries.lng,
      })
      .from(wineries)
      .where(isNotNull(wineries.googlePlaceId));

    if (slugFilter) {
      allWineries = allWineries.filter((w) => w.slug === slugFilter);
    }

    console.log(`=== Wineries: ${allWineries.length} ===\n`);

    for (let i = 0; i < allWineries.length; i++) {
      const w = allWineries[i];
      const progress = `[${i + 1}/${allWineries.length}]`;
      process.stdout.write(`${progress} ${w.name}...`);

      if (dryRun) {
        console.log(" (dry run)");
        continue;
      }

      const data = await fetchPlaceData(w.googlePlaceId!);
      apiCalls++;

      if (!data) {
        console.log(" API FAILED");
        await sleep(DELAY_MS);
        continue;
      }

      const changes = compareWinery(w, data);
      const status = data.businessStatus || "UNKNOWN";
      const googleHours = parseHoursToJson(data.regularOpeningHours);

      allEntries.push({
        type: "winery",
        id: w.id,
        slug: w.slug,
        name: w.name,
        businessStatus: status,
        changes,
        googleData: {
          address: data.formattedAddress || undefined,
          phone: data.nationalPhoneNumber || undefined,
          website: data.websiteUri || undefined,
          hours: googleHours,
          rating: data.rating,
          reviewCount: data.userRatingCount,
          lat: data.location?.latitude,
          lng: data.location?.longitude,
        },
      });

      const changeCount = changes.length;
      const statusNote = status !== "OPERATIONAL" ? ` [${status}]` : "";
      console.log(changeCount > 0
        ? ` ${changeCount} change(s)${statusNote}`
        : ` OK${statusNote}`
      );

      await sleep(DELAY_MS);
    }
  }

  // --- ACCOMMODATIONS ---
  if (!typeFilter || typeFilter === "accommodations") {
    let allAccomm = await db
      .select({
        id: accommodations.id,
        slug: accommodations.slug,
        name: accommodations.name,
        address: accommodations.address,
        city: accommodations.city,
        phone: accommodations.phone,
        websiteUrl: accommodations.websiteUrl,
        googleRating: accommodations.googleRating,
        googleReviewCount: accommodations.googleReviewCount,
        googlePlaceId: accommodations.googlePlaceId,
        lat: accommodations.lat,
        lng: accommodations.lng,
      })
      .from(accommodations)
      .where(isNotNull(accommodations.googlePlaceId));

    if (slugFilter) {
      allAccomm = allAccomm.filter((a) => a.slug === slugFilter);
    }

    console.log(`\n=== Accommodations: ${allAccomm.length} ===\n`);

    for (let i = 0; i < allAccomm.length; i++) {
      const a = allAccomm[i];
      const progress = `[${i + 1}/${allAccomm.length}]`;
      process.stdout.write(`${progress} ${a.name}...`);

      if (dryRun) {
        console.log(" (dry run)");
        continue;
      }

      const data = await fetchPlaceData(a.googlePlaceId!);
      apiCalls++;

      if (!data) {
        console.log(" API FAILED");
        await sleep(DELAY_MS);
        continue;
      }

      const changes = compareAccommodation(a, data);
      const status = data.businessStatus || "UNKNOWN";

      allEntries.push({
        type: "accommodation",
        id: a.id,
        slug: a.slug,
        name: a.name,
        businessStatus: status,
        changes,
        googleData: {
          address: data.formattedAddress || undefined,
          phone: data.nationalPhoneNumber || undefined,
          website: data.websiteUri || undefined,
          rating: data.rating,
          reviewCount: data.userRatingCount,
          lat: data.location?.latitude,
          lng: data.location?.longitude,
        },
      });

      const changeCount = changes.length;
      const statusNote = status !== "OPERATIONAL" ? ` [${status}]` : "";
      console.log(changeCount > 0
        ? ` ${changeCount} change(s)${statusNote}`
        : ` OK${statusNote}`
      );

      await sleep(DELAY_MS);
    }
  }

  if (dryRun) {
    console.log("\nDry run complete. No API calls made.");
    return;
  }

  // --- Write reports ---
  writeFileSync("audit-report.json", JSON.stringify(allEntries, null, 2));
  writeFileSync("audit-report.md", generateMarkdownReport(allEntries));

  // --- Summary ---
  const withChanges = allEntries.filter((e) => e.changes.length > 0);
  const critical = allEntries.filter((e) => e.changes.some((c) => c.severity === "critical"));
  const high = allEntries.filter((e) => e.changes.some((c) => c.severity === "high"));
  const closed = allEntries.filter((e) => e.businessStatus !== "OPERATIONAL");

  console.log("\n========================================");
  console.log("           AUDIT COMPLETE");
  console.log("========================================");
  console.log(`API calls made: ${apiCalls}`);
  console.log(`Total listings: ${allEntries.length}`);
  console.log(`With mismatches: ${withChanges.length}`);
  console.log(`  Critical (address/city): ${critical.length}`);
  console.log(`  High (phone/website/hours): ${high.length}`);
  console.log(`  Possibly closed: ${closed.length}`);
  console.log(`Verified correct: ${allEntries.length - withChanges.length}`);
  console.log(`\nReports written:`);
  console.log(`  audit-report.json (machine-readable)`);
  console.log(`  audit-report.md   (human-readable)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
