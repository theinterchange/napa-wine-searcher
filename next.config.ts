import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake heavy icon packs and DB drivers so unused exports don't ship.
  experimental: {
    optimizePackageImports: ["lucide-react", "drizzle-orm", "date-fns"],
  },
  // Drop console.log in production (keeps console.error/warn for debugging).
  compiler: {
    removeConsole: { exclude: ["error", "warn"] },
  },
  async redirects() {
    // 301 redirects: old guide pages → new category cluster pages.
    // Dog + kid amenity guides are superseded by dedicated category routes.
    const redirects: { source: string; destination: string; permanent: true }[] = [];

    const clusters: [string, string][] = [
      ["dog-friendly-wineries", "/dog-friendly-wineries"],
      ["kid-friendly-wineries", "/kid-friendly-wineries"],
    ];

    const valleys: [string, string][] = [
      ["napa-valley", "napa-valley"],
      ["sonoma-county", "sonoma-county"],
    ];

    // Subregions that have a category page equivalent (≥ threshold)
    const categorySubregions: Record<string, string[]> = {
      "/dog-friendly-wineries": [
        "st-helena", "rutherford", "calistoga", "carneros-napa",
        "stags-leap-district", "russian-river-valley", "sonoma-valley",
        "dry-creek-valley", "carneros-sonoma",
      ],
      "/kid-friendly-wineries": [
        "russian-river-valley", "sonoma-valley", "dry-creek-valley",
        "st-helena", "carneros-sonoma", "rutherford", "calistoga",
      ],
    };

    // Subregion → valley fallback for guide subregions that have no category page
    const subregionValley: Record<string, string> = {
      calistoga: "napa-valley",
      "st-helena": "napa-valley",
      rutherford: "napa-valley",
      oakville: "napa-valley",
      yountville: "napa-valley",
      "stags-leap-district": "napa-valley",
      "carneros-napa": "napa-valley",
      "russian-river-valley": "sonoma-county",
      "sonoma-valley": "sonoma-county",
      "dry-creek-valley": "sonoma-county",
      "alexander-valley": "sonoma-county",
    };

    for (const [guidePart, clusterRoot] of clusters) {
      // Valley-level redirects
      for (const [guideSuffix, categorySuffix] of valleys) {
        redirects.push({
          source: `/guides/${guidePart}-${guideSuffix}`,
          destination: `${clusterRoot}/${categorySuffix}`,
          permanent: true,
        });
      }

      // Subregion redirects
      const qualifyingSlugs = new Set(categorySubregions[clusterRoot] ?? []);
      for (const slug of Object.keys(subregionValley)) {
        if (qualifyingSlugs.has(slug)) {
          // Subregion has its own category page
          redirects.push({
            source: `/guides/${guidePart}-${slug}`,
            destination: `${clusterRoot}/${slug}`,
            permanent: true,
          });
        } else {
          // No category page — redirect to valley parent
          redirects.push({
            source: `/guides/${guidePart}-${slug}`,
            destination: `${clusterRoot}/${subregionValley[slug]}`,
            permanent: true,
          });
        }
      }
    }

    // Romantic guides retired 2026-04-12 (the filter surfaced thematically-
    // wrong wineries on small-pool subregion pages). Redirect each URL to
    // the most-relevant region page.
    const romanticRedirects: Record<string, string> = {
      "napa-valley": "/napa-valley",
      "sonoma-county": "/sonoma-county",
      yountville: "/napa-valley/yountville",
      "st-helena": "/napa-valley/st-helena",
      calistoga: "/napa-valley/calistoga",
      "sonoma-valley": "/sonoma-county/sonoma-valley",
      "russian-river-valley": "/sonoma-county/russian-river-valley",
      "dry-creek-valley": "/sonoma-county/dry-creek-valley",
    };
    for (const [slug, destination] of Object.entries(romanticRedirects)) {
      redirects.push({
        source: `/guides/romantic-wineries-${slug}`,
        destination,
        permanent: true,
      });
    }

    // Itinerary consolidation: /plan-trip and /day-trips → /itineraries
    redirects.push(
      { source: "/plan-trip", destination: "/itineraries", permanent: true },
      { source: "/day-trips", destination: "/itineraries", permanent: true },
      { source: "/day-trips/:slug", destination: "/itineraries/:slug", permanent: true }
    );

    return redirects;
  },
  images: {
    qualities: [75, 85, 90],
    // Default is 60s. With low traffic, the optimizer evicts encoded
    // versions before real users hit them — every Lighthouse / cold visitor
    // pays the encode cost. Winery photos rarely change, so a long TTL is
    // safe; we can bust by changing the source URL.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "iubllytv2maaomk9.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Edge-cache the directory listings — no per-user content in the SSR
      // HTML (Navbar/auth state hydrates client-side). Each filter combo
      // gets its own cache entry; ~60s freshness, 5m stale-while-revalidate
      // means at most one user per minute eats the SSR cost.
      {
        source: "/wineries",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/where-to-stay",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/where-to-stay/cities/:city",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=900",
          },
        ],
      },
      {
        source: "/where-to-stay/collections/:type",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=900",
          },
        ],
      },
      {
        source: "/where-to-stay/napa-valley",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=900",
          },
        ],
      },
      {
        source: "/where-to-stay/sonoma-county",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=900",
          },
        ],
      },
      {
        source: "/napa-valley",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=900",
          },
        ],
      },
      {
        source: "/sonoma-county",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=900",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
