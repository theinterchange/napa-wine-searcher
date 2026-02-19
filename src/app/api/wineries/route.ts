import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wineries, subRegions } from "@/db/schema";
import { eq, like, gte, asc, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") || "";
  const valley = params.get("valley") || "";
  const region = params.get("region") || "";
  const price = params.get("price") || "";
  const rating = params.get("rating") || "";
  const reservation = params.get("reservation") || "";
  const dog = params.get("dog") || "";
  const picnic = params.get("picnic") || "";

  const conditions = [];
  if (q) conditions.push(like(wineries.name, `%${q}%`));
  if (valley) conditions.push(eq(subRegions.valley, valley as "napa" | "sonoma"));
  if (region) conditions.push(eq(subRegions.slug, region));
  if (price) conditions.push(eq(wineries.priceLevel, parseInt(price)));
  if (rating) conditions.push(gte(wineries.aggregateRating, parseFloat(rating)));
  if (reservation === "false") conditions.push(eq(wineries.reservationRequired, false));
  if (dog === "true") conditions.push(eq(wineries.dogFriendly, true));
  if (picnic === "true") conditions.push(eq(wineries.picnicFriendly, true));

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
}
