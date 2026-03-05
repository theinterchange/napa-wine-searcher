import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wines } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wineryId = parseInt(id);
    if (isNaN(wineryId)) {
      return NextResponse.json({ error: "Invalid winery ID" }, { status: 400 });
    }

    const wineryWines = await db
      .select({
        id: wines.id,
        name: wines.name,
        vintage: wines.vintage,
      })
      .from(wines)
      .where(eq(wines.wineryId, wineryId))
      .orderBy(asc(wines.name));

    return NextResponse.json(wineryWines);
  } catch (error) {
    console.error("GET /api/wineries/[id]/wines error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
