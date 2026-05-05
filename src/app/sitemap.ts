import { MetadataRoute } from "next";
import { db } from "@/db";
import { wineries, subRegions, dayTripRoutes, accommodations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAllGuides } from "@/lib/guide-content";
import { getAllPosts } from "@/lib/blog";
import { BASE_URL } from "@/lib/constants";
import {
  getQualifyingSubregions,
  getLastVerifiedDate,
} from "@/lib/category-data";
import { getDefinedScopes } from "@/lib/category-content";

export const revalidate = 86400; // 24h — winery data changes infrequently

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    allWineries,
    allRoutes,
    allSubRegions,
    allAccommodations,
    dogQualifyingSubs,
    dogHubVerified,
    dogNapaVerified,
    dogSonomaVerified,
    kidQualifyingSubs,
    kidHubVerified,
    kidNapaVerified,
    kidSonomaVerified,
    sustainableQualifyingSubs,
    sustainableHubVerified,
    sustainableNapaVerified,
    sustainableSonomaVerified,
  ] = await Promise.all([
    db.select({ slug: wineries.slug, updatedAt: wineries.updatedAt }).from(wineries),
    db.select({ slug: dayTripRoutes.slug }).from(dayTripRoutes),
    db.select({ slug: subRegions.slug, valley: subRegions.valley }).from(subRegions),
    db.select({ slug: accommodations.slug, updatedAt: accommodations.updatedAt }).from(accommodations),
    getQualifyingSubregions("dog"),
    getLastVerifiedDate("dog", { kind: "hub" }),
    getLastVerifiedDate("dog", { kind: "valley", valley: "napa" }),
    getLastVerifiedDate("dog", { kind: "valley", valley: "sonoma" }),
    getQualifyingSubregions("kid"),
    getLastVerifiedDate("kid", { kind: "hub" }),
    getLastVerifiedDate("kid", { kind: "valley", valley: "napa" }),
    getLastVerifiedDate("kid", { kind: "valley", valley: "sonoma" }),
    getQualifyingSubregions("sustainable"),
    getLastVerifiedDate("sustainable", { kind: "hub" }),
    getLastVerifiedDate("sustainable", { kind: "valley", valley: "napa" }),
    getLastVerifiedDate("sustainable", { kind: "valley", valley: "sonoma" }),
  ]);

  // Dog cluster: hub + valleys + qualifying subregions whose editorial
  // content is wired in category-content.ts (DOG_META). Anything else
  // would 404 — gate it here so the sitemap stays consistent with the
  // catch-all route's generateStaticParams.
  const dogDefinedKeys = new Set(getDefinedScopes("dog"));
  const dogClusterEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/dog-friendly-wineries`,
      lastModified: dogHubVerified ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/dog-friendly-wineries/napa-valley`,
      lastModified: dogNapaVerified ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/dog-friendly-wineries/sonoma-county`,
      lastModified: dogSonomaVerified ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...dogQualifyingSubs
      .filter((sr) => dogDefinedKeys.has(`subregion:${sr.slug}`))
      .map((sr) => ({
        url: `${BASE_URL}/dog-friendly-wineries/${sr.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
  ];

  // Kid-friendly cluster
  const kidDefinedKeys = new Set(getDefinedScopes("kid"));
  const kidClusterEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/kid-friendly-wineries`,
      lastModified: kidHubVerified ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/kid-friendly-wineries/napa-valley`,
      lastModified: kidNapaVerified ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/kid-friendly-wineries/sonoma-county`,
      lastModified: kidSonomaVerified ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...kidQualifyingSubs
      .filter((sr) => kidDefinedKeys.has(`subregion:${sr.slug}`))
      .map((sr) => ({
        url: `${BASE_URL}/kid-friendly-wineries/${sr.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
  ];

  // Sustainable cluster
  const sustainableDefinedKeys = new Set(getDefinedScopes("sustainable"));
  const sustainableClusterEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/sustainable-wineries`,
      lastModified: sustainableHubVerified ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/sustainable-wineries/napa-valley`,
      lastModified: sustainableNapaVerified ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/sustainable-wineries/sonoma-county`,
      lastModified: sustainableSonomaVerified ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...sustainableQualifyingSubs
      .filter((sr) => sustainableDefinedKeys.has(`subregion:${sr.slug}`))
      .map((sr) => ({
        url: `${BASE_URL}/sustainable-wineries/${sr.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
  ];

  const wineryEntries: MetadataRoute.Sitemap = allWineries.map((w) => ({
    url: `${BASE_URL}/wineries/${w.slug}`,
    lastModified: w.updatedAt ? new Date(w.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const hotelsNearWineryEntries: MetadataRoute.Sitemap = allWineries.map((w) => ({
    url: `${BASE_URL}/near/${w.slug}`,
    lastModified: w.updatedAt ? new Date(w.updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
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
      url: `${BASE_URL}/itineraries`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/itineraries/build`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/itineraries/describe`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    ...dogClusterEntries,
    ...kidClusterEntries,
    ...sustainableClusterEntries,
    // Accommodation category pages (dog-friendly only — family-friendly
    // was considered but removed: accommodations default to kid-welcoming
    // unless adults_only, so a dedicated page would be misleading)
    {
      url: `${BASE_URL}/dog-friendly-hotels`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/dog-friendly-hotels/napa-valley`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/dog-friendly-hotels/sonoma-county`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...subRegionEntries,
    ...wineryEntries,
    ...hotelsNearWineryEntries,
    ...["napa", "yountville", "st-helena", "calistoga", "healdsburg", "sonoma", "guerneville", "petaluma"].map((city) => ({
      url: `${BASE_URL}/where-to-stay/cities/${city}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...["highly-rated", "with-spa", "inns", "resorts"].map((type) => ({
      url: `${BASE_URL}/where-to-stay/collections/${type}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...allRoutes.map((r) => ({
      url: `${BASE_URL}/itineraries/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    {
      url: `${BASE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...guideEntries,
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
