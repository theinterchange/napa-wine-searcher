import { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Narrow exception: the read-only weekly analytics report is token-gated
        // (see src/app/api/cron/weekly-stats/route.ts) and needs to be fetchable
        // by Claude's scheduled weekly-checkup task, which respects robots.txt.
        // Without the correct token the endpoint returns 401 regardless of
        // crawler — allowing the path here does not expose any data.
        allow: ["/", "/api/cron/weekly-stats"],
        disallow: [
          "/api/",
          "/profile",
          "/my-visits",
          "/my-trips",
          "/journal",
          "/collections",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/nalaadmin",
          // Faceted / paginated directory URLs: infinite ?valley=&region=&
          // rating=&sort=&varietal=&tastingPrice=&amenities=&page= combinations.
          // Each is a dynamic render (Fluid CPU) + potential ISR write and
          // should never be indexed — canonical is the clean path. Blocking the
          // crawl space cuts bot-driven usage across all three metered meters.
          // Clean paths (/wineries, /wineries/[slug], /where-to-stay) are NOT
          // affected — these patterns only match URLs that carry a query string.
          "/wineries?",
          "/where-to-stay?",
          // Map filter facets (?valley=&hotels=&…) are the same content as the
          // clean /map path — canonical handles indexed variants, this stops
          // the crawl of new ones (GSC "Duplicate without user-selected canonical").
          "/map?",
          // /for-wineries?listing=accommodation:N are transactional deep-links
          // into the owner claim flow, not indexable content — Google was
          // flagging them as Soft 404. The clean /for-wineries page stays indexed.
          "/for-wineries?",
        ],
      },
      // Explicitly allow AI crawlers for AEO/GEO visibility
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
