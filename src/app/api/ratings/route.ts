import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { wines, wineries, wineRatings, wineryRatings } from "@/db/schema";
import { getActiveProviders } from "@/lib/ratings";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providers = getActiveProviders();
    const allWines = await db.select().from(wines);
    const allWineries = await db.select().from(wineries);

    // Build a winery name lookup map to avoid N+1
    const wineryMap = new Map(allWineries.map((w) => [w.id, w.name]));

    let updated = 0;

    for (const provider of providers) {
      // Fetch wine ratings
      for (const wine of allWines) {
        const wineryName = wineryMap.get(wine.wineryId);
        if (!wineryName) continue;

        const result = await provider.fetchWineRating(wine.name, wineryName);
        if (result) {
          await db
            .insert(wineRatings)
            .values({
              wineId: wine.id,
              provider: provider.name,
              score: result.score,
              maxScore: result.maxScore,
              reviewCount: result.reviewCount,
              criticName: result.criticName,
              fetchedAt: new Date().toISOString(),
            })
            .onConflictDoNothing();
          updated++;
        }
      }

      // Fetch winery ratings
      for (const winery of allWineries) {
        const result = await provider.fetchWineryRating(winery.name);
        if (result) {
          await db
            .insert(wineryRatings)
            .values({
              wineryId: winery.id,
              provider: provider.name,
              score: result.score,
              maxScore: result.maxScore,
              reviewCount: result.reviewCount,
              fetchedAt: new Date().toISOString(),
            })
            .onConflictDoNothing();
          updated++;
        }
      }
    }

    return NextResponse.json({ updated, providers: providers.map((p) => p.name) });
  } catch (error) {
    console.error("POST /api/ratings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
