"use server";

import { db } from "@/db";
import {
  wineries,
  accommodations,
  wineryPhotos,
  accommodationPhotos,
  socialPosts,
  subRegions,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// --- Types ---

export type SocialEntity = {
  slug: string;
  name: string;
  type: "winery" | "accommodation";
  city: string;
  region: string | null;
  valley: string;
  photos: string[];
  attributes: {
    dogFriendly: boolean | null;
    kidFriendly: boolean | null;
    sustainable: boolean | null;
    picnicFriendly: boolean | null;
    adultsOnly: boolean | null;
  };
};

export type SavedPost = {
  id: number;
  entitySlug: string;
  entityType: "winery" | "accommodation";
  variant: string;
  format: string;
  overlayHeadline: string | null;
  overlaySubtext: string | null;
  overlayTags: string | null;
  captionInstagram: string | null;
  captionPinterest: string | null;
  photoUrl: string | null;
  photoFocalX: number | null;
  photoFocalY: number | null;
  photoZoom: number | null;
  status: string;
};

// --- Fetch all entities for the picker ---

export async function fetchAllEntities(): Promise<SocialEntity[]> {
  const [wineryRows, accRows] = await Promise.all([
    db
      .select({
        slug: wineries.slug,
        name: wineries.name,
        city: wineries.city,
        region: subRegions.name,
        dogFriendly: wineries.dogFriendly,
        kidFriendly: wineries.kidFriendly,
        sustainable: wineries.sustainableFarming,
        picnicFriendly: wineries.picnicFriendly,
      })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(eq(wineries.curated, true))
      .orderBy(wineries.name),
    db
      .select({
        slug: accommodations.slug,
        name: accommodations.name,
        city: accommodations.city,
        region: subRegions.name,
        valley: accommodations.valley,
        dogFriendly: accommodations.dogFriendly,
        kidFriendly: accommodations.kidFriendly,
        adultsOnly: accommodations.adultsOnly,
      })
      .from(accommodations)
      .leftJoin(subRegions, eq(accommodations.subRegionId, subRegions.id))
      .orderBy(accommodations.name),
  ]);

  // Batch-fetch photos for all entities. For winery_photos, only include rows
  // with a blob_url (Google Places reference URLs 403 without API key).
  // Also include each winery's heroImageUrl as a guaranteed-available photo.
  const [wPhotos, wHeroes, aPhotos] = await Promise.all([
    db
      .select({
        slug: wineries.slug,
        url: wineryPhotos.blobUrl,
      })
      .from(wineryPhotos)
      .innerJoin(wineries, eq(wineryPhotos.wineryId, wineries.id))
      .where(sql`${wineryPhotos.blobUrl} IS NOT NULL`),
    db
      .select({
        slug: wineries.slug,
        heroUrl: wineries.heroImageUrl,
      })
      .from(wineries)
      .where(sql`${wineries.heroImageUrl} IS NOT NULL`),
    db
      .select({
        slug: accommodations.slug,
        url: sql<string>`COALESCE(${accommodationPhotos.blobUrl}, ${accommodationPhotos.photoUrl})`,
      })
      .from(accommodationPhotos)
      .innerJoin(
        accommodations,
        eq(accommodationPhotos.accommodationId, accommodations.id)
      )
      .where(
        sql`${accommodationPhotos.blobUrl} IS NOT NULL OR ${accommodationPhotos.photoUrl} IS NOT NULL`
      ),
  ]);

  // Group photos by slug, deduplicating hero + gallery
  const wPhotoMap = new Map<string, Set<string>>();
  // Add hero images first (guaranteed in Blob)
  for (const h of wHeroes) {
    if (!h.heroUrl) continue;
    const set = wPhotoMap.get(h.slug) ?? new Set();
    set.add(h.heroUrl);
    wPhotoMap.set(h.slug, set);
  }
  // Add gallery blob photos
  for (const p of wPhotos) {
    if (!p.url) continue;
    const set = wPhotoMap.get(p.slug) ?? new Set();
    set.add(p.url);
    wPhotoMap.set(p.slug, set);
  }
  const aPhotoMap = new Map<string, string[]>();
  for (const p of aPhotos) {
    if (!p.url) continue;
    const arr = aPhotoMap.get(p.slug) ?? [];
    arr.push(p.url);
    aPhotoMap.set(p.slug, arr);
  }

  const entities: SocialEntity[] = [];

  for (const w of wineryRows) {
    entities.push({
      slug: w.slug,
      name: w.name,
      type: "winery",
      city: w.city ?? "",
      region: w.region,
      valley: "napa", // sub_regions.valley would be better but not in the select
      photos: [...(wPhotoMap.get(w.slug) ?? [])],
      attributes: {
        dogFriendly: w.dogFriendly,
        kidFriendly: w.kidFriendly,
        sustainable: w.sustainable,
        picnicFriendly: w.picnicFriendly,
        adultsOnly: null,
      },
    });
  }

  for (const a of accRows) {
    entities.push({
      slug: a.slug,
      name: a.name,
      type: "accommodation",
      city: a.city ?? "",
      region: a.region,
      valley: a.valley,
      photos: aPhotoMap.get(a.slug) ?? [],
      attributes: {
        dogFriendly: a.dogFriendly,
        kidFriendly: a.kidFriendly,
        sustainable: null,
        picnicFriendly: null,
        adultsOnly: a.adultsOnly,
      },
    });
  }

  return entities;
}

// --- Load existing post for an entity ---

export async function loadPost(
  entitySlug: string,
  entityType: "winery" | "accommodation"
): Promise<SavedPost | null> {
  const rows = await db
    .select()
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.entitySlug, entitySlug),
        eq(socialPosts.entityType, entityType)
      )
    )
    .limit(1);
  return (rows[0] as SavedPost) ?? null;
}

