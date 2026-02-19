import { NextResponse } from "next/server";
import { db } from "@/db";
import { wines, wineries, wineRatings, wineryRatings } from "@/db/schema";
import { getActiveProviders } from "@/lib/ratings";
import { eq, avg } from "drizzle-orm";

export async function POST() {
  const providers = getActiveProviders();
  const allWines = await db.select().from(wines);
  const allWineries = await db.select().from(wineries);

  let updated = 0;

  for (const provider of providers) {
    // Fetch wine ratings
    for (const wine of allWines) {
      const [winery] = await db
        .select({ name: wineries.name })
        .from(wineries)
        .where(eq(wineries.id, wine.wineryId));

      const result = await provider.fetchWineRating(wine.name, winery.name);
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
}
