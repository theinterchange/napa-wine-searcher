/**
 * Static list of the 17 sub-regions, kept in sync with
 * `src/db/seed/data/sub-regions.json`. Used by the builder's Region step
 * to avoid an extra API call — the slugs rarely change.
 *
 * Blurbs describe the setting, what the AVA is known for, and the main
 * varietals. No winery name-dropping — users planning a trip rarely
 * recognize names cold, so we lean on landscape and grape instead.
 */

export interface SubRegionOption {
  slug: string;
  name: string;
  valley: "napa" | "sonoma";
  blurb: string;
}

export const SUB_REGIONS: SubRegionOption[] = [
  {
    slug: "calistoga",
    name: "Calistoga",
    valley: "napa",
    blurb:
      "Northernmost Napa — hot springs, volcanic soils, warmer days. Bold Cabernet and a bit of Zinfandel.",
  },
  {
    slug: "st-helena",
    name: "St. Helena",
    valley: "napa",
    blurb:
      "Napa's walkable main-street town. Classic valley-floor Bordeaux varietals — Cabernet Sauvignon, Merlot.",
  },
  {
    slug: "rutherford",
    name: "Rutherford",
    valley: "napa",
    blurb:
      "Flat valley floor east and west of the Trail. Structured Cabernet — the famous \u201CRutherford dust\u201D.",
  },
  {
    slug: "oakville",
    name: "Oakville",
    valley: "napa",
    blurb:
      "Heart of the valley floor. Home to the highest-priced Cabernet in America.",
  },
  {
    slug: "yountville",
    name: "Yountville",
    valley: "napa",
    blurb:
      "Tiny walkable town with a Michelin-starred restaurant scene. Small, high-touch boutique estates.",
  },
  {
    slug: "stags-leap-district",
    name: "Stags Leap District",
    valley: "napa",
    blurb:
      "Rolling hills along the Silverado Trail. Silky, structured Cabernet — soft tannins, approachable.",
  },
  {
    slug: "atlas-peak",
    name: "Atlas Peak",
    valley: "napa",
    blurb:
      "Volcanic mountain AVA east of Napa. High elevation, age-worthy Cabernet with real grip.",
  },
  {
    slug: "mount-veeder",
    name: "Mount Veeder",
    valley: "napa",
    blurb:
      "Forested Mayacamas ridgeline above Napa. Intense, concentrated mountain Cabernet and Chardonnay.",
  },
  {
    slug: "carneros-napa",
    name: "Carneros (Napa)",
    valley: "napa",
    blurb:
      "Cool, windy grasslands at the bay's edge. Pinot Noir, Chardonnay, and sparkling wine.",
  },
  {
    slug: "howell-mountain",
    name: "Howell Mountain",
    valley: "napa",
    blurb:
      "Above-the-fog eastern ridge. Dense, age-worthy Cabernet built for the cellar.",
  },
  {
    slug: "sonoma-valley",
    name: "Sonoma Valley",
    valley: "sonoma",
    blurb:
      "Historic valley south of Kenwood — the birthplace of California wine. Mixed varietals; broad personality.",
  },
  {
    slug: "russian-river-valley",
    name: "Russian River Valley",
    valley: "sonoma",
    blurb:
      "Cool, fog-kissed river valley west of Healdsburg. World-class Pinot Noir and Chardonnay.",
  },
  {
    slug: "dry-creek-valley",
    name: "Dry Creek Valley",
    valley: "sonoma",
    blurb:
      "Warm inland valley north of Healdsburg. Zinfandel country, plus Sauvignon Blanc and old-vine field blends.",
  },
  {
    slug: "alexander-valley",
    name: "Alexander Valley",
    valley: "sonoma",
    blurb:
      "Warm river valley further north. Approachable Cabernet and crisp Sauvignon Blanc.",
  },
  {
    slug: "carneros-sonoma",
    name: "Carneros (Sonoma)",
    valley: "sonoma",
    blurb:
      "Sonoma's edge of the shared Carneros AVA. Cool-climate Pinot, Chardonnay, and sparkling.",
  },
  {
    slug: "bennett-valley",
    name: "Bennett Valley",
    valley: "sonoma",
    blurb:
      "Quiet, cool-moderate AVA between Sonoma and Santa Rosa. Bordeaux varietals and hillside Syrah.",
  },
  {
    slug: "petaluma-gap",
    name: "Petaluma Gap",
    valley: "sonoma",
    blurb:
      "Windswept coastal corridor at Sonoma's southern edge. Cool-climate Pinot Noir and Syrah.",
  },
];
