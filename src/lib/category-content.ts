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
// KID CLUSTER — metadata
// ────────────────────────────────────────────────────────────────────────────

const KID_META: Record<ScopeKey, CategoryMeta> = {
  hub: {
    title: "Kid-Friendly Wineries in Napa Valley & Sonoma County (2026 Guide)",
    description: "The Napa and Sonoma wineries that genuinely welcome families — lawn games, grape juice for the kids, shaded picnic areas, and outdoor spaces where everyone can relax.",
    h1: "Kid-Friendly Wineries in Napa Valley & Sonoma County",
    pathSegments: [],
  },
  "valley:napa": {
    title: "Kid-Friendly Wineries in Napa Valley (2026 Guide)",
    description: "Napa Valley wineries where families are welcome — garden seating, grape juice tastings, lawn games, and estates designed for all ages along Highway 29 and the Silverado Trail.",
    h1: "Kid-Friendly Wineries in Napa Valley",
    pathSegments: ["napa-valley"],
  },
  "valley:sonoma": {
    title: "Kid-Friendly Wineries in Sonoma County (2026 Guide)",
    description: "Sonoma County's most family-welcoming wineries — sprawling lawns, farm animals, picnic grounds, and the kind of relaxed atmosphere where kids can be kids while adults taste.",
    h1: "Kid-Friendly Wineries in Sonoma County",
    pathSegments: ["sonoma-county"],
  },
  "subregion:russian-river-valley": {
    title: "Kid-Friendly Wineries in the Russian River Valley, Sonoma",
    description: "Russian River Valley wineries that welcome families — creekside picnic spots, open lawns, and the kind of relaxed redwood-country atmosphere that works for every age.",
    h1: "Kid-Friendly Wineries in the Russian River Valley",
    pathSegments: ["russian-river-valley"],
  },
  "subregion:sonoma-valley": {
    title: "Kid-Friendly Wineries in the Sonoma Valley AVA",
    description: "Family-friendly estates in the Sonoma Valley AVA — from the historic Sonoma Plaza north through Glen Ellen and Kenwood, with lawn games, picnic areas, and grape juice pours.",
    h1: "Kid-Friendly Wineries in the Sonoma Valley AVA",
    pathSegments: ["sonoma-valley"],
  },
  "subregion:dry-creek-valley": {
    title: "Kid-Friendly Wineries in Dry Creek Valley, Sonoma",
    description: "Dry Creek Valley's family-friendly wineries — small producers with big lawns, shaded picnic tables, and the unhurried zinfandel-country pace that families love.",
    h1: "Kid-Friendly Wineries in Dry Creek Valley",
    pathSegments: ["dry-creek-valley"],
  },
  "subregion:st-helena": {
    title: "Kid-Friendly Wineries in St. Helena, Napa Valley",
    description: "St. Helena wineries that welcome families — garden courtyards, shaded patios, and the estates along Main Street where kids can explore while parents taste.",
    h1: "Kid-Friendly Wineries in St. Helena",
    pathSegments: ["st-helena"],
  },
  "subregion:carneros-sonoma": {
    title: "Kid-Friendly Wineries in Carneros (Sonoma)",
    description: "Carneros wineries on the Sonoma side that welcome families — cool-climate estates with open-air tastings, wide lawns, and bay-breeze afternoons built for all ages.",
    h1: "Kid-Friendly Wineries in Carneros (Sonoma)",
    pathSegments: ["carneros-sonoma"],
  },
  "subregion:rutherford": {
    title: "Kid-Friendly Wineries in Rutherford, Napa Valley",
    description: "Rutherford wineries where families are welcome — cabernet heartland with garden terraces, outdoor tastings, and estates that make room for younger visitors.",
    h1: "Kid-Friendly Wineries in Rutherford",
    pathSegments: ["rutherford"],
  },
  "subregion:calistoga": {
    title: "Kid-Friendly Wineries in Calistoga, Napa Valley",
    description: "Calistoga's family-welcoming wineries — casual outdoor setups at Napa's volcanic northern edge, paired naturally with the town's geysers, hot springs, and petrified forest.",
    h1: "Kid-Friendly Wineries in Calistoga",
    pathSegments: ["calistoga"],
  },
};

