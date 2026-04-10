/**
 * Apply audit corrections from audit-report.json to the database.
 * Reads the previously generated report — NO API calls, zero cost.
 *
 * Usage:
 *   npx tsx scripts/apply-audit.ts                  # local DB, dry run by default
 *   npx tsx scripts/apply-audit.ts --apply          # actually write to local DB
 *   npx tsx scripts/apply-audit.ts --apply --turso  # write to Turso production
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { accommodations } from "../src/db/schema/accommodations";
import { eq } from "drizzle-orm";

// --- CLI flags ---
const shouldApply = process.argv.includes("--apply");
const useTurso = process.argv.includes("--turso");

// --- Listings to skip (need manual review) ---
const SKIP_SLUGS = new Set([
  "robert-mondavi",      // CLOSED_PERMANENTLY — needs manual decision
  "vermeil-wines",       // CLOSED_TEMPORARILY — possible relocation
  "duckhorn-vineyards",  // CLOSED_TEMPORARILY — possible renovation
]);

// --- DB setup ---
let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  if (!shouldApply) {
    console.error("--turso requires --apply flag");
    process.exit(1);
  }
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    const { execSync } = require("child_process") as typeof import("child_process");
    dbAuthToken = execSync("turso db tokens create napa-winery-search", { encoding: "utf-8" }).trim();
  }
  console.log("Target: Turso production database\n");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Target: local database\n");
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

// --- Types (matching audit-report.json) ---
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

// --- Address parsing ---
function parseGoogleAddress(fullAddr: string): { street: string; city: string; state: string; zip: string } {
  // Format: "8815 Conn Creek Rd, Rutherford, CA 94573, USA"
  const cleaned = fullAddr.replace(/,?\s*USA$/i, "").trim();
  const parts = cleaned.split(",").map((p) => p.trim());

  if (parts.length >= 3) {
    const street = parts[0];
    const city = parts[1];
    const stateZip = parts[2].trim().split(/\s+/);
    const state = stateZip[0] || "CA";
    const zip = stateZip[1] || "";
    return { street, city, state, zip };
  }

  // Fallback
  return { street: parts[0] || "", city: parts[1] || "", state: "CA", zip: "" };
}

// --- Normalize city for cosmetic-only check ---
function normalizeCity(city: string): string {
  return city.toLowerCase().replace(/[.\s]/g, "");
}

// --- Main ---
async function main() {
  if (!shouldApply) {
    console.log("=== DRY RUN (add --apply to write changes) ===\n");
  }

  const report: AuditEntry[] = JSON.parse(readFileSync("audit-report.json", "utf-8"));
  console.log(`Loaded ${report.length} entries from audit-report.json\n`);

  let applied = 0;
  let skipped = 0;
  let skippedManual = 0;
  let noChanges = 0;

  for (const entry of report) {
    // Skip manually flagged listings
    if (SKIP_SLUGS.has(entry.slug)) {
      console.log(`⏭  ${entry.name} — SKIPPED (manual review required: ${entry.businessStatus})`);
      skippedManual++;
      continue;
    }

    // Skip entries with no changes
    if (entry.changes.length === 0) {
      noChanges++;
      continue;
    }

    const updates: Record<string, unknown> = {};
    const changeLog: string[] = [];

    for (const change of entry.changes) {
      switch (change.field) {
        case "address": {
          if (!entry.googleData.address) break;
          const parsed = parseGoogleAddress(entry.googleData.address);
          updates.address = parsed.street;
          updates.city = parsed.city;
          updates.zip = parsed.zip;
          changeLog.push(`address: "${change.current}" → "${parsed.street}"`);
          changeLog.push(`city: → "${parsed.city}", zip: → "${parsed.zip}"`);
          break;
        }
        case "city": {
          // Skip cosmetic-only city changes (St Helena vs St. Helena)
          const curNorm = normalizeCity(String(change.current || ""));
          const googleNorm = normalizeCity(String(change.google || ""));
          if (curNorm === googleNorm) {
            // Cosmetic — still update to Google's canonical form
            updates.city = change.google;
            changeLog.push(`city (cosmetic): "${change.current}" → "${change.google}"`);
          } else {
            // Real city mismatch — only apply if address also changed (otherwise skip for review)
            if (entry.changes.some((c) => c.field === "address")) {
              updates.city = change.google;
              changeLog.push(`city: "${change.current}" → "${change.google}"`);
            }
          }
          break;
        }
        case "zip": {
          updates.zip = change.google;
          changeLog.push(`zip: "${change.current}" → "${change.google}"`);
          break;
        }
        case "phone": {
          updates.phone = change.google;
          changeLog.push(`phone: "${change.current}" → "${change.google}"`);
          break;
        }
        case "hours": {
          if (entry.type === "winery") {
            updates.hoursJson = change.google;
            // Show a readable summary
            try {
              const hours = JSON.parse(change.google as string);
              const sample = Object.entries(hours).find(([, v]) => v !== "Closed");
              changeLog.push(`hours: updated (e.g. ${sample?.[0]}: ${sample?.[1]})`);
            } catch {
              changeLog.push(`hours: updated`);
            }
          }
          break;
        }
        case "website_url": {
          updates.websiteUrl = change.google;
          changeLog.push(`website: "${change.current}" → "${change.google}"`);
          break;
        }
        case "rating": {
          if (entry.type === "winery") {
            updates.aggregateRating = change.google;
            updates.googleRating = change.google;
          } else {
            updates.googleRating = change.google;
          }
          changeLog.push(`rating: ${change.current} → ${change.google}`);
          break;
        }
        case "review_count": {
          if (entry.type === "winery") {
            updates.totalRatings = change.google;
            updates.googleReviewCount = change.google;
          } else {
            updates.googleReviewCount = change.google;
          }
          changeLog.push(`reviews: ${change.current} → ${change.google}`);
          break;
        }
        case "lat": {
          updates.lat = change.google;
          changeLog.push(`lat: ${change.current} → ${change.google}`);
          break;
        }
        case "lng": {
          updates.lng = change.google;
          changeLog.push(`lng: ${change.current} → ${change.google}`);
          break;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    // Add updated_at timestamp
    updates.updatedAt = new Date().toISOString();

    console.log(`\n${entry.type === "winery" ? "🍷" : "🏨"} ${entry.name} (${entry.slug})`);
    for (const log of changeLog) {
      console.log(`   ${log}`);
    }

    if (shouldApply) {
      if (entry.type === "winery") {
        await db.update(wineries).set(updates).where(eq(wineries.id, entry.id));
      } else {
        await db.update(accommodations).set(updates).where(eq(accommodations.id, entry.id));
      }
      applied++;
    } else {
      applied++; // count for display
    }
  }

  console.log("\n========================================");
  console.log(shouldApply ? "        CHANGES APPLIED" : "     DRY RUN COMPLETE");
  console.log("========================================");
  console.log(`${shouldApply ? "Applied" : "Would apply"}: ${applied} listings`);
  console.log(`Skipped (no changes): ${noChanges}`);
  console.log(`Skipped (manual review): ${skippedManual}`);
  console.log(`Skipped (no applicable updates): ${skipped}`);

  if (!shouldApply) {
    console.log("\nRun with --apply to write changes to the database.");
    console.log("Run with --apply --turso to write to production.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
