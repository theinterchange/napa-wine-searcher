/**
 * Apply v3 audit updates to accommodations, with source attribution + asterisk notes.
 *
 * Decision precedence (top wins):
 * 1. Manual corrections (amenity-manual-corrections-accommodations.json) — untouched
 * 2. User-defined explicit overrides (below)
 * 3. v3 high-confidence property-wide quote → apply with extracted note + source
 * 4. v3 low-confidence — leave production unchanged, only refresh source URL
 *
 * Usage:
 *   npx tsx scripts/apply-v3-accommodation-updates.ts                 # dry run
 *   npx tsx scripts/apply-v3-accommodation-updates.ts --apply         # local write
 *   npx tsx scripts/apply-v3-accommodation-updates.ts --apply --turso # production
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
  adultsOnly?: boolean;
  source?: string;
}

type ActionType = "UPDATE_VALUE" | "ADD_NEW" | "REFRESH_SOURCE" | "SKIP_MANUAL" | "SKIP_NO_EVIDENCE" | "OVERRIDE" | "KEEP_PROD";

const audit: AuditEntry[] = JSON.parse(readFileSync("amenity-audit-v3-report.json", "utf-8"));
const manual: ManualCorrection[] = JSON.parse(readFileSync("amenity-manual-corrections-accommodations.json", "utf-8"));
const manualBySlug = new Map<string, ManualCorrection>();
for (const m of manual) manualBySlug.set(m.slug, m);

// --- User-defined explicit overrides (run before v3 processing) ---
// Keys are `slug:amenity`
interface Override {
  decision: "KEEP_PROD" | "SET_VALUE" | "SET_NULL";
  value?: boolean;
  adultsOnly?: boolean;
  note?: string | null; // null = explicitly clear, undefined = leave alone
  source?: string;
  reason: string;
}

const EXPLICIT_OVERRIDES: Record<string, Override> = {
  "the-westin-verasa-napa:kidFriendly": {
    decision: "KEEP_PROD",
    reason: "v3 quote came from marriott.com Florida page — wrong property",
  },
  "johnsons-beach-cabins-and-campground:dogFriendly": {
    decision: "KEEP_PROD",
    reason: "v3 misread quote that explicitly says pets NOT allowed on beach",
  },
  "grand-reserve-meritage-resort:kidFriendly": {
    decision: "SET_VALUE",
    value: true,
    note: "Under 21 must be accompanied by an adult",
    source: "http://www.meritageresort.com/faq",
    reason: "v3 read '21+ or accompanied by adult' as BLANKET_BAN but kids ARE allowed",
  },
  "the-meritage-resort-and-spa:kidFriendly": {
    decision: "SET_VALUE",
    value: true,
    note: "Under 21 must be accompanied by an adult",
    source: "https://www.meritageresort.com/faq",
    reason: "Same as Grand Reserve Meritage — accompanied-by-adult means kids allowed",
  },
  "indian-springs-calistoga:kidFriendly": {
    decision: "SET_VALUE",
    value: true,
    note: null,  // clear stale "Ages 14+" — the 14-year rule is pool-specific, not property-wide
    source: "https://www.indianspringscalistoga.com/policies",
    reason: "Kids welcome at property; the 'under 14 must be accompanied' rule is pool-specific",
  },
  "timber-cove-resort:kidFriendly": {
    decision: "SET_VALUE",
    value: true,
    note: null,  // clear stale "16+" — fitness center only, not property-wide. Pack-n-plays confirm kids welcome
    source: "https://www.timbercoveresort.com/faq",
    reason: "Property welcomes kids (pack-n-plays available); 16+ rule is for fitness center only",
  },
  "timber-cove-resort:dogFriendly": {
    decision: "SET_VALUE",
    value: true,
    note: "$150 first pet, $50 second pet (max 2 per room)",
    source: "https://www.timbercoveresort.com/faq",
    reason: "v3 has the fee structure but regex missed multi-tier pattern",
  },
  "the-lodge-at-bodega-bay:kidFriendly": {
    decision: "SET_VALUE",
    value: true,
    note: null, // clear misleading "Under 12 must be accompanied" — kids actually stay free
    source: "https://www.lodgeatbodegabay.com/info-policies",
    reason: "Prod note was misleading; kids 12 and under stay free (family-friendly resort)",
  },
  "farmhouse-inn:kidFriendly": {
    decision: "SET_VALUE",
    value: true,
    note: null, // clear "Minors must be accompanied" — generic supervision boilerplate
    source: "https://www.farmhouseinn.com/pages/frequently-asked-questions",
    reason: "Supervision language is boilerplate, not a real kid restriction",
  },
  "the-woods-cottages-and-cabins-russian-river:kidFriendly": {
    decision: "SET_VALUE",
    value: false,
    adultsOnly: true,
    note: "Adult-oriented property",
    source: "https://russianriverhotel.com/the-woods-guerneville-cottages-cabins-rates-policies/",
    reason: "User confirmed: adults-only per source",
  },
  "calderwood-inn:kidFriendly": {
    decision: "SET_VALUE",
    value: true,
    note: "Best suited for older guests; call ahead if traveling with young children",
    source: "https://calderwoodinn.com/policies",
    reason: "User override: cautioning asterisk",
  },
  "dr-wilkinsons-backyard-resort-and-mineral-springs:kidFriendly": {
    decision: "SET_NULL",
    reason: "v3 quote 'ADULTS ONLY ZEN ZONE' is zone-specific, not property-wide",
  },
  "mount-view-hotel-and-spa:kidFriendly": {
    decision: "SET_VALUE",
    value: true,
    note: "Children must not be left unattended in common areas",
    source: "https://www.mountviewhotel.com/policies",
    reason: "v3 misread FAQ question as answer — supervision rule implies kids allowed",
  },
};

// --- Note extraction from v3 quotes ---
interface KidCaveat {
  note: string;
  impliesAdultsOnly: boolean;
}

// Skip quotes that mention area-specific restrictions (pool/spa/fitness).
// These are frequently mis-tagged as property-wide by the classifier when
// they actually apply only to a specific area of the property.
function isAreaSpecificKidQuote(q: string): boolean {
  return /\b(pool|fitness\s+center|spa|hot\s+tub|bar|restaurant|dining\s+room|lounge|gated\s+area|jacuzzi|swim)\b/i.test(q);
}

function extractKidNote(quotes: Quote[]): KidCaveat | null {
  // Only look at property-wide quotes that AREN'T about a specific area
  const pwFiltered = quotes
    .filter((q) => q.scope === "property-wide")
    .filter((q) => !isAreaSpecificKidQuote(q.quote))
    .map((q) => q.quote);
  const pw = pwFiltered.join(" ");
  if (!pw) return null;

  // "adults-only" explicit phrase → adults-only
  if (/\badults[\s-]?only\b/i.test(pw) || /\bno\s+children\b/i.test(pw) || /\badult[\s-]hotel\b/i.test(pw) || /\badult\s+property\b/i.test(pw)) {
    return { note: "Adult-oriented property", impliesAdultsOnly: true };
  }

  // "unsuitable/not suitable/not recommended for children under X"
  const unsuitable = pw.match(/(?:unsuitable|not\s+suitable|not\s+recommended)\s+for\s+children\s+under\s+(\d+)/i);
  if (unsuitable) {
    const age = parseInt(unsuitable[1], 10);
    if (age >= 18) return { note: "Adult-oriented property", impliesAdultsOnly: true };
    return { note: `Ages ${age}+ recommended`, impliesAdultsOnly: false };
  }

  if (/developed\s+for\s+an\s+adult\s+clientele|adult\s+clientele/i.test(pw)) {
    return { note: "Adult-oriented property", impliesAdultsOnly: true };
  }

  // "welcome children X years and older" / "children X and older" — definitive age minimum
  const ageMin = pw.match(/(?:welcome\s+)?children\s+(\d+)\s*(?:years?\s+)?(?:and\s+older|or\s+older|and\s+up|and\s+above)/i);
  if (ageMin) {
    const age = parseInt(ageMin[1], 10);
    if (age >= 18) return { note: "Adult-oriented property", impliesAdultsOnly: true };
    return { note: `Ages ${age}+ only`, impliesAdultsOnly: false };
  }

  // "children under 12 are not allowed" — property-wide age minimum
  const underNotAllowed = pw.match(/children\s+under\s+(\d+)\s+are\s+not\s+allowed/i);
  if (underNotAllowed) {
    const age = parseInt(underNotAllowed[1], 10);
    if (age >= 18) return { note: "Adult-oriented property", impliesAdultsOnly: true };
    return { note: `Ages ${age}+ only`, impliesAdultsOnly: false };
  }

  // "do not admit children under X" (SingleThread-style)
  const doNotAdmit = pw.match(/do\s+not\s+admit\s+children\s+under\s+(?:the\s+age\s+of\s+)?(\d+)/i);
  if (doNotAdmit) {
    const age = parseInt(doNotAdmit[1], 10);
    return { note: `Ages ${age}+ only`, impliesAdultsOnly: false };
  }

  // "suitable for adults ages X and over" — adults-only styling
  if (/suitable\s+for\s+adults\s+ages?\s+(\d+)\s+and\s+over/i.test(pw) || /all\s+guests\s+must\s+be\s+at\s+least\s+18/i.test(pw)) {
    return { note: "Adult-oriented property", impliesAdultsOnly: true };
  }

  // We intentionally DO NOT extract "Minors must be accompanied" or
  // "guests under X must be accompanied" notes. These are standard hotel
  // supervision/liability language — not real restrictions on kid access.
  // Surfacing them with an asterisk misleads users into thinking the
  // property is less kid-friendly than it is.

  return null;
}

function extractDogNote(quotes: Quote[], dogValue: boolean): string | null {
  const pwQuotes = quotes.filter((q) => q.scope === "property-wide").map((q) => q.quote);
  if (!pwQuotes.length) return null;
  const pw = pwQuotes.join(" ");

  // SERVICE-ANIMALS-ONLY: if dog is false but property explicitly accommodates service animals,
  // say so clearly — it's a meaningful distinction for disabled guests.
  if (dogValue === false) {
    const serviceAllowed =
      /\bservice\s+animals?\b/i.test(pw) ||
      /\bservice\s+dogs?\b/i.test(pw) ||
      /\bADA(?:\s+(?:requirements?|compliance))?\b/.test(pw) ||
      /\bAmericans\s+with\s+Disabilities\s+Act\b/i.test(pw);
    if (serviceAllowed) return "Service animals only";
    return null; // dog=false with no service exception → no note
  }

  // dogValue === true: extract caveats about the welcome policy
  const parts: string[] = [];

  // Multi-tier fee: "$150 for the first pet and $50 for the second" or "$150 per stay for one dog, or $200 per stay for two dogs"
  const multiTier =
    pw.match(/\$(\d+)(?:\.\d+)?\s*(?:USD\s+)?(?:for\s+the\s+)?first\s+pet\s+and\s+\$(\d+)(?:\.\d+)?\s*(?:USD\s+)?(?:for\s+the\s+)?second\s+pet/i) ||
    pw.match(/\$(\d+)(?:\.\d+)?\s*(?:USD\s+)?(?:per\s+stay\s+)?for\s+one\s+dog,?\s+or\s+\$(\d+)(?:\.\d+)?\s*(?:USD\s+)?(?:per\s+stay\s+)?for\s+two\s+dogs/i);
  if (multiTier) {
    parts.push(`$${multiTier[1]} for one pet, $${multiTier[2]} for two`);
  } else {
    // Single fee: find dollar amount, then look at surrounding context for unit
    const feeMatch = pw.match(/\$(\d+)(?:\.\d+)?/);
    if (feeMatch) {
      const idx = feeMatch.index ?? 0;
      const context = pw.slice(idx, idx + 100).toLowerCase();
      const isNight = /per\s+(?:dog\s+|pet\s+)?night|\/\s*(?:pet\/)?night|per night/i.test(context);
      const isStay = /per\s+(?:dog\s+|pet\s+)?stay|\/\s*(?:pet\/)?stay|per stay|one[-\s]time/i.test(context);
      if (isNight || isStay) {
        parts.push(`$${feeMatch[1]} pet fee ${isNight ? "per night" : "per stay"}`);
      }
    }
  }

  // Size limit ("under 50 lbs", "50 lbs or less", "50 pounds", "over 85 lbs cannot be accommodated")
  const sizeUnder = pw.match(/(?:under|below|less\s+than|up\s+to)\s+(\d+)\s*(?:lbs?|pounds?)/i) ||
                    pw.match(/(\d+)\s*(?:lbs?|pounds?)\s+or\s+less/i) ||
                    pw.match(/must\s+be\s+(\d+)\s*lbs?\s+or\s+less/i);
  const sizeOver = pw.match(/over\s+(\d+)\s*(?:lbs?|pounds?)\s+cannot\s+be\s+accommodated/i);
  if (sizeUnder) parts.push(`Dogs under ${sizeUnder[1]} lbs`);
  else if (sizeOver) parts.push(`Dogs under ${sizeOver[1]} lbs`);

  // Specific rooms/cabins only: "three dog friendly rooms are Cabin 14, 15 and 16"
  const specificCabins = pw.match(/dog[\s-]friendly\s+(?:rooms|cabins)\s+are\s+[^.]+/i);
  if (specificCabins) {
    parts.push("Select dog-friendly rooms only");
  } else if (/designated\s+(?:pet[-\s]?friendly\s+)?(?:rooms|cabins)/i.test(pw)) {
    parts.push("Select pet-friendly rooms only");
  } else if (/(?:in|at)\s+(?:three|select|specific)\s+(?:of\s+)?(?:our\s+)?(?:individual\s+)?cabins/i.test(pw)) {
    parts.push("Select cabins only");
  }

  // Max 1 / 2 dogs per room
  if (/only\s+one\s+dog|one\s+dog\s+(?:per|at)/i.test(pw) && !parts.some((p) => p.toLowerCase().includes("first pet"))) {
    if (!parts.some((p) => p.includes("first pet") || p.includes("per reservation"))) {
      parts.push("One dog per room");
    }
  }
  const maxDogs = pw.match(/(?:maximum|max(?:imum)?)\s+(?:number\s+is\s+|of\s+)?(?:(\d+)|two|2)\s+(?:dogs?|pets?)/i) ||
                  pw.match(/no\s+more\s+than\s+(?:(\d+)|two)\s+dogs?/i);
  if (maxDogs && !parts.some((p) => /per\s+room|per\s+reservation|One\s+dog/.test(p))) {
    const numStr = maxDogs[1];
    const num = numStr && /^\d+$/.test(numStr) ? numStr : "2";
    parts.push(`Max ${num} pets per room`);
  }

  return parts.length > 0 ? parts.join("; ") : null;
}

// --- Helpers ---
function propertyWideQuote(flag: FlagResult): Quote | null {
  const quotes = flag.quotes || [];
  const pw = quotes.find((q) => q.scope === "property-wide");
  return pw || quotes[0] || null;
}

interface WriteAction {
  slug: string;
  name: string;
  updates: Record<string, unknown>;
  descriptions: string[];
}

// --- Main ---
async function main() {
  console.log(shouldApply ? "=== APPLYING ===\n" : "=== DRY RUN (use --apply to write) ===\n");

  // Load current production
  const prodRows = await db.select({
    slug: accommodations.slug,
    name: accommodations.name,
    dogFriendly: accommodations.dogFriendly,
    dogFriendlyNote: accommodations.dogFriendlyNote,
    dogFriendlySource: accommodations.dogFriendlySource,
    kidFriendly: accommodations.kidFriendly,
    kidFriendlyNote: accommodations.kidFriendlyNote,
    kidFriendlySource: accommodations.kidFriendlySource,
    adultsOnly: accommodations.adultsOnly,
  }).from(accommodations);
  const prodBySlug = new Map(prodRows.map((r) => [r.slug, r]));

  const auditBySlug = new Map(audit.filter((e) => e.type === "accommodation").map((e) => [e.slug, e]));

  let counters = {
    overrides: 0,
    valueChanges: 0,
    newAdds: 0,
    sourceRefreshes: 0,
    noteRefreshes: 0,
    skippedManual: 0,
    skippedNoEvidence: 0,
    keepProd: 0,
    dogServiceOnly: 0,
    dogFeeExtracted: 0,
    kidAgeExtracted: 0,
  };

  for (const prodRow of prodRows) {
    const slug = prodRow.slug;
    const entry = auditBySlug.get(slug);
    const mc = manualBySlug.get(slug);

    const updates: Record<string, unknown> = {};
    const descriptions: string[] = [];

    for (const amenity of ["dogFriendly", "kidFriendly"] as const) {
      const overrideKey = `${slug}:${amenity}`;
      const override = EXPLICIT_OVERRIDES[overrideKey];
      const flag = entry?.flags[amenity];

      const valueCol = amenity;
      const sourceCol = amenity === "dogFriendly" ? "dogFriendlySource" : "kidFriendlySource";
      const noteCol = amenity === "dogFriendly" ? "dogFriendlyNote" : "kidFriendlyNote";
      const mcField = amenity === "dogFriendly" ? "dogFriendly" : "kidFriendly";
      const mcNoteField = amenity === "dogFriendly" ? "dogNote" : "kidNote";

      // 1. Skip if manual correction exists
      if (mc && (mc as any)[mcField] !== undefined) {
        counters.skippedManual++;
        continue;
      }

      // 2. User explicit override
      if (override) {
        counters.overrides++;
        if (override.decision === "KEEP_PROD") {
          counters.keepProd++;
          descriptions.push(`${amenity}: override KEEP_PROD (${override.reason})`);
          continue;
        }
        if (override.decision === "SET_NULL") {
          updates[valueCol] = null;
          updates[sourceCol] = null;
          updates[noteCol] = null;
          if (amenity === "kidFriendly" && prodRow.adultsOnly) {
            // Per user rule: NULL kid_friendly should NOT keep adults_only=true
            updates.adultsOnly = null;
          }
          descriptions.push(`${amenity}: → NULL (override: ${override.reason})`);
          continue;
        }
        if (override.decision === "SET_VALUE") {
          updates[valueCol] = override.value;
          if (override.source) updates[sourceCol] = override.source;
          if (override.note !== undefined) updates[noteCol] = override.note;
          if (amenity === "kidFriendly") {
            // Determine adults_only: explicit override wins, else derive from value
            const newAdultsOnly =
              override.adultsOnly !== undefined ? override.adultsOnly : !override.value;
            if (newAdultsOnly !== (prodRow.adultsOnly ?? false)) {
              updates.adultsOnly = newAdultsOnly;
            }
          }
          descriptions.push(
            `${amenity}: → ${override.value}${override.note ? ` "${override.note}"` : ""} (override: ${override.reason})${
              amenity === "kidFriendly" && updates.adultsOnly !== undefined
                ? ` adults_only=${updates.adultsOnly}`
                : ""
            }`,
          );
          continue;
        }
      }

      // 3. v3 processing
      if (!flag) {
        counters.skippedNoEvidence++;
        continue;
      }
      const pw = propertyWideQuote(flag);

      // Extract note from property-wide quotes
      const kidCaveat = amenity === "kidFriendly" ? extractKidNote(flag.quotes || []) : null;
      const dogNote = amenity === "dogFriendly" ? extractDogNote(flag.quotes || [], flag.value) : null;
      const extractedNote = amenity === "kidFriendly" ? kidCaveat?.note ?? null : dogNote;

      if (flag.confidence !== "high" || !pw) {
        counters.skippedNoEvidence++;
        continue;
      }

      const v3Source = pw.sourceUrl;
      const v3Value = flag.value;
      const prodVal = (prodRow as any)[valueCol] as boolean | null;
      const prodSrc = (prodRow as any)[sourceCol] as string | null;
      const prodNote = (prodRow as any)[noteCol] as string | null;

      // Determine adults_only intent for this amenity+value
      // BLANKET_BAN kid=false OR kidCaveat implies adults-only → adults_only=true
      // WELCOME/AGE_MINIMUM kid=true → adults_only=false
      let adultsOnlyIntent: boolean | null = null;
      if (amenity === "kidFriendly") {
        if (v3Value === false && (flag.overall === "BLANKET_BAN" || kidCaveat?.impliesAdultsOnly)) {
          adultsOnlyIntent = true;
        } else if (v3Value === true && kidCaveat?.impliesAdultsOnly) {
          // Caveat implies adults-only but v3 says kid=true — trust the caveat
          adultsOnlyIntent = true;
        } else if (v3Value === true) {
          adultsOnlyIntent = false;
        }
      }

      if (prodVal === null) {
        // New add
        updates[valueCol] = v3Value;
        updates[sourceCol] = v3Source;
        if (extractedNote) {
          updates[noteCol] = extractedNote;
          if (amenity === "kidFriendly") counters.kidAgeExtracted++;
          else counters.dogFeeExtracted++;
        }
        if (amenity === "kidFriendly" && adultsOnlyIntent !== null && adultsOnlyIntent !== (prodRow.adultsOnly ?? false)) {
          updates.adultsOnly = adultsOnlyIntent;
        }
        counters.newAdds++;
        descriptions.push(`${amenity}: NULL → ${v3Value}${extractedNote ? ` "${extractedNote}"` : ""} (NEW, src: ${v3Source})`);
      } else if (prodVal !== v3Value) {
        // Value change
        updates[valueCol] = v3Value;
        updates[sourceCol] = v3Source;
        if (extractedNote) {
          updates[noteCol] = extractedNote;
          if (amenity === "kidFriendly") counters.kidAgeExtracted++;
          else counters.dogFeeExtracted++;
        } else {
          updates[noteCol] = null; // clear stale note when value flips
        }
        if (amenity === "kidFriendly" && adultsOnlyIntent !== null && adultsOnlyIntent !== (prodRow.adultsOnly ?? false)) {
          updates.adultsOnly = adultsOnlyIntent;
        }
        counters.valueChanges++;
        descriptions.push(`${amenity}: ${prodVal} → ${v3Value}${extractedNote ? ` "${extractedNote}"` : ""} (src: ${v3Source})`);
      } else {
        // Same value — maybe refresh source / note / adults_only
        const sourceIsBetter =
          !prodSrc ||
          ((v3Source.toLowerCase().includes("faq") || v3Source.toLowerCase().includes("policies") || v3Source.toLowerCase().includes("visit")) &&
            !(prodSrc.toLowerCase().includes("faq") || prodSrc.toLowerCase().includes("policies") || prodSrc.toLowerCase().includes("visit")));
        const noteChanged = extractedNote && extractedNote !== prodNote;
        const adultsOnlyChanged =
          amenity === "kidFriendly" && adultsOnlyIntent !== null && adultsOnlyIntent !== (prodRow.adultsOnly ?? false);

        if (sourceIsBetter && prodSrc !== v3Source) {
          updates[sourceCol] = v3Source;
          counters.sourceRefreshes++;
          descriptions.push(`${amenity}: value unchanged (${v3Value}), refresh src: ${prodSrc || "null"} → ${v3Source}`);
        }
        if (noteChanged) {
          updates[noteCol] = extractedNote;
          counters.noteRefreshes++;
          descriptions.push(`${amenity}: value unchanged, refresh note: "${prodNote || ""}" → "${extractedNote}"`);
          if (amenity === "kidFriendly") counters.kidAgeExtracted++;
          else counters.dogFeeExtracted++;
        }
        if (adultsOnlyChanged) {
          updates.adultsOnly = adultsOnlyIntent;
          descriptions.push(`${amenity}: value unchanged, flip adultsOnly: ${prodRow.adultsOnly ?? false} → ${adultsOnlyIntent}`);
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      console.log(`🏨 ${prodRow.name} (${slug})`);
      for (const d of descriptions) console.log(`   ${d}`);
      if (shouldApply) {
        await db.update(accommodations).set(updates).where(eq(accommodations.slug, slug));
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(shouldApply ? "          APPLIED" : "       DRY RUN SUMMARY");
  console.log("=".repeat(60));
  console.log(`  User explicit overrides:          ${counters.overrides}`);
  console.log(`  New value adds (prod was NULL):   ${counters.newAdds}`);
  console.log(`  Value changes:                    ${counters.valueChanges}`);
  console.log(`  Source URL refreshes:             ${counters.sourceRefreshes}`);
  console.log(`  Note refreshes:                   ${counters.noteRefreshes}`);
  console.log(`  Kid age notes extracted:          ${counters.kidAgeExtracted}`);
  console.log(`  Dog fee/size notes extracted:     ${counters.dogFeeExtracted}`);
  console.log(`  Skipped (manual correction):      ${counters.skippedManual}`);
  console.log(`  Skipped (KEEP_PROD override):     ${counters.keepProd}`);
  console.log(`  Skipped (no evidence):            ${counters.skippedNoEvidence}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
