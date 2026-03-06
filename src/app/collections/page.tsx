import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { collections, collectionItems } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { CopyShareLink } from "@/components/trip/CopyShareLink";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Collections | Napa Sonoma Guide",
  description: "Your curated winery collections.",
};

export default async function CollectionsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userCollections = await db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      shareCode: collections.shareCode,
      createdAt: collections.createdAt,
      itemCount: count(collectionItems.wineryId),
    })
    .from(collections)
    .leftJoin(
      collectionItems,
      eq(collections.id, collectionItems.collectionId)
    )
    .where(eq(collections.userId, session.user.id))
    .groupBy(collections.id)
    .orderBy(desc(collections.createdAt));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-burgundy-600" />
          My Collections
        </h1>
      </div>

      {userCollections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCollections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
            >
              <h3 className="font-heading font-semibold text-lg">
                {col.name}
              </h3>
              {col.description && (
                <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
                  {col.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                <span>
                  {col.itemCount} {col.itemCount === 1 ? "winery" : "wineries"}
                </span>
                <span>
                  {new Date(col.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {col.shareCode && (
                <div className="mt-3" onClick={(e) => e.preventDefault()}>
                  <CopyShareLink
                    path={`/shared/collection/${col.shareCode}`}
                  />
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-[var(--muted-foreground)] opacity-50" />
          <h2 className="mt-4 font-heading text-lg font-semibold">
            No collections yet
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Visit a winery page and click &ldquo;Add to List&rdquo; to create
            your first collection.
          </p>
          <Link
            href="/wineries"
            className="mt-4 inline-block rounded-lg bg-burgundy-700 px-4 py-2 text-sm font-medium text-white hover:bg-burgundy-800 transition-colors"
          >
            Browse Wineries
          </Link>
        </div>
      )}
    </div>
  );
}
