/**
 * Apply amenity audit v3 results + manual corrections to the database.
 *
 * Priority: manual corrections > audit results > existing DB
 *
 * Usage:
 *   npx tsx scripts/apply-amenity-v3.ts                  # dry run
 *   npx tsx scripts/apply-amenity-v3.ts --apply          # write to local DB
 *   npx tsx scripts/apply-amenity-v3.ts --apply --turso  # write to Turso
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
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

// --- Load data ---
interface AuditEntry {
  type: "winery" | "accommodation";
  id: number;
  slug: string;
  name: string;
  siteReachable: boolean;
  flags: Record<string, { value: boolean; confidence: string; overall: string; quotes: { quote: string; sourceUrl: string }[] }>;
  currentDb: Record<string, boolean>;
}

interface ManualCorrection {
  slug: string;
  dogFriendly?: boolean;
  dogNote?: string;
  kidFriendly?: boolean;
  kidNote?: string;
  picnicFriendly?: boolean;
  sustainable?: boolean;
  sustainableNote?: string;
  source?: string;
}

const audit: AuditEntry[] = JSON.parse(readFileSync("amenity-audit-v3-report.json", "utf-8"));
const manual: ManualCorrection[] = JSON.parse(readFileSync("amenity-manual-corrections.json", "utf-8"));

// Index manual corrections by slug
const manualBySlug = new Map<string, ManualCorrection>();
for (const m of manual) manualBySlug.set(m.slug, m);

// Preload websiteUrl maps so manual corrections without an explicit source can
// fall back to linking the entity's own homepage. Without this, manual no's
// (e.g., Hamel "No Pets") render as plain text instead of a verifiable link.
const wineryWebsiteBySlug = new Map<string, string | null>();
const accommodationWebsiteBySlug = new Map<string, string | null>();

// --- Main ---
async function main() {
  if (!shouldApply) console.log("=== DRY RUN (add --apply to write) ===\n");

  // Preload websiteUrl maps for manual-source fallback
  const wineryRows = await db.select({ slug: wineries.slug, websiteUrl: wineries.websiteUrl }).from(wineries);
  for (const r of wineryRows) wineryWebsiteBySlug.set(r.slug, r.websiteUrl);
  const accomRows = await db.select({ slug: accommodations.slug, websiteUrl: accommodations.websiteUrl }).from(accommodations);
  for (const r of accomRows) accommodationWebsiteBySlug.set(r.slug, r.websiteUrl);

  // Helper: when a manual correction has no explicit source, fall back to the
  // entity's own website URL so the rendered label is still wrapped in a link.
  const manualSourceFor = (mc: ManualCorrection, isWinery: boolean): string | null => {
    if (mc.source) return mc.source;
    return (isWinery ? wineryWebsiteBySlug.get(mc.slug) : accommodationWebsiteBySlug.get(mc.slug)) || null;
  };

  let applied = 0;
  let manualApplied = 0;
  let unchanged = 0;
  let unreachable = 0;

  for (const entry of audit) {
    // Accommodations are owned exclusively by apply-accommodation-amenities.ts
    // (which loads amenity-manual-corrections-accommodations.json). If this
    // script processes them via its audit branch, it writes NULL for reachable
    // hotels with no quotes, clobbering manual data set by the other script.
    if (entry.type !== "winery") continue;

    const mc = manualBySlug.get(entry.slug);
    const isWinery = entry.type === "winery";

    // Build update object
    const updates: Record<string, unknown> = {};
    const changes: string[] = [];

    // --- DOG FRIENDLY ---
    if (mc && mc.dogFriendly !== undefined) {
      // Manual correction takes priority
      updates.dogFriendly = mc.dogFriendly;
      if (isWinery) {
        updates.dogFriendlySource = manualSourceFor(mc, true);
        updates.dogFriendlyNote = mc.dogNote || null;
      } else {
        updates.dogFriendlySource = manualSourceFor(mc, false);
        updates.dogFriendlyNote = mc.dogNote || null;
      }
      if (mc.dogFriendly !== entry.currentDb.dogFriendly) {
        changes.push(`dog: ${entry.currentDb.dogFriendly} → ${mc.dogFriendly} (manual)`);
      }
    } else if (entry.siteReachable) {
      const flag = entry.flags.dogFriendly;
      // hasEvidence gate: only persist a verdict when the audit found at least
      // one supporting quote. Otherwise this is a "no info" row and must be
      // stored as NULL — never as false. Storing false here was the root cause
      // of the "Confirm pet policy" bug across ~90 wineries / 14 hotels.
      const hasEvidence = !!(flag.quotes && flag.quotes.length > 0);
      if (hasEvidence) {
        updates.dogFriendly = flag.value;
        updates.dogFriendlySource = flag.quotes[0]?.sourceUrl || null;
        updates.dogFriendlyNote = null;
        if (flag.value !== entry.currentDb.dogFriendly) {
          changes.push(`dog: ${entry.currentDb.dogFriendly} → ${flag.value} (audit: ${flag.overall})`);
        }
      } else {
        updates.dogFriendly = null;
        updates.dogFriendlySource = null;
        updates.dogFriendlyNote = null;
        if (entry.currentDb.dogFriendly !== null && entry.currentDb.dogFriendly !== undefined) {
          changes.push(`dog: ${entry.currentDb.dogFriendly} → null (audit: NO_INFO)`);
        }
      }
    }
    // unreachable → don't change dog

    // --- KID FRIENDLY ---
    if (mc && mc.kidFriendly !== undefined) {
      updates.kidFriendly = mc.kidFriendly;
      if (isWinery) {
        updates.kidFriendlySource = manualSourceFor(mc, true);
        updates.kidFriendlyNote = mc.kidNote || null;
        updates.kidFriendlyConfidence = "high";
      } else {
        updates.kidFriendlySource = manualSourceFor(mc, false);
        updates.kidFriendlyNote = mc.kidNote || null;
      }
      if (mc.kidFriendly !== entry.currentDb.kidFriendly) {
        changes.push(`kid: ${entry.currentDb.kidFriendly} → ${mc.kidFriendly} (manual)`);
      }
    } else if (entry.siteReachable) {
      const flag = entry.flags.kidFriendly;
      const hasEvidence = !!(flag.quotes && flag.quotes.length > 0);
      if (hasEvidence) {
        updates.kidFriendly = flag.value;
        if (isWinery) {
          updates.kidFriendlySource = flag.quotes[0]?.sourceUrl || null;
          updates.kidFriendlyNote = null;
          updates.kidFriendlyConfidence = flag.confidence;
        } else {
          updates.kidFriendlySource = flag.quotes[0]?.sourceUrl || null;
          updates.kidFriendlyNote = null;
        }
        if (flag.value !== entry.currentDb.kidFriendly) {
          changes.push(`kid: ${entry.currentDb.kidFriendly} → ${flag.value} (audit: ${flag.overall})`);
        }
      } else {
        updates.kidFriendly = null;
        updates.kidFriendlySource = null;
        updates.kidFriendlyNote = null;
        if (isWinery) updates.kidFriendlyConfidence = null;
        if (entry.currentDb.kidFriendly !== null && entry.currentDb.kidFriendly !== undefined) {
          changes.push(`kid: ${entry.currentDb.kidFriendly} → null (audit: NO_INFO)`);
        }
      }
    }

    // --- PICNIC FRIENDLY (wineries only) ---
    if (isWinery) {
      if (mc && mc.picnicFriendly !== undefined) {
        updates.picnicFriendly = mc.picnicFriendly;
        if (mc.picnicFriendly !== entry.currentDb.picnicFriendly) {
          changes.push(`picnic: ${entry.currentDb.picnicFriendly} → ${mc.picnicFriendly} (manual)`);
        }
      } else if (entry.siteReachable) {
        const flag = entry.flags.picnicFriendly;
        let picnicValue = flag.value;
        // FOOD_SERVICE only counts as picnic-friendly if quotes literally mention "picnic"
        if (flag.overall === "FOOD_SERVICE") {
          const mentionsPicnic = flag.quotes.some((q: { quote: string }) => q.quote.toLowerCase().includes("picnic"));
          picnicValue = mentionsPicnic;
        }
        updates.picnicFriendly = picnicValue;
        if (picnicValue !== entry.currentDb.picnicFriendly) {
          changes.push(`picnic: ${entry.currentDb.picnicFriendly} → ${picnicValue} (audit: ${flag.overall})`);
        }
      }
    }

    // --- SUSTAINABLE (wineries only) ---
    if (isWinery) {
      if (mc && mc.sustainable !== undefined) {
        updates.sustainableFarming = mc.sustainable;
        if (mc.sustainableNote) updates.sustainableNote = mc.sustainableNote;
        if (mc.source) updates.sustainableSource = mc.source;
      } else if (entry.siteReachable) {
        const flag = entry.flags.sustainable;
        updates.sustainableFarming = flag.value;
        if (flag.value) {
          updates.sustainableSource = flag.quotes[0]?.sourceUrl || null;
          // Build note from classification
          const overall = flag.overall;
          if (overall === "CERTIFIED") {
            // Extract cert names from quotes
            const certQuotes = flag.quotes.map(q => q.quote).join(" ").toLowerCase();
            const certs: string[] = [];
            if (certQuotes.includes("napa green")) certs.push("Napa Green Certified");
            if (certQuotes.includes("ccof") || certQuotes.includes("certified organic")) certs.push("Certified Organic");
            if (certQuotes.includes("leed")) certs.push("LEED Certified");
            if (certQuotes.includes("fish friendly")) certs.push("Fish Friendly Farming");
            if (certQuotes.includes("biodynamic")) certs.push("Biodynamic");
            if (certs.length > 0) updates.sustainableNote = certs.join(", ");
          } else if (overall === "PRACTICING") {
            const practiceQuotes = flag.quotes.map(q => q.quote).join(" ").toLowerCase();
            const practices: string[] = [];
            if (practiceQuotes.includes("organic")) practices.push("Organic Farming");
            if (practiceQuotes.includes("biodynamic")) practices.push("Biodynamic");
            if (practiceQuotes.includes("dry farm")) practices.push("Dry Farming");
            if (practiceQuotes.includes("regenerative")) practices.push("Regenerative Agriculture");
            if (practiceQuotes.includes("solar")) practices.push("Solar Power");
            if (practices.length > 0) updates.sustainableNote = practices.join(", ");
          }
        } else {
          updates.sustainableNote = null;
          updates.sustainableSource = null;
        }
        if (flag.value !== entry.currentDb.sustainable) {
          changes.push(`sustainable: ${entry.currentDb.sustainable} → ${flag.value} (audit: ${flag.overall})`);
        }
      }
    }

    if (!entry.siteReachable && !mc) {
      unreachable++;
      continue;
    }

    updates.updatedAt = new Date().toISOString();

    // Skip only AUDIT-driven entries when there are no changes.
    // Manual entries must always be applied — the audit's currentDb snapshot
    // may be stale (e.g. after migration wiped fields to NULL), so a manual
    // value that matches the stale snapshot still needs to be persisted.
    if (changes.length === 0 && !mc) {
      unchanged++;
      continue;
    }

    const source = mc ? "MANUAL" : "AUDIT";
    console.log(`${isWinery ? "🍷" : "🏨"} ${entry.name} [${source}]`);
    for (const c of changes) console.log(`   ${c}`);

    if (shouldApply) {
      // Match on slug — local and Turso have different numeric IDs, so id-based
      // WHERE clauses silently miss on Turso. Slug is unique + stable.
      if (isWinery) {
        await db.update(wineries).set(updates).where(eq(wineries.slug, entry.slug));
      } else {
        await db.update(accommodations).set(updates).where(eq(accommodations.slug, entry.slug));
      }
    }

    if (mc) manualApplied++;
    applied++;
  }

  // Apply manual corrections for entries NOT in the audit (e.g., unreachable sites
  // or — currently — every winery, since amenity-audit-v3-report.json holds only
  // accommodations).
  for (const mc of manual) {
    if (audit.some(e => e.slug === mc.slug)) continue; // already handled above

    // Manual corrections without an explicit source URL fall back to the
    // entity's own website so the rendered label can still be wrapped in a link.
    const fallbackSource = manualSourceFor(mc, true);

    console.log(`🍷 ${mc.slug} [MANUAL - not in audit]`);
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (mc.dogFriendly !== undefined) {
      updates.dogFriendly = mc.dogFriendly;
      updates.dogFriendlySource = fallbackSource;
      updates.dogFriendlyNote = mc.dogNote || null;
      console.log(`   dog: → ${mc.dogFriendly} (source: ${fallbackSource ? "set" : "none"})`);
    }
    if (mc.kidFriendly !== undefined) {
      updates.kidFriendly = mc.kidFriendly;
      updates.kidFriendlySource = fallbackSource;
      updates.kidFriendlyNote = mc.kidNote || null;
      updates.kidFriendlyConfidence = "high";
      console.log(`   kid: → ${mc.kidFriendly} (source: ${fallbackSource ? "set" : "none"})`);
    }
    if (mc.picnicFriendly !== undefined) {
      updates.picnicFriendly = mc.picnicFriendly;
      console.log(`   picnic: → ${mc.picnicFriendly}`);
    }
    if (mc.sustainable !== undefined) {
      updates.sustainableFarming = mc.sustainable;
      if (mc.sustainableNote) updates.sustainableNote = mc.sustainableNote;
      if (mc.source) updates.sustainableSource = mc.source;
      console.log(`   sustainable: → ${mc.sustainable}`);
    }

    if (shouldApply) {
      await db.update(wineries).set(updates).where(eq(wineries.slug, mc.slug));
    }
    manualApplied++;
    applied++;
  }

  console.log("\n========================================");
  console.log(shouldApply ? "        CHANGES APPLIED" : "     DRY RUN COMPLETE");
  console.log("========================================");
  console.log(`Applied: ${applied} (${manualApplied} manual, ${applied - manualApplied} from audit)`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Unreachable (no changes): ${unreachable}`);
}

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
