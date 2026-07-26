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
