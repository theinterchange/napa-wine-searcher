import { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/profile", "/my-visits", "/login"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
