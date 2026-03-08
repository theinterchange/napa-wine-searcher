import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wineries, subRegions, tastingExperiences, wines, wineTypes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Support both slug (string) and numeric id
  const isNumeric = /^\d+$/.test(id);
  const whereClause = isNumeric
    ? eq(wineries.id, parseInt(id))
    : eq(wineries.slug, id);

  const [winery] = await db
    .select({
      id: wineries.id,
      slug: wineries.slug,
      name: wineries.name,
      description: wineries.description,
      shortDescription: wineries.shortDescription,
      address: wineries.address,
      city: wineries.city,
      state: wineries.state,
      zip: wineries.zip,
      phone: wineries.phone,
      websiteUrl: wineries.websiteUrl,
      hoursJson: wineries.hoursJson,
      heroImageUrl: wineries.heroImageUrl,
      reservationRequired: wineries.reservationRequired,
      dogFriendly: wineries.dogFriendly,
      kidFriendly: wineries.kidFriendly,
      picnicFriendly: wineries.picnicFriendly,
      priceLevel: wineries.priceLevel,
      aggregateRating: wineries.aggregateRating,
      googleRating: wineries.googleRating,
      subRegion: subRegions.name,
    })
    .from(wineries)
    .leftJoin(subRegions, eq(wineries.subRegionId, subRegions.id))
    .where(whereClause)
    .limit(1);

  if (!winery) {
    return NextResponse.json({ error: "Winery not found" }, { status: 404 });
  }

  const [tastings, wineryWines] = await Promise.all([
    db
      .select({
        id: tastingExperiences.id,
        name: tastingExperiences.name,
        price: tastingExperiences.price,
        description: tastingExperiences.description,
      })
      .from(tastingExperiences)
      .where(eq(tastingExperiences.wineryId, winery.id))
      .orderBy(asc(tastingExperiences.price))
      .limit(5),
    db
      .select({
        id: wines.id,
        name: wines.name,
        wineType: wineTypes.name,
      })
      .from(wines)
      .leftJoin(wineTypes, eq(wines.wineTypeId, wineTypes.id))
      .where(eq(wines.wineryId, winery.id))
      .limit(8),
  ]);

  return NextResponse.json({ ...winery, tastings, wines: wineryWines });
}
