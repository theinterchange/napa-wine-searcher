import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/profile", "/my-visits", "/login"],
    },
    sitemap: "https://napa-winery-search.vercel.app/sitemap.xml",
  };
}
