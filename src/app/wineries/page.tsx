import { db } from "@/db";
import { wineries, subRegions, wines, wineTypes, tastingExperiences } from "@/db/schema";
import { eq, like, gte, lte, asc, desc, sql, and, count, inArray } from "drizzle-orm";
import Link from "next/link";
import { Route } from "lucide-react";
import { WineryCard } from "@/components/directory/WineryCard";
import { WineryFilters } from "@/components/directory/WineryFilters";
import { WinerySearch } from "@/components/directory/WinerySearch";
import { Pagination } from "@/components/directory/Pagination";
import { TASTING_PRICE_TIERS } from "@/lib/filters";
import { wineryRankingScore } from "@/lib/winery-ranking";
import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Browse Wineries | Napa Sonoma Guide",
  description:
    "Explore wineries across Napa and Sonoma Valleys with filters for region, price, rating, and more.",
  openGraph: {
    title: "Browse Wineries | Napa Sonoma Guide",
    description:
      "Explore wineries across Napa and Sonoma Valleys with filters for region, price, rating, and more.",
    url: `${BASE_URL}/wineries`,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Browse Wineries | Napa Sonoma Guide",
    description:
      "Explore wineries across Napa and Sonoma Valleys with filters for region, price, rating, and more.",
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
  const q = params.q || "";
  const valley = params.valley || "";
  const region = params.region || "";
  const rating = params.rating || "";
  const sort = params.sort || "";
  const varietal = params.varietal || "";
  const tastingPrice = params.tastingPrice || "";
  const amenities = params.amenities || "";

  // Build conditions
  const conditions = [];
  if (q) {
    conditions.push(like(wineries.name, `%${q}%`));
  }
  if (valley) {
    const valleys = valley.split(",").filter(Boolean);
    if (valleys.length === 1) {
      conditions.push(eq(subRegions.valley, valleys[0] as "napa" | "sonoma"));
    } else if (valleys.length > 1) {
      conditions.push(inArray(subRegions.valley, valleys as ("napa" | "sonoma")[]));
    }
  }
  if (region) {
    const regions = region.split(",").filter(Boolean);
    if (regions.length === 1) {
      conditions.push(eq(subRegions.slug, regions[0]));
    } else if (regions.length > 1) {
      conditions.push(inArray(subRegions.slug, regions));
    }
  }
  if (rating) {
    conditions.push(gte(wineries.aggregateRating, parseFloat(rating)));
  }

  // Amenities filter
  if (amenities) {
    const amenityList = amenities.split(",").filter(Boolean);
    for (const a of amenityList) {
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
  }

  // Varietal filter: find winery IDs that have matching wine types
  let varietalWineryIds: number[] | null = null;
  if (varietal) {
    const slugs = varietal.split(",").filter(Boolean);
    // Convert slugs back to names for matching
    const allTypes = await db.select({ id: wineTypes.id, name: wineTypes.name }).from(wineTypes);
    const matchingTypeIds = allTypes
      .filter((t) => slugs.includes(t.name.toLowerCase().replace(/\s+/g, "-")))
      .map((t) => t.id);

    if (matchingTypeIds.length > 0) {
      const matched = await db
        .selectDistinct({ wineryId: wines.wineryId })
        .from(wines)
        .where(inArray(wines.wineTypeId, matchingTypeIds));
      varietalWineryIds = matched.map((m) => m.wineryId);
    } else {
      varietalWineryIds = [];
    }
  }

  // Tasting price filter: find winery IDs with tastings in selected price ranges
  let tastingPriceWineryIds: number[] | null = null;
  if (tastingPrice) {
    const keys = tastingPrice.split(",").filter(Boolean);
    const tpConditions = keys
      .map((key) => {
        const tier = TASTING_PRICE_TIERS.find((t) => t.key === key);
        if (!tier) return null;
        return and(
          gte(tastingExperiences.price, tier.min),
          lte(tastingExperiences.price, tier.max)
        );
      })
      .filter(Boolean);

    if (tpConditions.length > 0) {
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
      tastingPriceWineryIds = matched.map((m) => m.wineryId);
    } else {
      tastingPriceWineryIds = [];
    }
  }

  // Intersect winery ID sets from sub-filters
  const idFilters = [varietalWineryIds, tastingPriceWineryIds].filter(
    (ids): ids is number[] => ids !== null
  );
  if (idFilters.length > 0) {
    const intersection = idFilters.reduce((acc, ids) => {
      const set = new Set(ids);
      return acc.filter((id) => set.has(id));
    });
    if (intersection.length > 0) {
      conditions.push(inArray(wineries.id, intersection));
    } else {
      // No wineries match — push impossible condition
      conditions.push(eq(wineries.id, -1));
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Ranking score imported from @/lib/winery-ranking

  // Sort — default uses ranking score, user can override
  const secondaryOrder = {
    rating: desc(wineries.aggregateRating),
    name: asc(wineries.name),
    "price-asc": asc(wineries.priceLevel),
    "price-desc": desc(wineries.priceLevel),
    reviews: desc(wineries.totalRatings),
  }[sort] || sql`${wineryRankingScore} DESC`;

  // Count
  const [{ total }] = await db
    .select({ total: count() })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(where);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const clampedPage = Math.min(page, Math.max(1, totalPages));

  // If the requested page exceeds the max, show the last valid page
  // (results will reflect the clamped page; pagination will show correctly)

  // Fetch
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
      heroImageUrl: wineries.heroImageUrl,
      subRegion: subRegions.name,
      subRegionSlug: subRegions.slug,
      valley: subRegions.valley,
      curated: wineries.curated,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(where)
    .orderBy(secondaryOrder)
    .limit(PAGE_SIZE)
    .offset((clampedPage - 1) * PAGE_SIZE);

  // Sub regions for filter
  const allSubRegions = await db
    .select({ slug: subRegions.slug, name: subRegions.name, valley: subRegions.valley })
    .from(subRegions)
    .orderBy(asc(subRegions.valley), asc(subRegions.name));

  // Wine types with counts for varietal filter
  const wineTypeCounts = await db
    .select({
      id: wineTypes.id,
      name: wineTypes.name,
      count: count(),
    })
    .from(wineTypes)
    .innerJoin(wines, eq(wines.wineTypeId, wineTypes.id))
    .groupBy(wineTypes.id, wineTypes.name)
    .orderBy(desc(count()))
    .having(sql`count(*) > 0`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Browse Wineries</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          {total} {total === 1 ? "winery" : "wineries"} found
        </p>
      </div>

      <div className="mb-6">
        <WinerySearch />
      </div>

      <div className="mb-8">
        <WineryFilters subRegions={allSubRegions} wineTypes={wineTypeCounts} />
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((w) => (
            <WineryCard key={w.id} winery={w} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-lg text-[var(--muted-foreground)]">
            No wineries match your filters.
          </p>
        </div>
      )}

      <div className="mt-8">
        <Pagination currentPage={clampedPage} totalPages={totalPages} />
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/day-trips"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)] hover:underline"
        >
          <Route className="h-4 w-4" />
          Explore Day Trip Routes
        </Link>
      </div>
    </div>
  );
}
