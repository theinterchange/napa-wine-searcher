import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wineries, subRegions, tastingExperiences } from "@/db/schema";
import { eq, sql, min, max } from "drizzle-orm";

/**
 * Lightweight preview endpoint for the itinerary planner's "More wineries"
 * slide-over drawer. Returns enough detail to show a rich preview without
 * navigating away from the trip page.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  try {
    const [row] = await db
      .select({
        id: wineries.id,
        slug: wineries.slug,
        name: wineries.name,
        city: wineries.city,
        lat: wineries.lat,
        lng: wineries.lng,
        heroImageUrl: wineries.heroImageUrl,
        googleRating: wineries.googleRating,
        googleReviewCount: wineries.googleReviewCount,
        aggregateRating: wineries.aggregateRating,
        priceLevel: wineries.priceLevel,
        shortDescription: wineries.shortDescription,
        whyVisit: wineries.whyVisit,
        knownFor: wineries.knownFor,
        dogFriendly: wineries.dogFriendly,
        kidFriendly: wineries.kidFriendly,
        picnicFriendly: wineries.picnicFriendly,
        reservationRequired: wineries.reservationRequired,
        dogFriendlySource: wineries.dogFriendlySource,
        kidFriendlySource: wineries.kidFriendlySource,
        picnicFriendlySource: wineries.picnicFriendlySource,
        visitUrl: wineries.visitUrl,
        websiteUrl: wineries.websiteUrl,
        hoursJson: wineries.hoursJson,
        subRegion: subRegions.name,
        valley: subRegions.valley,
      })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(eq(wineries.slug, slug))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [pricing] = await db
      .select({
        minPrice: min(tastingExperiences.price),
        maxPrice: max(tastingExperiences.price),
        avgDuration: sql<number>`COALESCE(AVG(${tastingExperiences.durationMinutes}), 60)`.as(
          "avg_duration"
        ),
        experienceCount: sql<number>`COUNT(*)`.as("n"),
      })
      .from(tastingExperiences)
      .where(eq(tastingExperiences.wineryId, row.id));

    return NextResponse.json({
      ...row,
      tasting:
        pricing?.minPrice != null
          ? { min: pricing.minPrice, max: pricing.maxPrice }
          : null,
      tastingDurationMinutes: pricing?.avgDuration
        ? Math.round(pricing.avgDuration)
        : 60,
      experienceCount: Number(pricing?.experienceCount ?? 0),
    });
  } catch (err) {
    console.error(`GET /api/wineries/${slug}/preview error:`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
