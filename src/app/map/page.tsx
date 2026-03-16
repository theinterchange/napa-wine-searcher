import { WineryMap } from "@/components/map/WineryMap";
import { Suspense } from "react";
import type { Metadata } from "next";

import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Winery Map | Napa Sonoma Guide",
  description:
    "Explore Napa Valley and Sonoma County wineries on an interactive map. Find nearby tasting rooms, filter by amenities, and plan your route.",
  openGraph: {
    title: "Winery Map | Napa Sonoma Guide",
    description:
      "Explore Napa Valley and Sonoma County wineries on an interactive map.",
    url: `${BASE_URL}/map`,
    siteName: "Napa Sonoma Guide",
    type: "website",
  },
};

export default function MapPage() {
  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-2 sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold">Winery Map</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Explore wineries across Napa Valley and Sonoma County. Click a pin to view details.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <p className="text-[var(--muted-foreground)]">Loading map...</p>
          </div>
        }
      >
        <WineryMap />
      </Suspense>
    </div>
  );
}
