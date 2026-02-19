import { WineryMap } from "@/components/map/WineryMap";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Map | Wine Country Guide",
  description: "Explore Napa and Sonoma Valley wineries on an interactive map.",
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
      <WineryMap />
    </Suspense>
  );
}
