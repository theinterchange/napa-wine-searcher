import { WineryMap } from "@/components/map/WineryMap";
import { Suspense } from "react";
import type { Metadata } from "next";

import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Napa & Sonoma Winery Map — Explore 225+ Wineries & Hotels",
  description:
    "Interactive map of Napa Valley and Sonoma County wineries. Filter by region, toggle hotels, find nearby tasting rooms, and book tastings while you plan your wine country trip.",
  openGraph: {
    title: "Napa & Sonoma Winery Map — 225+ Wineries & Hotels | Napa Sonoma Guide",
    description:
      "Interactive map of Napa Valley and Sonoma County wineries and hotels — filter by region and book tastings near you.",
    url: `${BASE_URL}/map`,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
};

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <p className="text-[var(--muted-foreground)]">Loading map...</p>
        </div>
      }
    >
      <h1 className="sr-only">Winery Map — Napa Valley and Sonoma County</h1>
      <WineryMap />
    </Suspense>
  );
}
