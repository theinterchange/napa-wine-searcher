import { MetadataRoute } from "next";
import { db } from "@/db";
import { wineries, subRegions, dayTripRoutes, accommodations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAllGuides } from "@/lib/guide-content";
import { getAllPosts } from "@/lib/blog";
import { BASE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allWineries, allRoutes, allSubRegions, allAccommodations] = await Promise.all([
    db.select({ slug: wineries.slug, updatedAt: wineries.updatedAt }).from(wineries),
    db.select({ slug: dayTripRoutes.slug }).from(dayTripRoutes),
    db.select({ slug: subRegions.slug, valley: subRegions.valley }).from(subRegions),
    db.select({ slug: accommodations.slug, updatedAt: accommodations.updatedAt }).from(accommodations),
  ]);

  const wineryEntries: MetadataRoute.Sitemap = allWineries.map((w) => ({
    url: `${BASE_URL}/wineries/${w.slug}`,
    lastModified: w.updatedAt ? new Date(w.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const napaSubRegions = allSubRegions.filter((r) => r.valley === "napa");
  const sonomaSubRegions = allSubRegions.filter((r) => r.valley === "sonoma");

  const subRegionEntries: MetadataRoute.Sitemap = [
    ...napaSubRegions.map((r) => ({
      url: `${BASE_URL}/napa-valley/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...sonomaSubRegions.map((r) => ({
      url: `${BASE_URL}/sonoma-county/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];

  const guideEntries: MetadataRoute.Sitemap = getAllGuides().map((g) => ({
    url: `${BASE_URL}/guides/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
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
      url: `${BASE_URL}/napa-valley`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/sonoma-county`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
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
    ...subRegionEntries,
    ...wineryEntries,
    ...allRoutes.map((r) => ({
      url: `${BASE_URL}/day-trips/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    {
      url: `${BASE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...guideEntries,
    {
      url: `${BASE_URL}/plan-trip`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/map`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...getAllPosts().map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${BASE_URL}/where-to-stay`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/where-to-stay/napa-valley`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/where-to-stay/sonoma-county`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...allAccommodations.map((a) => ({
      url: `${BASE_URL}/where-to-stay/${a.slug}`,
      lastModified: a.updatedAt ? new Date(a.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
  ];
}
