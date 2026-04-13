/**
 * Apply v3 audit updates to wineries, with source attribution.
 *
 * Decision rules:
 * 1. Skip if a manual correction exists for the amenity (user's curated data wins)
 * 2. Skip if v3 confidence is "low" AND production already has a value
 * 3. For each update, write value + source URL (property-wide quote preferred)
 * 4. Source URL refresh: if prod value matches v3 value, update the *_source
 *    column when v3 has a property-wide quote
 *
 * Usage:
 *   npx tsx scripts/apply-v3-winery-updates.ts                 # dry run
 *   npx tsx scripts/apply-v3-winery-updates.ts --apply         # local write
 *   npx tsx scripts/apply-v3-winery-updates.ts --apply --turso # production
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { wineries } from "../src/db/schema";
import { eq } from "drizzle-orm";

const shouldApply = process.argv.includes("--apply");
const useTurso = process.argv.includes("--turso");

let dbUrl: string;
let dbAuthToken: string | undefined;

if (useTurso) {
  if (!shouldApply) {
    console.error("--turso requires --apply");
    process.exit(1);
  }
  dbUrl = "libsql://napa-winery-search-theinterchange.aws-us-west-2.turso.io";
  dbAuthToken = process.env.DATABASE_AUTH_TOKEN?.replace(/\s/g, "");
  if (!dbAuthToken) {
    const { execSync } = require("child_process");
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

// --- Types ---
interface Quote {
  quote: string;
  sourceUrl: string;
  scope?: "property-wide" | "experience-specific" | "event-specific";
}
interface FlagResult {
  value: boolean;
  confidence: "high" | "medium" | "low";
  overall?: string;
  reasoning?: string;
  quotes?: Quote[];
}
interface AuditEntry {
  type: "winery" | "accommodation";
  slug: string;
  name: string;
  siteReachable: boolean;
  flags: {
    dogFriendly: FlagResult;
    kidFriendly: FlagResult;
    picnicFriendly: FlagResult;
    sustainable: FlagResult;
  };
  currentDb: Record<string, boolean | null>;
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
const manualBySlug = new Map<string, ManualCorrection>();
for (const m of manual) manualBySlug.set(m.slug, m);

// --- User-reviewed priority list (from amenity-4col-comparison.md) ---
// Slugs in KEEP_PROD are manually excluded even if v3 has confident data
const KEEP_PROD_OVERRIDES = new Set<string>([
  "cakebread-cellars:dogFriendly",         // v3 misread member-lounge exception
  "cakebread-cellars:kidFriendly",         // v3 misread Family Tasting exception
  "j-vineyards-winery:dogFriendly",        // v3 WELCOME vs quote says "except service dogs"
  "regusci-winery:kidFriendly",            // v3 classified backwards (quote says adult activity)
  "maria-concetto-winery-tasting-room:kidFriendly", // v3 evidence is just "Yes."
]);

// Slugs flagged for manual investigation (leave unchanged)
const INVESTIGATE_OVERRIDES = new Set<string>([
  "sonoma-coast-vineyards:picnicFriendly",  // grassy knoll exception
  "la-crema:picnicFriendly",                // Saralee's only
  "la-crema:sustainable",                   // generic language
  "trattore-farms-and-winery:sustainable",  // generic language
]);

// --- Helpers ---
function propertyWideQuote(flag: FlagResult): Quote | null {
  const quotes = flag.quotes || [];
  const pw = quotes.find((q) => q.scope === "property-wide");
  if (pw) return pw;
  return quotes[0] || null;
}

const FIELD_MAP: Record<string, {
  valueCol: string;
  sourceCol: string;
  noteCol: string;
  mcField: keyof ManualCorrection;
  mcNoteField?: keyof ManualCorrection;
}> = {
  dogFriendly: {
    valueCol: "dogFriendly",
    sourceCol: "dogFriendlySource",
    noteCol: "dogFriendlyNote",
    mcField: "dogFriendly",
    mcNoteField: "dogNote",
  },
  kidFriendly: {
    valueCol: "kidFriendly",
    sourceCol: "kidFriendlySource",
    noteCol: "kidFriendlyNote",
    mcField: "kidFriendly",
    mcNoteField: "kidNote",
  },
  picnicFriendly: {
    valueCol: "picnicFriendly",
    sourceCol: "picnicFriendlySource",
    noteCol: "picnicFriendlyNote",
    mcField: "picnicFriendly",
  },
  sustainable: {
    valueCol: "sustainableFarming",
    sourceCol: "sustainableSource",
    noteCol: "sustainableNote",
    mcField: "sustainable",
    mcNoteField: "sustainableNote",
  },
};

async function main() {
  console.log(shouldApply ? "=== APPLYING ===\n" : "=== DRY RUN (use --apply to write) ===\n");

  // Load current production values so we know if this is a new add, change, or source refresh
  const prodRows = await db.select({
    slug: wineries.slug,
    dogFriendly: wineries.dogFriendly,
    dogFriendlySource: wineries.dogFriendlySource,
    kidFriendly: wineries.kidFriendly,
    kidFriendlySource: wineries.kidFriendlySource,
    picnicFriendly: wineries.picnicFriendly,
    picnicFriendlySource: wineries.picnicFriendlySource,
    sustainableFarming: wineries.sustainableFarming,
    sustainableSource: wineries.sustainableSource,
  }).from(wineries);
  const prodBySlug = new Map(prodRows.map((r) => [r.slug, r]));

  let valueChanges = 0;
  let sourceRefreshes = 0;
  let newAdds = 0;
  let skippedManual = 0;
  let skippedNoEvidence = 0;
  let skippedInvestigate = 0;
  let skippedKeepProd = 0;

  const amenityKeys = ["dogFriendly", "kidFriendly", "picnicFriendly", "sustainable"] as const;

  for (const entry of audit) {
    if (entry.type !== "winery") continue;
    const mc = manualBySlug.get(entry.slug);
    const prodRow = prodBySlug.get(entry.slug);
    if (!prodRow) continue;

    const updates: Record<string, unknown> = {};
    const changes: string[] = [];

    for (const amenity of amenityKeys) {
      const flag = entry.flags[amenity];
      const map = FIELD_MAP[amenity];
      const overrideKey = `${entry.slug}:${amenity}`;

      // Skip if manual correction exists
      if (mc && mc[map.mcField] !== undefined) {
        skippedManual++;
        continue;
      }

      // Skip if user marked INVESTIGATE
      if (INVESTIGATE_OVERRIDES.has(overrideKey)) {
        skippedInvestigate++;
        continue;
      }

      const pw = propertyWideQuote(flag);
      const prodVal = prodRow[map.valueCol as keyof typeof prodRow] as boolean | null;
      const prodSrc = prodRow[map.sourceCol as keyof typeof prodRow] as string | null;

      // Skip if v3 has no confident evidence
      if (flag.confidence !== "high" || !pw) {
        skippedNoEvidence++;
        continue;
      }

      // Skip if user marked KEEP_PROD
      if (KEEP_PROD_OVERRIDES.has(overrideKey)) {
        skippedKeepProd++;
        changes.push(`${amenity}: v3=${flag.value} but KEEP_PROD override (current=${prodVal})`);
        continue;
      }

      const v3Source = pw.sourceUrl;
      const v3Value = flag.value;

      if (prodVal === null) {
        // Category A: new add
        updates[map.valueCol] = v3Value;
        updates[map.sourceCol] = v3Source;
        newAdds++;
        changes.push(`${amenity}: NULL → ${v3Value} (NEW, src: ${v3Source})`);
      } else if (prodVal !== v3Value) {
        // Category 🔴 ACCEPT_V3: value change
        updates[map.valueCol] = v3Value;
        updates[map.sourceCol] = v3Source;
        valueChanges++;
        changes.push(`${amenity}: ${prodVal} → ${v3Value} (CHANGE, src: ${v3Source})`);
      } else {
        // Values match: consider source refresh
        // Refresh if prod has no source, or current source is not a FAQ/tock/visit page
        const shouldRefresh =
          !prodSrc ||
          (v3Source.toLowerCase().includes("faq") || v3Source.toLowerCase().includes("tock") || v3Source.toLowerCase().includes("visit")) &&
          !(prodSrc.toLowerCase().includes("faq") || prodSrc.toLowerCase().includes("tock") || prodSrc.toLowerCase().includes("visit"));
        if (shouldRefresh && prodSrc !== v3Source) {
          updates[map.sourceCol] = v3Source;
          sourceRefreshes++;
          changes.push(`${amenity}: value unchanged (${v3Value}), refresh src: ${prodSrc || "null"} → ${v3Source}`);
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      console.log(`🍷 ${entry.name} (${entry.slug})`);
      for (const c of changes) console.log(`   ${c}`);
      if (shouldApply) {
        await db.update(wineries).set(updates).where(eq(wineries.slug, entry.slug));
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(shouldApply ? "          APPLIED" : "       DRY RUN SUMMARY");
  console.log("=".repeat(60));
  console.log(`  New value adds (prod was NULL):     ${newAdds}`);
  console.log(`  Value changes (🔴 ACCEPT_V3):       ${valueChanges}`);
  console.log(`  Source URL refreshes:                ${sourceRefreshes}`);
  console.log(`  Skipped — manual correction exists:  ${skippedManual}`);
  console.log(`  Skipped — INVESTIGATE override:      ${skippedInvestigate}`);
  console.log(`  Skipped — KEEP_PROD override:        ${skippedKeepProd}`);
  console.log(`  Skipped — v3 no confident evidence:  ${skippedNoEvidence}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
