import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wineries } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const [winery] = await db
      .select({ id: wineries.id, name: wineries.name, slug: wineries.slug })
      .from(wineries)
      .where(eq(wineries.slug, slug));

    if (!winery) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(winery);
  } catch (error) {
    console.error("GET /api/wineries/by-slug/[slug] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
