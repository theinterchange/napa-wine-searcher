import { db } from "@/db";
import { wineries, subRegions, wines, wineTypes, tastingExperiences } from "@/db/schema";
import { eq, gte, lte, asc, desc, sql, and, count, inArray } from "drizzle-orm";
import Link from "next/link";
import { Route } from "lucide-react";
import { unstable_cache } from "next/cache";
import { WineryCard } from "@/components/directory/WineryCard";
import { WineryFilters } from "@/components/directory/WineryFilters";
import { Pagination } from "@/components/directory/Pagination";
import { TASTING_PRICE_TIERS } from "@/lib/filters";
import { wineryRankingScore } from "@/lib/winery-ranking";
import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

// Cached reads for filter scaffolding — independent of search params, rarely
// change. Hot path goes from ~3 Turso roundtrips to 0 on warm cache.
const getAllSubRegions = unstable_cache(
  () =>
    db
      .select({ slug: subRegions.slug, name: subRegions.name, valley: subRegions.valley })
      .from(subRegions)
      .orderBy(asc(subRegions.valley), asc(subRegions.name)),
  ["wineries-page:sub-regions"],
  { revalidate: 3600, tags: ["sub-regions"] }
);

const getWineTypeCounts = unstable_cache(
  () =>
    db
      .select({
        id: wineTypes.id,
        name: wineTypes.name,
        count: count(),
      })
      .from(wineTypes)
      .innerJoin(wines, eq(wines.wineTypeId, wineTypes.id))
      .groupBy(wineTypes.id, wineTypes.name)
      .orderBy(desc(count()))
      .having(sql`count(*) > 0`),
  ["wineries-page:wine-type-counts"],
  { revalidate: 3600, tags: ["wine-types"] }
);

const getAllWineTypes = unstable_cache(
  () => db.select({ id: wineTypes.id, name: wineTypes.name }).from(wineTypes),
  ["wineries-page:all-wine-types"],
  { revalidate: 3600, tags: ["wine-types"] }
);

// Varietal → winery IDs (depends on selected slugs, but rarely changes)
const getVarietalWineryIds = unstable_cache(
  async (slugs: string[]) => {
    const allTypes = await getAllWineTypes();
    const matchingTypeIds = allTypes
      .filter((t) => slugs.includes(t.name.toLowerCase().replace(/\s+/g, "-")))
      .map((t) => t.id);
    if (matchingTypeIds.length === 0) return [] as number[];
    const matched = await db
      .selectDistinct({ wineryId: wines.wineryId })
      .from(wines)
      .where(inArray(wines.wineTypeId, matchingTypeIds));
    return matched.map((m) => m.wineryId);
  },
  ["wineries-page:varietal-ids"],
  { revalidate: 3600, tags: ["wineries", "wines"] }
);

// Tasting price → winery IDs
const getTastingPriceWineryIds = unstable_cache(
  async (tierKeys: string[]) => {
    const tpConditions = tierKeys
      .map((key) => {
        const tier = TASTING_PRICE_TIERS.find((t) => t.key === key);
        if (!tier) return null;
        return and(
          gte(tastingExperiences.price, tier.min),
          lte(tastingExperiences.price, tier.max)
        );
      })
      .filter(Boolean);
    if (tpConditions.length === 0) return [] as number[];
    const matched = await db
      .selectDistinct({ wineryId: tastingExperiences.wineryId })
      .from(tastingExperiences)
      .where(
        tpConditions.length === 1
          ? tpConditions[0]!
          : sql`(${sql.join(
              tpConditions.map((c) => sql`(${c})`),
              sql` OR `
            )})`
      );
    return matched.map((m) => m.wineryId);
  },
  ["wineries-page:tasting-price-ids"],
  { revalidate: 3600, tags: ["wineries", "tasting-experiences"] }
);

// All filters resolved to plain values — fed into the cached page-query helper.
type DirectoryFilters = {
  valleys: string[];
  regions: string[];
  rating: number | null;
  amenities: string[];
  intersectIds: number[] | null; // null = no intersection filter; [] = no matches
  sort: string;
  page: number;
};

