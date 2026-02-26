import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { eq, like, gte, asc, desc, sql, and, count } from "drizzle-orm";
import { WineryCard } from "@/components/directory/WineryCard";
import { WineryFilters } from "@/components/directory/WineryFilters";
import { WinerySearch } from "@/components/directory/WinerySearch";
import { Pagination } from "@/components/directory/Pagination";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Wineries | Wine Country Guide",
  description: "Explore wineries across Napa and Sonoma Valleys with filters for region, price, rating, and more.",
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
  const price = params.price || "";
  const rating = params.rating || "";
  const reservation = params.reservation || "";
  const dog = params.dog || "";
  const picnic = params.picnic || "";
  const sort = params.sort || "rating";

  // Build conditions
  const conditions = [];
  if (q) {
    conditions.push(like(wineries.name, `%${q}%`));
  }
  if (valley) {
    conditions.push(eq(subRegions.valley, valley as "napa" | "sonoma"));
  }
  if (region) {
    conditions.push(eq(subRegions.slug, region));
  }
  if (price) {
    conditions.push(eq(wineries.priceLevel, parseInt(price)));
  }
  if (rating) {
    conditions.push(gte(wineries.aggregateRating, parseFloat(rating)));
  }
  if (reservation === "false") {
    conditions.push(eq(wineries.reservationRequired, false));
  }
  if (dog === "true") {
    conditions.push(eq(wineries.dogFriendly, true));
  }
  if (picnic === "true") {
    conditions.push(eq(wineries.picnicFriendly, true));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Sort — curated first, then by selected sort
  const secondaryOrder = {
    rating: desc(wineries.aggregateRating),
    name: asc(wineries.name),
    "price-asc": asc(wineries.priceLevel),
    "price-desc": desc(wineries.priceLevel),
    reviews: desc(wineries.totalRatings),
  }[sort] || desc(wineries.aggregateRating);

  // Count
  const [{ total }] = await db
    .select({ total: count() })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(where);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
      heroImageUrl: wineries.heroImageUrl,
      subRegion: subRegions.name,
      valley: subRegions.valley,
      curated: wineries.curated,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(where)
    .orderBy(desc(wineries.curated), secondaryOrder)
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  // Sub regions for filter
  const allSubRegions = await db
    .select({ slug: subRegions.slug, name: subRegions.name, valley: subRegions.valley })
    .from(subRegions)
    .orderBy(asc(subRegions.valley), asc(subRegions.name));

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
        <WineryFilters subRegions={allSubRegions} />
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
        <Pagination currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
