/**
 * Editorial content for SEO category landing pages.
 *
 * Each scope (hub, valley, subregion) gets its own deck and meta.
 * Shared copy across scopes is forbidden — Google will dedupe pages
 * that look alike.
 *
 * Voice: third-person, warm but restrained, Condé Nast travel style.
 * No "we / our / us". No defensive copy.
 */
import type { WineryAmenity, CategoryScope, Valley } from "@/lib/category-data";

// ────────────────────────────────────────────────────────────────────────────
// Scope key helpers
// ────────────────────────────────────────────────────────────────────────────

export type ScopeKey = "hub" | `valley:${Valley}` | `subregion:${string}`;

export function scopeKeyOf(scope: CategoryScope): ScopeKey {
  if (scope.kind === "hub") return "hub";
  if (scope.kind === "valley") return `valley:${scope.valley}`;
  return `subregion:${scope.subRegionSlug}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Per-scope metadata (title / description / h1)
// ────────────────────────────────────────────────────────────────────────────

export interface CategoryMeta {
  title: string;
  description: string;
  h1: string;
  pathSegments: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// DOG CLUSTER — metadata
//
// Calibrated against Turso production as of 2026-04-11. "Sonoma Valley"
// appears as "Sonoma Valley AVA" in human-facing strings to disambiguate
// from Sonoma County. Slug stays `sonoma-valley`.
// ────────────────────────────────────────────────────────────────────────────

const DOG_META: Record<ScopeKey, CategoryMeta> = {
  hub: {
    title: "Dog-Friendly Wineries in Napa Valley & Sonoma County (2026 Guide)",
    description: "The Napa and Sonoma wineries that genuinely welcome dogs — water bowls at the host stand, treats on the bar, garden tastings under the oaks. Browse the full list at napasonomaguide.com.",
    h1: "Dog-Friendly Wineries in Napa Valley & Sonoma County",
    pathSegments: [],
  },
  "valley:napa": {
    title: "Dog-Friendly Wineries in Napa Valley (2026 Guide)",
    description: "The Napa Valley wineries that welcome dogs — from St. Helena's stone courtyards to Calistoga's volcanic-soil estates. Hours, what to expect on arrival, and the full list at napasonomaguide.com.",
    h1: "Dog-Friendly Wineries in Napa Valley",
    pathSegments: ["napa-valley"],
  },
  "valley:sonoma": {
    title: "Dog-Friendly Wineries in Sonoma County (2026 Guide)",
    description: "Sonoma's most dog-welcoming estates, from the Russian River to Dry Creek to the Sonoma Valley AVA. Cellar dogs, water stations, lawn tastings — and the full list at napasonomaguide.com.",
    h1: "Dog-Friendly Wineries in Sonoma County",
    pathSegments: ["sonoma-county"],
  },
  "subregion:st-helena": {
    title: "Dog-Friendly Wineries in St. Helena, Napa Valley",
    description: "St. Helena's dog-welcoming estates — historic stone wineries, shaded courtyards, and garden tastings on Napa Valley's most walkable Main Street.",
    h1: "Dog-Friendly Wineries in St. Helena",
    pathSegments: ["st-helena"],
  },
  "subregion:rutherford": {
    title: "Dog-Friendly Wineries in Rutherford, Napa Valley",
    description: "Rutherford's dog-welcoming estates — the cabernet heartland of Napa Valley, with garden tastings and oak-shaded patios where leashed dogs are welcome.",
    h1: "Dog-Friendly Wineries in Rutherford",
    pathSegments: ["rutherford"],
  },
  "subregion:calistoga": {
    title: "Dog-Friendly Wineries in Calistoga, Napa Valley",
    description: "Calistoga wineries that welcome dogs — casual outdoor tasting setups at Napa's volcanic northern edge, paired naturally with the town's hot springs and inns.",
    h1: "Dog-Friendly Wineries in Calistoga",
    pathSegments: ["calistoga"],
  },
  "subregion:carneros-napa": {
    title: "Dog-Friendly Wineries in Carneros (Napa)",
    description: "Cool-climate Carneros estates on the Napa side — pinot, chardonnay, sparkling wine country with lawn tastings and bay-breeze patios that welcome dogs.",
    h1: "Dog-Friendly Wineries in Carneros (Napa)",
    pathSegments: ["carneros-napa"],
  },
  "subregion:stags-leap-district": {
    title: "Dog-Friendly Wineries in the Stags Leap District, Napa Valley",
    description: "The compact Stags Leap District estates that welcome dogs — cabernet country pressed between the Silverado Trail and the volcanic palisades, with garden tastings and outdoor terraces.",
    h1: "Dog-Friendly Wineries in the Stags Leap District",
    pathSegments: ["stags-leap-district"],
  },
  "subregion:russian-river-valley": {
    title: "Dog-Friendly Wineries in the Russian River Valley, Sonoma",
    description: "Pinot country at its most relaxed — Russian River Valley estates with redwood-shaded back roads, creekside tasting rooms, and some of California wine country's warmest dog hospitality.",
    h1: "Dog-Friendly Wineries in the Russian River Valley",
    pathSegments: ["russian-river-valley"],
  },
  "subregion:sonoma-valley": {
    title: "Dog-Friendly Wineries in the Sonoma Valley AVA",
    description: "The Sonoma Valley AVA — the appellation, not the county — and its dog-welcoming estates from the historic plaza north through Glen Ellen and Kenwood. Picnic lawns, garden tables, water bowls at the door.",
    h1: "Dog-Friendly Wineries in the Sonoma Valley AVA",
    pathSegments: ["sonoma-valley"],
  },
  "subregion:dry-creek-valley": {
    title: "Dog-Friendly Wineries in Dry Creek Valley, Sonoma",
    description: "Dry Creek Valley's dog-welcoming estates — small family producers, zinfandel country, lawn tastings, and the kind of hospitality that doesn't blink when a dog walks in with you.",
    h1: "Dog-Friendly Wineries in Dry Creek Valley",
    pathSegments: ["dry-creek-valley"],
  },
  "subregion:carneros-sonoma": {
    title: "Dog-Friendly Wineries in Carneros (Sonoma)",
    description: "Carneros on the Sonoma side — bay-influenced pinot and chardonnay estates with open-air tastings and cool-climate hospitality that runs to four legs as readily as two.",
    h1: "Dog-Friendly Wineries in Carneros (Sonoma)",
    pathSegments: ["carneros-sonoma"],
  },
};

// ────────────────────────────────────────────────────────────────────────────
// DOG CLUSTER — decks
//
// 1-2 sentence editorial subhead rendered as the body lead paragraph
// between the hero and the winery grid on functional guide pages.
// ────────────────────────────────────────────────────────────────────────────

const DOG_DECKS: Record<ScopeKey, string> = {
  hub:
    "From estate gardens in Stags Leap to creekside tasting rooms in the Russian River — the Napa and Sonoma wineries that genuinely welcome four-legged guests.",
  "valley:napa":
    "Shaded courtyards, garden tastings under old oaks, and the estates along Highway 29 that welcome dogs with water bowls at the host stand and treats on the bar.",
  "valley:sonoma":
    "Cellar dogs, lawn tastings, water stations at every host stand — Sonoma's dog culture runs deeper than a posted policy.",
  "subregion:st-helena":
    "The historic heart of Napa Valley — stone wineries, shaded courtyards, and the estates along Main Street that welcome dogs as readily as they welcome guests.",
  "subregion:rutherford":
    "Cabernet heartland with garden terraces and outdoor tastings — the Rutherford estates that welcome dogs along for the ride.",
  "subregion:calistoga":
    "Volcanic soil, oak-shaded picnic tables, and the casual northern-Napa estates where a leashed dog fits right in.",
  "subregion:carneros-napa":
    "Cool-climate pinot and chardonnay country with bay breezes, lawn tastings, and the kind of outdoor pacing that suits an afternoon with a dog.",
  "subregion:stags-leap-district":
    "The compact Napa appellation between the Silverado Trail and the volcanic palisades — and the four iconic estates here that genuinely welcome four-legged guests.",
  "subregion:russian-river-valley":
    "Redwood-shaded back roads, creekside estates, and some of California wine country's warmest dog hospitality.",
  "subregion:sonoma-valley":
    "The Sonoma Valley AVA — the appellation, not the county — and its dog-welcoming estates from the historic plaza north through Glen Ellen.",
  "subregion:dry-creek-valley":
    "Small family producers, zinfandel-country pacing, and the kind of lawn tastings where the dog comes inside with the rest of the party.",
  "subregion:carneros-sonoma":
    "Bay-influenced pinot and chardonnay producers with open-air tastings and cool-climate hospitality that runs to four legs as readily as two.",
};

// ────────────────────────────────────────────────────────────────────────────
// DOG CLUSTER — hero image overrides
// ────────────────────────────────────────────────────────────────────────────

export interface CategoryHeroImage {
  url: string;
  wineryName: string;
  winerySlug: string;
}

/** Override the auto-picked hero image for a specific scope. Empty = auto-pick all. */
const DOG_HERO_OVERRIDES: Partial<Record<ScopeKey, CategoryHeroImage>> = {};

// ────────────────────────────────────────────────────────────────────────────
// DOG CLUSTER — FAQs
// ────────────────────────────────────────────────────────────────────────────

export interface CategoryFaqItem {
  question: string;
  answer: string;
}

export const DOG_FAQS: CategoryFaqItem[] = [
  {
    question: "Are dogs really welcome at Napa and Sonoma wineries?",
    answer:
      "At a meaningful share of them, yes. Sonoma producers tend to be more openly dog-welcoming than Napa, but both valleys have a sizable set of estates that allow leashed dogs in outdoor tasting areas, and a smaller set that allow them inside the tasting room. Open any winery's listing on napasonomaguide.com for the specifics.",
  },
  {
    question: "Do I need to bring proof of vaccination or any paperwork?",
    answer:
      "No winery on this list currently requires paperwork. The standard expectation is a leash, current rabies tag, and basic on-property manners. A few producers ask that dogs not approach the host stand directly; otherwise, the etiquette is the same as any patio dining experience.",
  },
  {
    question: "Can dogs go inside the tasting room?",
    answer:
      "It depends on the estate. The default at most dog-friendly wineries is outdoor seating only — patios, courtyards, garden tables, vineyard-edge setups. A smaller subset allows dogs inside the tasting room itself, almost always at smaller family producers. The individual winery pages on napasonomaguide.com call out which is which.",
  },
  {
    question: "Should I make a reservation if I'm bringing a dog?",
    answer:
      "Yes, and mention the dog at booking. Napa is overwhelmingly appointment-only and Sonoma is heading the same direction. Mentioning the dog when reserving is both a courtesy and a way to confirm the policy on the day of the visit, and it occasionally unlocks a better outdoor table.",
  },
  {
    question: "Are there off-leash wineries?",
    answer:
      "A handful of smaller producers allow off-leash time on the lawn during quiet hours, particularly in the Russian River Valley and the upper end of Dry Creek. None of the larger estates do. Default to leashed and ask the host on arrival before letting a dog off-leash.",
  },
  {
    question: "What about hot summer days — is it safe to bring a dog?",
    answer:
      "Napa and Sonoma can both run hot from June through September, with valley-floor temperatures regularly exceeding 90°F in the afternoon. Morning tasting appointments, shaded outdoor seating, and water bowls at the host stand make summer visits workable, but afternoon tastings on exposed terraces are not the right call. The Russian River Valley and Carneros stay measurably cooler than the upper Napa Valley floor in midsummer.",
  },
  {
    question: "Where do these dog policies come from?",
    answer:
      "Most come from each winery's own visitor information or pet policy page. Where producers don't publish a clear policy, the listing draws on regional pet-friendly directories or direct confirmation from the winery itself. Open an individual winery's page on napasonomaguide.com to find the specific source for that estate.",
  },
  {
    question: "What if a winery's policy has changed since you last checked?",
    answer:
      "Wine country visitor policies do shift, particularly after ownership changes or insurance updates. Each individual winery page on napasonomaguide.com shows when its details were last reviewed. Any winery whose policy no longer matches what's listed can be reported through the contact form, and the page will be updated within a week.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Public lookup API
// ────────────────────────────────────────────────────────────────────────────

export function getCategoryMeta(
  amenity: WineryAmenity,
  scope: CategoryScope
): CategoryMeta | null {
  const key = scopeKeyOf(scope);
  if (amenity === "dog") return DOG_META[key] ?? null;
  return null;
}

export function getCategoryDeck(
  amenity: WineryAmenity,
  scope: CategoryScope
): string | null {
  const key = scopeKeyOf(scope);
  if (amenity === "dog") return DOG_DECKS[key] ?? null;
  return null;
}

export function getCategoryFaqs(amenity: WineryAmenity): CategoryFaqItem[] {
  if (amenity === "dog") return DOG_FAQS;
  return [];
}

export function getCategoryHeroOverride(
  amenity: WineryAmenity,
  scope: CategoryScope
): CategoryHeroImage | null {
  const key = scopeKeyOf(scope);
  if (amenity === "dog") return DOG_HERO_OVERRIDES[key] ?? null;
  return null;
}

export function getDefinedScopes(amenity: WineryAmenity): ScopeKey[] {
  if (amenity === "dog") return Object.keys(DOG_META) as ScopeKey[];
  return [];
}