// Cached page-results query. Keyed by all filter inputs + sort + page so every
// distinct filter combo is memoized. Inside, we rebuild Drizzle conditions from
// the plain inputs (Drizzle SQL fragments aren't serializable across the cache
// boundary).
const getDirectoryPage = unstable_cache(
  async (filters: DirectoryFilters) => {
    const { valleys, regions, rating, amenities, intersectIds, sort, page } = filters;
    const conditions: ReturnType<typeof and>[] = [];

    if (valleys.length === 1) {
      conditions.push(eq(subRegions.valley, valleys[0] as "napa" | "sonoma"));
    } else if (valleys.length > 1) {
      conditions.push(inArray(subRegions.valley, valleys as ("napa" | "sonoma")[]));
    }
    if (regions.length === 1) {
      conditions.push(eq(subRegions.slug, regions[0]));
    } else if (regions.length > 1) {
      conditions.push(inArray(subRegions.slug, regions));
    }
    if (rating !== null) {
      conditions.push(gte(wineries.aggregateRating, rating));
    }
    for (const a of amenities) {
      switch (a) {
        case "dog":
          conditions.push(eq(wineries.dogFriendly, true));
          break;
        case "kid":
          conditions.push(eq(wineries.kidFriendly, true));
          break;
        case "picnic":
          conditions.push(eq(wineries.picnicFriendly, true));
          break;
        case "walkin":
          conditions.push(eq(wineries.reservationRequired, false));
          break;
        case "sustainable":
          conditions.push(eq(wineries.sustainableFarming, true));
          break;
      }
    }
    if (intersectIds !== null) {
      if (intersectIds.length === 0) {
        conditions.push(eq(wineries.id, -1));
      } else {
        conditions.push(inArray(wineries.id, intersectIds));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const secondaryOrder = {
      rating: desc(wineries.aggregateRating),
      name: asc(wineries.name),
      "price-asc": asc(wineries.priceLevel),
      "price-desc": desc(wineries.priceLevel),
      reviews: desc(wineries.totalRatings),
    }[sort] || sql`${wineryRankingScore} DESC`;

    // Phase 1 — count
    const [{ total }] = await db
      .select({ total: count() })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(where);

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const clampedPage = Math.min(page, Math.max(1, totalPages));

    // Phase 2 — results
    const results = await db
      .select({
        id: wineries.id,
        slug: wineries.slug,
        name: wineries.name,
        shortDescription: wineries.shortDescription,
        city: wineries.city,
        priceLevel: wineries.priceLevel,
        aggregateRating: wineries.aggregateRating,
        totalRatings: wineries.totalRatings,
        reservationRequired: wineries.reservationRequired,
        dogFriendly: wineries.dogFriendly,
        picnicFriendly: wineries.picnicFriendly,
        kidFriendly: wineries.kidFriendly,
        kidFriendlyConfidence: wineries.kidFriendlyConfidence,
        tastingPriceMin: wineries.tastingPriceMin,
        heroImageUrl: wineries.heroImageUrl,
        subRegion: subRegions.name,
        subRegionSlug: subRegions.slug,
        valley: subRegions.valley,
        curated: wineries.curated,
        spotlightYearMonth: wineries.spotlightYearMonth,
      })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(where)
      .orderBy(secondaryOrder)
      .limit(PAGE_SIZE)
      .offset((clampedPage - 1) * PAGE_SIZE);

    return { total, totalPages, clampedPage, results };
  },
  ["wineries-page:directory-results"],
  { revalidate: 60, tags: ["wineries"] }
);

export const metadata: Metadata = {
  title: "Best Napa & Sonoma Wineries — Tastings, Reservations, Dog-Friendly",
  description:
    "Compare 225+ Napa Valley and Sonoma County wineries — tasting prices, reservation policies, dog-friendly venues, and signature varietals. Plan a tasting day.",
  openGraph: {
    title: "Best Napa & Sonoma Wineries — Tastings, Reservations, Dog-Friendly",
    description:
      "Compare 225+ Napa Valley and Sonoma County wineries — tasting prices, reservation policies, dog-friendly venues, and signature varietals.",
    url: `${BASE_URL}/wineries`,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Best Napa & Sonoma Wineries — Tastings, Reservations, Dog-Friendly",
    description:
      "Compare 225+ Napa Valley and Sonoma County wineries — tasting prices, reservations, dog-friendly venues.",
  },
  alternates: {
    canonical: `${BASE_URL}/wineries`,
  },
};

const PAGE_SIZE = 12;

export default async function WineriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const valley = params.valley || "";
  const region = params.region || "";
  const rating = params.rating || "";
  const sort = params.sort || "";
  const varietal = params.varietal || "";
  const tastingPrice = params.tastingPrice || "";
  const amenities = params.amenities || "";

  // Resolve subquery filters (varietal + tasting price → winery IDs) in
  // parallel. Each is independently cached.
  const [varietalWineryIds, tastingPriceWineryIds] = await Promise.all([
    varietal
      ? getVarietalWineryIds(varietal.split(",").filter(Boolean).sort())
      : Promise.resolve(null),
    tastingPrice
      ? getTastingPriceWineryIds(tastingPrice.split(",").filter(Boolean).sort())
      : Promise.resolve(null),
  ]);

  // Intersect ID sets from sub-filters → single sorted array (or null if no
  // sub-filters were applied; empty array means "no matches").
  let intersectIds: number[] | null = null;
  const idFilters = [varietalWineryIds, tastingPriceWineryIds].filter(
    (ids): ids is number[] => ids !== null
  );
  if (idFilters.length > 0) {
    intersectIds = idFilters
      .reduce((acc, ids) => {
        const set = new Set(ids);
        return acc.filter((id) => set.has(id));
      })
      .slice()
      .sort((a, b) => a - b);
  }

  // Cached page query + filter scaffolding in parallel.
  const [pageData, allSubRegions, wineTypeCounts] = await Promise.all([
    getDirectoryPage({
      valleys: valley.split(",").filter(Boolean).sort(),
      regions: region.split(",").filter(Boolean).sort(),
      rating: rating ? parseFloat(rating) : null,
      amenities: amenities.split(",").filter(Boolean).sort(),
      intersectIds,
      sort,
      page,
    }),
    getAllSubRegions(),
    getWineTypeCounts(),
  ]);

  const { total, totalPages, clampedPage, results } = pageData;

  // Compute featured flag: only wineries with a spotlight slot get the
  // "Featured" badge. `curated` is too broad — it's set on most rows and
  // also drives ranking, so it can't double as a scarcity signal.
  const resultsWithFeatured = results.map((w) => ({
    ...w,
    featured: !!w.spotlightYearMonth,
  }));

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Wineries in Napa Valley and Sonoma County",
    description: "Explore 225+ wineries across Napa Valley and Sonoma County with ratings, tasting prices, and reservation info.",
    numberOfItems: total,
    itemListElement: results.slice(0, 10).map((w, i) => ({
      "@type": "ListItem",
      position: (clampedPage - 1) * PAGE_SIZE + i + 1,
      name: w.name,
      url: `${BASE_URL}/wineries/${w.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <div className="mb-5 pb-4 sm:mb-10 sm:pb-7 border-b border-[var(--rule)]">
        <span className="kicker">The Directory</span>
        <h1 className="editorial-h2 text-[28px] sm:text-[44px] lg:text-[52px] mt-2 sm:mt-3">
          Browse the <em>directory.</em>
        </h1>
        <p
          className="hidden sm:block mt-5 max-w-[52ch] text-[16px] sm:text-[17px] leading-[1.5] text-[var(--ink-2)]"
          style={{ fontFamily: "var(--font-serif-text)", textWrap: "pretty" }}
        >
          Every winery in Napa and Sonoma — filter to fit.
        </p>
      </div>

      <div className="mb-5 sm:mb-8">
        <WineryFilters subRegions={allSubRegions} wineTypes={wineTypeCounts} />
      </div>

      {resultsWithFeatured.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resultsWithFeatured.map((w, i) => (
            <WineryCard key={w.id} winery={w} priority={i === 0} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="font-[var(--font-serif-text)] text-[18px] text-[var(--ink-3)]">
            No wineries match your filters.
          </p>
        </div>
      )}

      <div className="mt-10">
        <Pagination currentPage={clampedPage} totalPages={totalPages} />
      </div>

      <div className="mt-16 pt-8 border-t border-[var(--rule-soft)] text-center">
        <Link
          href="/itineraries"
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] border-b border-[var(--brass)] pb-1 hover:text-[var(--brass-2)] transition-colors"
        >
          <Route className="h-3.5 w-3.5" />
          Explore Itineraries →
        </Link>
      </div>
    </div>
  );
}
