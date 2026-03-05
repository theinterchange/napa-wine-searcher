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
    .select({ name: collections.name })
    .from(collections)
    .where(eq(collections.shareCode, code))
    .limit(1);

  return {
    title: collection
      ? `${collection.name} | Wine Country Guide`
      : "Collection Not Found",
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
      <div className="mb-8">
        <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-1 mb-2">
          <FolderOpen className="h-4 w-4" />
          Shared Collection
        </p>
        <h1 className="font-heading text-2xl font-bold">{collection.name}</h1>
        {collection.description && (
          <p className="mt-2 text-[var(--muted-foreground)]">
            {collection.description}
          </p>
        )}
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {items.length} {items.length === 1 ? "winery" : "wineries"}
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((w) => (
            <WineryCard key={w.id} winery={w} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-[var(--muted-foreground)]">
            This collection is empty.
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/wineries"
          className="inline-flex items-center gap-2 rounded-lg bg-burgundy-700 px-6 py-3 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
        >
          Explore All Wineries
        </Link>
      </div>
    </div>
  );
}