// --- Save / upsert a post ---

export async function savePost(data: {
  entitySlug: string;
  entityType: "winery" | "accommodation";
  variant: string;
  format: string;
  overlayHeadline: string;
  overlaySubtext: string;
  overlayTags: string;
  captionInstagram: string;
  captionPinterest: string;
  photoUrl: string;
  photoFocalX: number;
  photoFocalY: number;
  photoZoom: number;
}): Promise<{ id: number }> {
  const now = new Date().toISOString();

  // Check if a post already exists for this entity
  const existing = await db
    .select({ id: socialPosts.id })
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.entitySlug, data.entitySlug),
        eq(socialPosts.entityType, data.entityType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(socialPosts)
      .set({
        variant: data.variant as "overlay" | "bottom",
        format: data.format as "ig" | "pinterest",
        overlayHeadline: data.overlayHeadline,
        overlaySubtext: data.overlaySubtext,
        overlayTags: data.overlayTags,
        captionInstagram: data.captionInstagram,
        captionPinterest: data.captionPinterest,
        photoUrl: data.photoUrl,
        photoFocalX: data.photoFocalX,
        photoFocalY: data.photoFocalY,
        photoZoom: data.photoZoom,
        updatedAt: now,
      })
      .where(eq(socialPosts.id, existing[0].id));
    return { id: existing[0].id };
  }

  const result = await db
    .insert(socialPosts)
    .values({
      entitySlug: data.entitySlug,
      entityType: data.entityType as "winery" | "accommodation",
      variant: data.variant as "overlay" | "bottom",
      format: data.format as "ig" | "pinterest",
      overlayHeadline: data.overlayHeadline,
      overlaySubtext: data.overlaySubtext,
      overlayTags: data.overlayTags,
      captionInstagram: data.captionInstagram,
      captionPinterest: data.captionPinterest,
      photoUrl: data.photoUrl,
      photoFocalX: data.photoFocalX,
      photoFocalY: data.photoFocalY,
      photoZoom: data.photoZoom,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: socialPosts.id });

  return { id: result[0].id };
}
