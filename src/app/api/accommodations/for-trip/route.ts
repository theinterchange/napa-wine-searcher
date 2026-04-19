import { NextRequest, NextResponse } from "next/server";
import { getAccommodationsForTripStops } from "@/lib/itinerary/nearby-accommodations";

export async function GET(request: NextRequest) {
  try {
    const stopIdsParam = request.nextUrl.searchParams.get("stopIds") ?? "";
    const ids = stopIdsParam
      .split(",")
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);
    const limit = Math.min(
      6,
      Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 3))
    );
    const maxMiles = Math.min(
      50,
      Math.max(1, Number(request.nextUrl.searchParams.get("maxMiles") ?? 20))
    );

    if (ids.length === 0) return NextResponse.json([]);
    const results = await getAccommodationsForTripStops(ids, limit, maxMiles);
    return NextResponse.json(results);
  } catch (err) {
    console.error("GET /api/accommodations/for-trip error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
