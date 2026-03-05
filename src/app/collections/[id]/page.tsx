import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { collections, collectionItems, wineries, subRegions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ChevronRight, FolderOpen } from "lucide-react";
import Link from "next/link";
import { WineryCard } from "@/components/directory/WineryCard";
import { CopyShareLink } from "@/components/trip/CopyShareLink";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [collection] = await db
    .select({ name: collections.name })
    .from(collections)
    .where(eq(collections.id, parseInt(id)))
    .limit(1);

  return {
    title: collection
      ? `${collection.name} | Wine Country Guide`
      : "Collection Not Found",
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, parseInt(id)))
    .limit(1);

  if (!collection || collection.userId !== session.user.id) {
    notFound();
  }

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
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
        <Link href="/collections" className="hover:text-burgundy-700 dark:hover:text-burgundy-400">
          Collections
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[var(--foreground)]">{collection.name}</span>
      </nav>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-burgundy-600" />
            {collection.name}
          </h1>
          {collection.description && (
            <p className="mt-2 text-[var(--muted-foreground)]">
              {collection.description}
            </p>
          )}
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {items.length} {items.length === 1 ? "winery" : "wineries"}
          </p>
        </div>
        {collection.shareCode && (
          <CopyShareLink
            path={`/shared/collection/${collection.shareCode}`}
          />
        )}
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
            This collection is empty. Visit winery pages and click &ldquo;Add to
            List&rdquo; to add wineries.
          </p>
        </div>
      )}
    </div>
  );
}