// ────────────────────────────────────────────────────────────────────────────
// KID CLUSTER — decks
// ────────────────────────────────────────────────────────────────────────────

const KID_DECKS: Record<ScopeKey, string> = {
  hub:
    "Lawn games by the vines, grape juice at the bar, and the Napa and Sonoma estates that treat family visitors as warmly as any wine club member.",
  "valley:napa":
    "Garden tastings, shaded courtyards, and the Napa Valley estates along Highway 29 and the Silverado Trail where families are part of the plan, not an afterthought.",
  "valley:sonoma":
    "Sprawling lawns, farm animals, picnic grounds, and the laid-back Sonoma producers who genuinely welcome visitors of every age.",
  "subregion:russian-river-valley":
    "Creekside picnic spots, redwood-shaded lawns, and the Russian River estates where the family-friendly vibe runs as deep as the pinot noir roots.",
  "subregion:sonoma-valley":
    "From the Sonoma Plaza north through Glen Ellen — the valley's family-friendly estates with lawn games, shaded picnic tables, and grape juice pours for younger visitors.",
  "subregion:dry-creek-valley":
    "Small family producers with big lawns, unhurried zinfandel-country pacing, and the kind of hospitality where kids are welcome at the table.",
  "subregion:st-helena":
    "Garden courtyards, shaded patios, and the St. Helena estates along Main Street that welcome families with the same warmth they bring to every guest.",
  "subregion:carneros-sonoma":
    "Cool-climate Carneros on the Sonoma side — open-air estates with wide lawns, bay breezes, and the space for families to spread out and enjoy the afternoon.",
  "subregion:rutherford":
    "Cabernet heartland with garden terraces and outdoor tastings — the Rutherford estates that make room for the whole family.",
  "subregion:calistoga":
    "Casual northern-Napa estates with volcanic-soil gardens, outdoor picnic tables, and a family-friendly vibe that pairs naturally with Calistoga's geysers and hot springs.",
};

// ────────────────────────────────────────────────────────────────────────────
// KID CLUSTER — hero image overrides
// ────────────────────────────────────────────────────────────────────────────

const KID_HERO_OVERRIDES: Partial<Record<ScopeKey, CategoryHeroImage>> = {};

// ────────────────────────────────────────────────────────────────────────────
// KID CLUSTER — FAQs
// ────────────────────────────────────────────────────────────────────────────

