import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accommodations } from "@/db/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const valley = request.nextUrl.searchParams.get("valley") || "";

    const conditions = [
      isNotNull(accommodations.lat),
      isNotNull(accommodations.lng),
    ];
    if (valley === "napa" || valley === "sonoma") {
      conditions.push(eq(accommodations.valley, valley));
    }

    const results = await db
      .select({
        id: accommodations.id,
        slug: accommodations.slug,
        name: accommodations.name,
        lat: accommodations.lat,
        lng: accommodations.lng,
        city: accommodations.city,
        type: accommodations.type,
        priceTier: accommodations.priceTier,
        starRating: accommodations.starRating,
        googleRating: accommodations.googleRating,
        bookingUrl: accommodations.bookingUrl,
        websiteUrl: accommodations.websiteUrl,
        heroImageUrl: accommodations.heroImageUrl,
        shortDescription: accommodations.shortDescription,
        dogFriendly: accommodations.dogFriendly,
        dogFriendlyNote: accommodations.dogFriendlyNote,
        kidFriendly: accommodations.kidFriendly,
        kidFriendlyNote: accommodations.kidFriendlyNote,
        adultsOnly: accommodations.adultsOnly,
      })
      .from(accommodations)
      .where(and(...conditions))
      .orderBy(desc(accommodations.googleRating));

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/accommodations/map error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
