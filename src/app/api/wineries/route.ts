import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { eq, like, gte, asc, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const q = params.get("q") || "";
    const valley = params.get("valley") || "";
    const region = params.get("region") || "";
    const price = params.get("price") || "";
    const rating = params.get("rating") || "";
    const reservation = params.get("reservation") || "";
    const dog = params.get("dog") || "";
    const kid = params.get("kid") || "";
    const picnic = params.get("picnic") || "";

    const conditions = [];
    if (q) conditions.push(like(wineries.name, `%${q}%`));
    if (valley) conditions.push(eq(subRegions.valley, valley as "napa" | "sonoma"));
    if (region) conditions.push(eq(subRegions.slug, region));
    if (price) {
      const parsed = parseInt(price);
      if (isNaN(parsed)) return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      conditions.push(eq(wineries.priceLevel, parsed));
    }
    if (rating) {
      const parsed = parseFloat(rating);
      if (isNaN(parsed)) return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
      conditions.push(gte(wineries.aggregateRating, parsed));
    }
    if (reservation === "false" || reservation === "0") conditions.push(eq(wineries.reservationRequired, false));
    if (dog === "true" || dog === "1") conditions.push(eq(wineries.dogFriendly, true));
    if (kid === "true" || kid === "1") conditions.push(eq(wineries.kidFriendly, true));
    if (picnic === "true" || picnic === "1") conditions.push(eq(wineries.picnicFriendly, true));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: wineries.id,
        slug: wineries.slug,
        name: wineries.name,
        lat: wineries.lat,
        lng: wineries.lng,
        city: wineries.city,
        priceLevel: wineries.priceLevel,
        aggregateRating: wineries.aggregateRating,
        totalRatings: wineries.totalRatings,
        shortDescription: wineries.shortDescription,
        curated: wineries.curated,
        subRegion: subRegions.name,
        subRegionColor: subRegions.color,
        valley: subRegions.valley,
      })
      .from(wineries)
      .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
      .where(where)
      .orderBy(desc(wineries.aggregateRating));

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/wineries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