export const KID_FAQS: CategoryFaqItem[] = [
  {
    question: "What age range is appropriate for visiting wineries with kids?",
    answer:
      "Most family-friendly wineries welcome children of all ages. Outdoor spaces, lawn games, and picnic areas work well for toddlers through teens. Older kids often enjoy learning about the vineyards and the winemaking process. The key is choosing estates with outdoor seating and room to move — indoor-only tasting rooms with formal seated experiences are better left for adult-only visits.",
  },
  {
    question: "Do wineries offer grape juice or non-alcoholic options for kids?",
    answer:
      "Many family-friendly wineries offer grape juice, sparkling cider, or other non-alcoholic beverages for younger visitors. Some pour these as a mini flight so kids feel included in the tasting experience. Not every winery does this, so check the individual listings on napasonomaguide.com or mention it when making a reservation.",
  },
  {
    question: "Are strollers welcome at wineries?",
    answer:
      "Outdoor tasting areas and garden patios generally accommodate strollers without issue. Indoor tasting rooms can be tighter — some have steps, narrow aisles, or carpeted areas where strollers are impractical. If stroller access matters, call ahead or check the winery's visitor information. Carriers and wraps are often easier for cave tours or vineyard walks.",
  },
  {
    question: "What's the best time of day to visit wineries with kids?",
    answer:
      "Morning appointments — typically the 10:00 or 10:30 slots — are the sweet spot. Kids are freshest, the weather is cooler, the wineries are quieter, and you're done in time for lunch. Afternoon visits on hot summer days are harder on everyone, especially at estates without deep shade.",
  },
  {
    question: "Should I make a reservation when bringing children?",
    answer:
      "Yes, always. Napa is overwhelmingly appointment-only, and Sonoma is trending the same direction. Mention the children when booking — it confirms the winery's family policy, occasionally unlocks a better outdoor table, and helps the host team prepare grape juice or activities.",
  },
  {
    question: "What keeps kids entertained at wineries?",
    answer:
      "The best family-friendly estates have lawn games (bocce, cornhole, giant Jenga), open grassy areas for running, farm animals to visit, or vineyard-adjacent gardens to explore. Some offer coloring sheets or scavenger hunts. Sonoma wineries tend to have more outdoor space and activities than Napa's generally more formal estates.",
  },
  {
    question: "What does 'kid-friendly' actually mean for a winery?",
    answer:
      "On napasonomaguide.com, 'kid-friendly' means the winery has confirmed that children are welcome during regular tasting hours — not just tolerated. It typically means outdoor seating, room to move, and a hospitable attitude toward families. It does not necessarily mean dedicated kids' programs or childcare. Each listing links to its source so visitors can verify the details.",
  },
  {
    question: "Can I bring a picnic lunch if I'm visiting with kids?",
    answer:
      "Many family-friendly wineries allow picnicking on their grounds, especially in Sonoma County. Some require purchasing a bottle of wine to use their picnic area. Pack snacks and lunch — hungry kids and long tasting appointments don't mix well. Check the winery's policy when booking, and look for estates with designated picnic lawns.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// SUSTAINABLE CLUSTER — metadata
// ────────────────────────────────────────────────────────────────────────────

const SUSTAINABLE_META: Record<ScopeKey, CategoryMeta> = {
  hub: {
    title: "Sustainable Wineries in Napa Valley & Sonoma County (2026 Guide)",
    description: "Organic, biodynamic, and certified-sustainable wineries across Napa and Sonoma — the producers farming for the next generation. Browse the full set at napasonomaguide.com.",
    h1: "Sustainable Wineries in Napa Valley & Sonoma County",
    pathSegments: [],
  },
  "valley:napa": {
    title: "Sustainable Wineries in Napa Valley (2026 Guide)",
    description: "Napa Valley's certified-sustainable, organic, and biodynamic producers — from Napa Green estates on the valley floor to biodynamic vineyards on the mountain benches.",
    h1: "Sustainable Wineries in Napa Valley",
    pathSegments: ["napa-valley"],
  },
  "valley:sonoma": {
    title: "Sustainable Wineries in Sonoma County (2026 Guide)",
    description: "Sonoma County's sustainable producers — the county that set California's sustainability standard, with organic vineyards, solar-powered cellars, and certified-green estates.",
    h1: "Sustainable Wineries in Sonoma County",
    pathSegments: ["sonoma-county"],
  },
  "subregion:russian-river-valley": {
    title: "Sustainable Wineries in the Russian River Valley, Sonoma",
    description: "Russian River Valley's sustainably farmed estates — cool-climate pinot and chardonnay producers who farm with the watershed, the redwoods, and the next vintage in mind.",
    h1: "Sustainable Wineries in the Russian River Valley",
    pathSegments: ["russian-river-valley"],
  },
  "subregion:rutherford": {
    title: "Sustainable Wineries in Rutherford, Napa Valley",
    description: "Rutherford's sustainable cabernet producers — the estates farming the benchland's famous alluvial soils with organic, biodynamic, and Napa Green practices.",
    h1: "Sustainable Wineries in Rutherford",
    pathSegments: ["rutherford"],
  },
  "subregion:st-helena": {
    title: "Sustainable Wineries in St. Helena, Napa Valley",
    description: "St. Helena's sustainably farmed wineries — historic estates along Main Street and the valley floor committed to organic vineyards, water conservation, and Napa Green certification.",
    h1: "Sustainable Wineries in St. Helena",
    pathSegments: ["st-helena"],
  },
  "subregion:dry-creek-valley": {
    title: "Sustainable Wineries in Dry Creek Valley, Sonoma",
    description: "Dry Creek Valley's sustainable zinfandel and Rhône producers — small family estates farming old vines with dry-farming techniques, organic practices, and deep respect for the land.",
    h1: "Sustainable Wineries in Dry Creek Valley",
    pathSegments: ["dry-creek-valley"],
  },
  "subregion:sonoma-valley": {
    title: "Sustainable Wineries in the Sonoma Valley AVA",
    description: "Sustainable estates in the Sonoma Valley AVA — from the historic plaza through Glen Ellen and Kenwood, where organic viticulture and certified-green practices are woven into the region's identity.",
    h1: "Sustainable Wineries in the Sonoma Valley AVA",
    pathSegments: ["sonoma-valley"],
  },
  "subregion:stags-leap-district": {
    title: "Sustainable Wineries in the Stags Leap District, Napa Valley",
    description: "The Stags Leap District's sustainably farmed cabernet estates — between the Silverado Trail and the volcanic palisades, where some of Napa's most iconic producers farm with the future in mind.",
    h1: "Sustainable Wineries in the Stags Leap District",
    pathSegments: ["stags-leap-district"],
  },
  "subregion:oakville": {
    title: "Sustainable Wineries in Oakville, Napa Valley",
    description: "Oakville's sustainable cabernet producers — the appellation's gravelly benchland estates farming with organic and Napa Green practices at the heart of the valley.",
    h1: "Sustainable Wineries in Oakville",
    pathSegments: ["oakville"],
  },
  "subregion:calistoga": {
    title: "Sustainable Wineries in Calistoga, Napa Valley",
    description: "Calistoga's sustainably farmed estates — volcanic soils, geothermal energy, and the northern-Napa producers who've built sustainability into their identity from the ground up.",
    h1: "Sustainable Wineries in Calistoga",
    pathSegments: ["calistoga"],
  },
  "subregion:carneros-sonoma": {
    title: "Sustainable Wineries in Carneros (Sonoma)",
    description: "Carneros sustainable estates on the Sonoma side — cool-climate pinot and chardonnay producers farming with bay winds, fog, and certified-green practices.",
    h1: "Sustainable Wineries in Carneros (Sonoma)",
    pathSegments: ["carneros-sonoma"],
  },
  "subregion:alexander-valley": {
    title: "Sustainable Wineries in Alexander Valley, Sonoma",
    description: "Alexander Valley's sustainable producers — warm-climate cabernet and Rhône estates farming the benchlands with organic practices and Sonoma County's deep sustainability roots.",
    h1: "Sustainable Wineries in Alexander Valley",
    pathSegments: ["alexander-valley"],
  },
  "subregion:carneros-napa": {
    title: "Sustainable Wineries in Carneros (Napa)",
    description: "Carneros sustainable estates on the Napa side — sparkling wine and pinot producers working with the bay's influence, fog-cooled vineyards, and certified-green farming.",
    h1: "Sustainable Wineries in Carneros (Napa)",
    pathSegments: ["carneros-napa"],
  },
};

// ────────────────────────────────────────────────────────────────────────────
// SUSTAINABLE CLUSTER — decks
// ────────────────────────────────────────────────────────────────────────────

const SUSTAINABLE_DECKS: Record<ScopeKey, string> = {
  hub:
    "Organic vineyards, biodynamic farming, Napa Green certification, solar-powered cellars — the Napa and Sonoma producers building wine for the next generation.",
  "valley:napa":
    "From Napa Green estates on the valley floor to biodynamic vineyards on Howell Mountain — the Napa Valley producers who farm with the future in mind.",
  "valley:sonoma":
    "Sonoma set California's sustainability standard. These are the county's organic, biodynamic, and certified-green producers — farming as deliberately as they make wine.",
  "subregion:russian-river-valley":
    "Cool-climate pinot and chardonnay producers farming with the watershed, the redwoods, and the long view — Russian River Valley's sustainably farmed estates.",
  "subregion:rutherford":
    "Cabernet benchland farmed with organic and Napa Green practices — Rutherford's sustainable producers working some of Napa's most storied soils.",
  "subregion:st-helena":
    "Historic estates along Main Street and the valley floor committed to organic vineyards, water conservation, and the long-term health of St. Helena's land.",
  "subregion:dry-creek-valley":
    "Old-vine zinfandel, dry-farming traditions, and the small Dry Creek Valley producers who've been farming sustainably since before certification programs existed.",
  "subregion:sonoma-valley":
    "From the Sonoma Plaza north through Glen Ellen — the valley's certified-green estates where organic viticulture is part of the region's founding character.",
  "subregion:stags-leap-district":
    "Between the Silverado Trail and the volcanic palisades — the Stags Leap cabernet estates farming sustainably on some of California's most iconic vineyard land.",
  "subregion:oakville":
    "Gravelly benchland, cabernet heartland, and the Oakville estates farming with organic and Napa Green practices at the center of the valley.",
  "subregion:calistoga":
    "Volcanic soils, geothermal energy, and the northern-Napa producers who've woven sustainability into their identity from the ground up.",
  "subregion:carneros-sonoma":
    "Bay-influenced pinot and chardonnay estates on the Sonoma side of Carneros — farming with fog, wind, and certified-green practices.",
  "subregion:alexander-valley":
    "Warm-climate cabernet and Rhône country — Alexander Valley's sustainable producers farming the benchlands with organic practices and deep roots.",
  "subregion:carneros-napa":
    "Cool-climate sparkling wine and pinot producers on the Napa side of Carneros — certified-green estates working with the bay's influence.",
};

// ────────────────────────────────────────────────────────────────────────────
// SUSTAINABLE CLUSTER — hero image overrides
// ────────────────────────────────────────────────────────────────────────────

const SUSTAINABLE_HERO_OVERRIDES: Partial<Record<ScopeKey, CategoryHeroImage>> = {};

// ────────────────────────────────────────────────────────────────────────────
// SUSTAINABLE CLUSTER — FAQs
// ────────────────────────────────────────────────────────────────────────────

export const SUSTAINABLE_FAQS: CategoryFaqItem[] = [
  {
    question: "What does 'sustainable' mean for a winery?",
    answer:
      "Sustainable viticulture covers a spectrum of practices — from water conservation and habitat restoration to organic farming and renewable energy. In Napa and Sonoma, the most common frameworks are Napa Green (Napa Valley), the California Sustainable Winegrowing Alliance (CSWA), and SIP Certified (Sonoma). Each has specific requirements around pest management, water use, energy, and soil health.",
  },
  {
    question: "What's the difference between organic, biodynamic, and sustainable?",
    answer:
      "Organic certification (USDA/CCOF) prohibits synthetic pesticides and fertilizers in the vineyard. Biodynamic farming (Demeter certified) goes further — it treats the vineyard as a self-sustaining ecosystem, with specific preparations, planting calendars, and holistic land management. 'Sustainable' is the broadest term, covering everything from energy use to water conservation to social practices, and may or may not include organic or biodynamic methods.",
  },
  {
    question: "Does sustainable farming affect how the wine tastes?",
    answer:
      "Many winemakers believe sustainable farming produces more expressive wine — healthier soils grow healthier vines, which produce more complex fruit. Blind-tasting studies are inconclusive, but the correlation is strong: many of Napa and Sonoma's most acclaimed producers happen to be sustainably farmed. At minimum, sustainable practices produce wine that reflects its specific site more clearly.",
  },
  {
    question: "How can I verify a winery's sustainability claims?",
    answer:
      "Look for third-party certifications: Napa Green, CSWA Certified Sustainable, SIP Certified, USDA Organic, or Demeter Biodynamic. These require audits and ongoing compliance. Self-described 'sustainable' without certification is common and often genuine, but it's not independently verified. Each winery listing on napasonomaguide.com links to its sustainability source when available.",
  },
  {
    question: "What certifications are most common in Napa and Sonoma?",
    answer:
      "In Napa Valley, the dominant framework is Napa Green, which certifies both the vineyard (Napa Green Land) and the winery building (Napa Green Winery). In Sonoma County, the CSWA Certified Sustainable and SIP Certified programs are most prevalent. Organic certification through CCOF is common in both valleys. Biodynamic certification through Demeter is rarer but represented by some high-profile estates.",
  },
  {
    question: "Are sustainable wines more expensive?",
    answer:
      "Not necessarily. Sustainable farming can reduce costs over time (less chemical input, lower water bills, healthier vines that need less intervention). Some of the most affordable producers in both valleys are sustainably certified. That said, many premium estates are also sustainable — the correlation runs in both directions. Sustainability is about farming practice, not price tier.",
  },
  {
    question: "Can I visit these wineries and see the sustainable practices firsthand?",
    answer:
      "Many sustainably farmed estates offer vineyard tours that highlight their practices — solar panels, composting operations, cover crops between vine rows, insect hotels, owl boxes for rodent control. Some run dedicated sustainability-focused tours. Mention your interest when booking — several producers will tailor the experience to showcase their farming philosophy.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Public lookup API
// ────────────────────────────────────────────────────────────────────────────

const META_MAP: Record<WineryAmenity, Record<ScopeKey, CategoryMeta>> = {
  dog: DOG_META,
  kid: KID_META,
  sustainable: SUSTAINABLE_META,
};

const DECK_MAP: Record<WineryAmenity, Record<ScopeKey, string>> = {
  dog: DOG_DECKS,
  kid: KID_DECKS,
  sustainable: SUSTAINABLE_DECKS,
};

const FAQ_MAP: Record<WineryAmenity, CategoryFaqItem[]> = {
  dog: DOG_FAQS,
  kid: KID_FAQS,
  sustainable: SUSTAINABLE_FAQS,
};

const HERO_MAP: Record<WineryAmenity, Partial<Record<ScopeKey, CategoryHeroImage>>> = {
  dog: DOG_HERO_OVERRIDES,
  kid: KID_HERO_OVERRIDES,
  sustainable: SUSTAINABLE_HERO_OVERRIDES,
};

export function getCategoryMeta(
  amenity: WineryAmenity,
  scope: CategoryScope
): CategoryMeta | null {
  const key = scopeKeyOf(scope);
  return META_MAP[amenity]?.[key] ?? null;
}

export function getCategoryDeck(
  amenity: WineryAmenity,
  scope: CategoryScope
): string | null {
  const key = scopeKeyOf(scope);
  return DECK_MAP[amenity]?.[key] ?? null;
}

export function getCategoryFaqs(amenity: WineryAmenity): CategoryFaqItem[] {
  return FAQ_MAP[amenity] ?? [];
}

export function getCategoryHeroOverride(
  amenity: WineryAmenity,
  scope: CategoryScope
): CategoryHeroImage | null {
  const key = scopeKeyOf(scope);
  return HERO_MAP[amenity]?.[key] ?? null;
}

export function getDefinedScopes(amenity: WineryAmenity): ScopeKey[] {
  return Object.keys(META_MAP[amenity] ?? {}) as ScopeKey[];
}
