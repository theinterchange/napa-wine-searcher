import { db } from "@/db";
import {
  users,
  favorites,
  visited,
  collections,
  collectionItems,
} from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Wine, Heart, MapPin, FolderOpen } from "lucide-react";
import Link from "next/link";
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

  if (!user) {
    return { title: "Profile Not Found" };
  }

  return {
    title: `${user.name}'s Profile | Napa Sonoma Guide`,
    description: `${user.name}'s wine country profile on Napa Sonoma Guide.`,
    openGraph: {
      title: `${user.name}'s Wine Country Profile`,
      description: `Check out ${user.name}'s wine country favorites and collections.`,
      type: "profile",
    },
    alternates: {
      canonical: `/u/${username}`,
    },
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
      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[var(--rule)]">
        {user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-16 w-16 rounded-full"
          />
        )}
        <div>
          <span className="kicker">Public profile</span>
          <h1 className="editorial-h2 text-[28px] sm:text-[34px] mt-1">{user.name}</h1>
          <div className="flex items-center gap-4 mt-2 font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--ink-3)]">
            <span className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-[var(--brass)]" />
              {favCount} {favCount === 1 ? "favorite" : "favorites"}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[var(--brass)]" />
              {visitCount} {visitCount === 1 ? "visit" : "visits"}
            </span>
          </div>
        </div>
      </div>

      {/* Public Collections */}
      {publicCollections.length > 0 && (
        <section>
          <h2 className="editorial-h2 text-[22px] sm:text-[26px] mb-5 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-[var(--brass)]" />
            Collections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicCollections.map((col) => (
              <Link
                key={col.id}
                href={`/shared/collection/${col.shareCode}`}
                className="bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] p-5 transition-colors"
              >
                <h3 className="font-[var(--font-heading)] text-[17px] leading-tight text-[var(--ink)]">{col.name}</h3>
                {col.description && (
                  <p className="mt-2 font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)] line-clamp-2">
                    {col.description}
                  </p>
                )}
                <p className="mt-2 font-mono text-[10.5px] tracking-[0.14em] uppercase text-[var(--ink-3)]">
                  {col.itemCount}{" "}
                  {col.itemCount === 1 ? "winery" : "wineries"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {publicCollections.length === 0 && (
        <div className="card-flat p-12 text-center">
          <Wine className="mx-auto h-9 w-9 text-[var(--brass)] opacity-70" />
          <p className="mt-4 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)]">
            {user.name} hasn&apos;t shared any collections yet.
          </p>
        </div>
      )}
    </div>
  );
}
