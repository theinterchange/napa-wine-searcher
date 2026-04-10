/**
 * Apply accommodation amenity audit results + manual corrections.
 *
 * Usage:
 *   npx tsx scripts/apply-accommodation-amenities.ts                  # dry run
 *   npx tsx scripts/apply-accommodation-amenities.ts --apply          # local DB
 *   npx tsx scripts/apply-accommodation-amenities.ts --apply --turso  # Turso
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { accommodations } from "../src/db/schema/accommodations";
import { eq } from "drizzle-orm";

const shouldApply = process.argv.includes("--apply");
const useTurso = process.argv.includes("--turso");

let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  if (!shouldApply) { console.error("--turso requires --apply"); process.exit(1); }
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    const { execSync } = require("child_process") as typeof import("child_process");
    dbAuthToken = execSync("turso db tokens create napa-winery-search", { encoding: "utf-8" }).trim();
  }
  console.log("Target: Turso production\n");
} else {
  dbUrl = process.env.DATABASE_URL || "file:./data/winery.db";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  console.log("Target: local database\n");
}

const client = createClient({ url: dbUrl, authToken: dbAuthToken });
const db = drizzle(client);

interface AuditEntry {
  type: string; id: number; slug: string; name: string; siteReachable: boolean;
  flags: Record<string, { value: boolean; confidence: string; overall: string; quotes: { quote: string; sourceUrl: string }[] }>;
  currentDb: Record<string, boolean>;
}

interface ManualCorrection {
  slug: string;
  dogFriendly?: boolean; dogNote?: string;
  kidFriendly?: boolean; kidNote?: string;
  adultsOnly?: boolean;
  source?: string;
}

const audit: AuditEntry[] = JSON.parse(readFileSync("amenity-audit-v3-report.json", "utf-8"))
  .filter((e: AuditEntry) => e.type === "accommodation");
const manual: ManualCorrection[] = JSON.parse(readFileSync("amenity-manual-corrections-accommodations.json", "utf-8"));

const manualBySlug = new Map<string, ManualCorrection>();
for (const m of manual) manualBySlug.set(m.slug, m);

const accommodationWebsiteBySlug = new Map<string, string | null>();

async function main() {
  if (!shouldApply) console.log("=== DRY RUN ===\n");

  // Preload websiteUrl map so manual corrections without an explicit source can
  // fall back to the hotel's homepage and still render as a verifiable link.
  const accomRows = await db.select({ slug: accommodations.slug, websiteUrl: accommodations.websiteUrl }).from(accommodations);
  for (const r of accomRows) accommodationWebsiteBySlug.set(r.slug, r.websiteUrl);

  const manualSourceFor = (mc: ManualCorrection): string | null => {
    if (mc.source) return mc.source;
    return accommodationWebsiteBySlug.get(mc.slug) || null;
  };

  let applied = 0, manualApplied = 0, unchanged = 0;

  // Process audit entries
  for (const entry of audit) {
    const mc = manualBySlug.get(entry.slug);
    const updates: Record<string, unknown> = {};
    const changes: string[] = [];

    // Dog
    if (mc && mc.dogFriendly !== undefined) {
      updates.dogFriendly = mc.dogFriendly;
      updates.dogFriendlySource = manualSourceFor(mc);
      updates.dogFriendlyNote = mc.dogNote || null;
      if (mc.dogFriendly !== entry.currentDb.dogFriendly) changes.push(`dog: ${entry.currentDb.dogFriendly} → ${mc.dogFriendly} (manual)`);
    } else if (entry.siteReachable) {
      const f = entry.flags.dogFriendly;
      // hasEvidence gate: NO_INFO must persist as NULL, never as false.
      const hasEvidence = !!(f.quotes && f.quotes.length > 0);
      if (hasEvidence) {
        updates.dogFriendly = f.value;
        updates.dogFriendlySource = f.quotes[0]?.sourceUrl || null;
        updates.dogFriendlyNote = null;
        if (f.value !== entry.currentDb.dogFriendly) changes.push(`dog: ${entry.currentDb.dogFriendly} → ${f.value} (audit: ${f.overall})`);
      } else {
        updates.dogFriendly = null;
        updates.dogFriendlySource = null;
        updates.dogFriendlyNote = null;
        if (entry.currentDb.dogFriendly !== null && entry.currentDb.dogFriendly !== undefined) {
          changes.push(`dog: ${entry.currentDb.dogFriendly} → null (audit: NO_INFO)`);
        }
      }
    }

    // Kid / Adults-only
    if (mc && mc.kidFriendly !== undefined) {
      updates.kidFriendly = mc.kidFriendly;
      updates.kidFriendlySource = manualSourceFor(mc);
      updates.kidFriendlyNote = mc.kidNote || null;
      if (mc.adultsOnly !== undefined) updates.adultsOnly = mc.adultsOnly;
      else updates.adultsOnly = !mc.kidFriendly; // inverse
      if (mc.kidFriendly !== entry.currentDb.kidFriendly) changes.push(`kid: ${entry.currentDb.kidFriendly} → ${mc.kidFriendly} (manual)`);
      const currentAdultsOnly = !!(entry.currentDb as Record<string, boolean>).adultsOnly;
      if ((updates.adultsOnly as boolean) !== currentAdultsOnly) changes.push(`adultsOnly: ${currentAdultsOnly} → ${updates.adultsOnly} (manual)`);
    } else if (mc && mc.adultsOnly !== undefined) {
      updates.adultsOnly = mc.adultsOnly;
      updates.kidFriendly = !mc.adultsOnly;
      updates.kidFriendlySource = manualSourceFor(mc);
      changes.push(`adultsOnly: → ${mc.adultsOnly} (manual)`);
    } else if (entry.siteReachable) {
      const f = entry.flags.kidFriendly;
      const hasEvidence = !!(f.quotes && f.quotes.length > 0);
      if (hasEvidence) {
        updates.kidFriendly = f.value;
        updates.kidFriendlySource = f.quotes[0]?.sourceUrl || null;
        updates.kidFriendlyNote = null;
        // BLANKET_BAN with kid=false → explicit adults-only
        if (!f.value && f.overall === "BLANKET_BAN") {
          updates.adultsOnly = true;
        } else if (f.value) {
          updates.adultsOnly = false;
        }
        if (f.value !== entry.currentDb.kidFriendly) changes.push(`kid: ${entry.currentDb.kidFriendly} → ${f.value} (audit: ${f.overall})`);
      } else {
        // NO_INFO: don't claim either way. Both kidFriendly and adultsOnly become NULL.
        updates.kidFriendly = null;
        updates.kidFriendlySource = null;
        updates.kidFriendlyNote = null;
        updates.adultsOnly = null;
        if (entry.currentDb.kidFriendly !== null && entry.currentDb.kidFriendly !== undefined) {
          changes.push(`kid: ${entry.currentDb.kidFriendly} → null (audit: NO_INFO)`);
        }
      }
    }

    if (!entry.siteReachable && !mc) { unchanged++; continue; }

    updates.updatedAt = new Date().toISOString();

    if (changes.length === 0) { unchanged++; continue; }

    const source = mc ? "MANUAL" : "AUDIT";
    console.log(`🏨 ${entry.name} [${source}]`);
    for (const c of changes) console.log(`   ${c}`);

    if (shouldApply) {
      await db.update(accommodations).set(updates).where(eq(accommodations.id, entry.id));
    }
    if (mc) manualApplied++;
    applied++;
  }

  // Manual corrections not in audit
  for (const mc of manual) {
    if (audit.some(e => e.slug === mc.slug)) continue;

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    const changes: string[] = [];
    const fallbackSource = manualSourceFor(mc);

    if (mc.dogFriendly !== undefined) {
      updates.dogFriendly = mc.dogFriendly;
      updates.dogFriendlySource = fallbackSource;
      updates.dogFriendlyNote = mc.dogNote || null;
      changes.push(`dog: → ${mc.dogFriendly}`);
    }
    if (mc.kidFriendly !== undefined) {
      updates.kidFriendly = mc.kidFriendly;
      updates.kidFriendlySource = fallbackSource;
      updates.kidFriendlyNote = mc.kidNote || null;
      changes.push(`kid: → ${mc.kidFriendly}`);
    }
    if (mc.adultsOnly !== undefined) {
      updates.adultsOnly = mc.adultsOnly;
      if (!updates.kidFriendlySource) updates.kidFriendlySource = fallbackSource;
      changes.push(`adultsOnly: → ${mc.adultsOnly}`);
    }

    if (changes.length === 0) continue;

    console.log(`🏨 ${mc.slug} [MANUAL - not in audit]`);
    for (const c of changes) console.log(`   ${c}`);

    if (shouldApply) {
      await db.update(accommodations).set(updates).where(eq(accommodations.slug, mc.slug));
    }
    manualApplied++;
    applied++;
  }

  console.log("\n========================================");
  console.log(shouldApply ? "        CHANGES APPLIED" : "     DRY RUN COMPLETE");
  console.log("========================================");
  console.log(`Applied: ${applied} (${manualApplied} manual, ${applied - manualApplied} from audit)`);
  console.log(`Unchanged: ${unchanged}`);
}

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
