import { NextRequest, NextResponse } from "next/server";
import { loadStopsByWineryIds } from "@/lib/itinerary/load-trip";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);

  if (ids.length === 0) {
    return NextResponse.json({ stops: [] });
  }
  try {
    const stops = await loadStopsByWineryIds(ids);
    // Preserve the requested order.
    const byId = new Map(stops.map((s) => [s.wineryId, s]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
    return NextResponse.json({ stops: ordered });
  } catch (err) {
    console.error("GET /api/itineraries/stops error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
