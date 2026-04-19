import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { eq, like, or, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) {
      return NextResponse.json([]);
    }
    const limit = Math.min(20, Number(request.nextUrl.searchParams.get("limit") ?? 15));
    const likePattern = `%${q.toLowerCase()}%`;

    const rows = await db
      .select({
        id: wineries.id,
        slug: wineries.slug,
        name: wineries.name,
        city: wineries.city,
        lat: wineries.lat,
        lng: wineries.lng,
        heroImageUrl: wineries.heroImageUrl,
        googleRating: wineries.googleRating,
        aggregateRating: wineries.aggregateRating,
        priceLevel: wineries.priceLevel,
        subRegion: subRegions.name,
        subRegionSlug: subRegions.slug,
        valley: subRegions.valley,
        hoursJson: wineries.hoursJson,
        visitUrl: wineries.visitUrl,
        websiteUrl: wineries.websiteUrl,
        dogFriendly: wineries.dogFriendly,
        kidFriendly: wineries.kidFriendly,
        picnicFriendly: wineries.picnicFriendly,
        sustainable: wineries.sustainableFarming,
        reservationRequired: wineries.reservationRequired,
        dogFriendlySource: wineries.dogFriendlySource,
        kidFriendlySource: wineries.kidFriendlySource,
        picnicFriendlySource: wineries.picnicFriendlySource,
        sustainableSource: wineries.sustainableSource,
        curated: wineries.curated,
        lastScrapedAt: wineries.lastScrapedAt,
      })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(
        or(
          like(sql`LOWER(${wineries.name})`, likePattern),
          like(sql`LOWER(${wineries.city})`, likePattern),
          like(sql`LOWER(${subRegions.name})`, likePattern)
        )
      )
      .orderBy(sql`COALESCE(${wineries.googleRating}, ${wineries.aggregateRating}, 0) DESC`)
      .limit(limit);

    return NextResponse.json(
      rows.map((r) => ({ ...r, curated: r.curated ?? false }))
    );
  } catch (err) {
    console.error("GET /api/wineries/search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
