import { WineryMap } from "@/components/map/WineryMap";
import { Suspense } from "react";
import type { Metadata } from "next";

import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Winery Map | Napa Sonoma Guide",
  description:
    "Explore Napa Valley and Sonoma County wineries and hotels on an interactive map. Find nearby tasting rooms, toggle accommodations, and plan your wine country trip.",
  openGraph: {
    title: "Winery Map | Napa Sonoma Guide",
    description:
      "Explore Napa Valley and Sonoma County wineries and hotels on an interactive map.",
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
