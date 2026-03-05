import { db } from "@/db";
import {
  users,
  favorites,
  visited,
  collections,
  collectionItems,
  wineries,
  subRegions,
} from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Wine, Heart, MapPin, FolderOpen } from "lucide-react";
import Link from "next/link";
import { WineryCard } from "@/components/directory/WineryCard";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return {
    title: user
      ? `${user.name}'s Profile | Wine Country Guide`
      : "Profile Not Found",
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      isPublic: users.isPublic,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user || !user.isPublic) notFound();

  const [[{ favCount }], [{ visitCount }], publicCollections] =
    await Promise.all([
      db
        .select({ favCount: count() })
        .from(favorites)
        .where(eq(favorites.userId, user.id)),
      db
        .select({ visitCount: count() })
        .from(visited)
        .where(eq(visited.userId, user.id)),
      db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          shareCode: collections.shareCode,
          itemCount: count(collectionItems.wineryId),
        })
        .from(collections)
        .leftJoin(
          collectionItems,
          eq(collections.id, collectionItems.collectionId)
        )
        .where(eq(collections.userId, user.id))
        .groupBy(collections.id)
        .orderBy(desc(collections.createdAt)),
    ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {user.image && (
          <img
            src={user.image}
            alt=""
            className="h-16 w-16 rounded-full"
          />
        )}
        <div>
          <h1 className="font-heading text-2xl font-bold">{user.name}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {favCount} {favCount === 1 ? "favorite" : "favorites"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {visitCount} {visitCount === 1 ? "visit" : "visits"}
            </span>
          </div>
        </div>
      </div>

      {/* Public Collections */}
      {publicCollections.length > 0 && (
        <section>
          <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-burgundy-600" />
            Collections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicCollections.map((col) => (
              <Link
                key={col.id}
                href={`/shared/collection/${col.shareCode}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-burgundy-400 dark:hover:border-burgundy-600 transition-colors"
              >
                <h3 className="font-heading font-semibold">{col.name}</h3>
                {col.description && (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
                    {col.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  {col.itemCount}{" "}
                  {col.itemCount === 1 ? "winery" : "wineries"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {publicCollections.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Wine className="mx-auto h-10 w-10 text-[var(--muted-foreground)]/50" />
          <p className="mt-4 text-[var(--muted-foreground)]">
            {user.name} hasn&apos;t shared any collections yet.
          </p>
        </div>
      )}
    </div>
  );
}
