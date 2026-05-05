import { db } from "@/db";
import { collections, collectionItems, wineries, subRegions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { WineryCard } from "@/components/directory/WineryCard";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const [collection] = await db
    .select({ name: collections.name, description: collections.description })
    .from(collections)
    .where(eq(collections.shareCode, code))
    .limit(1);

  if (!collection) {
    return { title: "Collection Not Found" };
  }

  return {
    title: `${collection.name} | Napa Sonoma Guide`,
    description: collection.description || `A curated winery collection on Napa Sonoma Guide.`,
    openGraph: {
      title: `${collection.name} — Winery Collection`,
      description: collection.description || `A curated winery collection on Napa Sonoma Guide.`,
      type: "website",
    },
    alternates: {
      canonical: `/shared/collection/${code}`,
    },
  };
}

export default async function SharedCollectionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.shareCode, code))
    .limit(1);

  if (!collection) notFound();

  const items = await db
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
      valley: subRegions.valley,
      curated: wineries.curated,
    })
    .from(collectionItems)
    .innerJoin(wineries, eq(collectionItems.wineryId, wineries.id))
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(eq(collectionItems.collectionId, collection.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 pb-5 border-b border-[var(--rule)]">
        <span className="kicker flex items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5 text-[var(--brass)]" />
          Shared collection
        </span>
        <h1 className="editorial-h2 text-[28px] sm:text-[36px] mt-2">{collection.name}</h1>
        {collection.description && (
          <p className="mt-3 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] max-w-[60ch]">
            {collection.description}
          </p>
        )}
        <p className="mt-3 font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)]">
          {items.length} {items.length === 1 ? "winery" : "wineries"}
        </p>
      </header>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((w) => (
            <WineryCard key={w.id} winery={w} />
          ))}
        </div>
      ) : (
        <div className="card-flat p-12 text-center">
          <p className="font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)]">
            This collection is empty.
          </p>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link href="/wineries" className="btn-ink">
          Explore All Wineries
        </Link>
      </div>
    </div>
  );
}
