import { NextRequest, NextResponse } from "next/server";
import { getPoolForTheme } from "@/lib/itinerary/pool";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const theme = sp.get("theme");
  const valley = sp.get("valley");
  const limit = parseInt(sp.get("limit") || "12", 10);
  const excludeIdsStr = sp.get("excludeIds") || "";
  const excludeIds = excludeIdsStr
    ? excludeIdsStr.split(",").map(Number).filter(Boolean)
    : [];

  try {
    const pool = await getPoolForTheme({
      theme,
      valley,
      excludeIds,
      limit: Math.min(24, Math.max(1, limit)),
    });
    return NextResponse.json({ pool });
  } catch (err) {
    console.error("[api/itineraries/pool] error", err);
    return NextResponse.json(
      { error: "Failed to load pool" },
      { status: 500 }
    );
  }
}
