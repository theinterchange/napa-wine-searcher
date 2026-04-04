import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accommodations } from "@/db/schema";
import { and, isNotNull } from "drizzle-orm";
import { haversineDistance } from "@/lib/geo";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const lat = parseFloat(params.get("lat") || "");
    const lng = parseFloat(params.get("lng") || "");
    const radius = parseFloat(params.get("radius") || "15");
    const limit = parseInt(params.get("limit") || "3", 10);
    const excludeSlug = params.get("exclude") || "";

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "lat and lng are required", accommodations: [] },
        { status: 400 }
      );
    }

    const all = await db
      .select({
        slug: accommodations.slug,
        name: accommodations.name,
        type: accommodations.type,
        heroImageUrl: accommodations.heroImageUrl,
        thumbnailUrl: accommodations.thumbnailUrl,
        priceTier: accommodations.priceTier,
        googleRating: accommodations.googleRating,
        city: accommodations.city,
        lat: accommodations.lat,
        lng: accommodations.lng,
      })
      .from(accommodations)
      .where(
        and(isNotNull(accommodations.lat), isNotNull(accommodations.lng))
      );

    const withDistance = all
      .filter((a) => a.slug !== excludeSlug)
      .map((a) => ({
        ...a,
        distanceMiles: Math.round(
          haversineDistance(lat, lng, a.lat!, a.lng!) * 10
        ) / 10,
      }))
      .filter((a) => a.distanceMiles <= radius)
      .sort((a, b) => {
        // Sort by rating first (higher is better), then by distance
        const ratingA = a.googleRating || 0;
        const ratingB = b.googleRating || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return a.distanceMiles - b.distanceMiles;
      })
      .slice(0, limit);

    return NextResponse.json({
      accommodations: withDistance.map(({ lat: _lat, lng: _lng, ...rest }) => rest),
    });
  } catch (error) {
    console.error("GET /api/accommodations/nearby error:", error);
    return NextResponse.json(
      { error: "Internal server error", accommodations: [] },
      { status: 500 }
    );
  }
}
