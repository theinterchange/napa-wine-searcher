import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wines } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const wineryWines = await db
    .select({
      id: wines.id,
      name: wines.name,
      vintage: wines.vintage,
    })
    .from(wines)
    .where(eq(wines.wineryId, parseInt(id)))
    .orderBy(asc(wines.name));

  return NextResponse.json(wineryWines);
}
