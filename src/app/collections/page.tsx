import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { collections, collectionItems } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { FolderOpen } from "lucide-react";
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
      <header className="mb-8 pb-5 border-b border-[var(--rule)]">
        <span className="kicker flex items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5 text-[var(--brass)]" />
          Lists
        </span>
        <h1 className="editorial-h2 text-[28px] sm:text-[36px] mt-2">
          My <em>collections.</em>
        </h1>
      </header>

      {userCollections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCollections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}`}
              className="bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] p-5 transition-colors"
            >
              <h3 className="font-[var(--font-heading)] text-[19px] leading-tight text-[var(--ink)]">
                {col.name}
              </h3>
              {col.description && (
                <p className="mt-2 font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)] line-clamp-2">
                  {col.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)]">
                <span>
                  {col.itemCount} {col.itemCount === 1 ? "winery" : "wineries"}
                </span>
                <span>·</span>
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
        <div className="card-flat p-12 text-center">
          <FolderOpen className="mx-auto h-9 w-9 text-[var(--brass)] opacity-70" />
          <h2 className="mt-4 editorial-h2 text-[22px]">
            No collections yet
          </h2>
          <p className="mt-3 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)] max-w-[50ch] mx-auto">
            Visit a winery page and click &ldquo;Add to List&rdquo; to create
            your first collection.
          </p>
          <Link href="/wineries" className="btn-ink mt-6 inline-flex">
            Browse Wineries
          </Link>
        </div>
      )}
    </div>
  );
}
