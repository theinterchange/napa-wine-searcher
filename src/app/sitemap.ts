import { MetadataRoute } from "next";
import { db } from "@/db";
import { wineries, dayTripRoutes } from "@/db/schema";

const BASE_URL = "https://napa-winery-search.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allWineries, allRoutes] = await Promise.all([
    db.select({ slug: wineries.slug, updatedAt: wineries.updatedAt }).from(wineries),
    db.select({ slug: dayTripRoutes.slug }).from(dayTripRoutes),
  ]);

  const wineryEntries: MetadataRoute.Sitemap = allWineries.map((w) => ({
    url: `${BASE_URL}/wineries/${w.slug}`,
    lastModified: w.updatedAt ? new Date(w.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/wineries`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/day-trips`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...wineryEntries,
    ...allRoutes.map((r) => ({
      url: `${BASE_URL}/day-trips/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
