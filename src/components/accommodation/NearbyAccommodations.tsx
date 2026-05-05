import { AccommodationCard } from "./AccommodationCard";
import type { AccommodationCard as AccommodationCardData } from "@/lib/accommodation-data";
import Link from "next/link";
import { BedDouble } from "lucide-react";

interface NearbyAccommodationsProps {
  accommodations: (AccommodationCardData & { distanceMiles?: number | null })[];
  title?: string;
  valley?: "napa" | "sonoma";
}

export function NearbyAccommodations({
  accommodations,
  title = "Where to Stay Nearby",
  valley,
}: NearbyAccommodationsProps) {
  if (accommodations.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-[var(--font-heading)] text-[26px] sm:text-[30px] font-normal tracking-[-0.01em] text-[var(--ink)]">{title}</h2>
        <Link
          href={valley ? `/where-to-stay/${valley === "napa" ? "napa-valley" : "sonoma-county"}` : "/where-to-stay"}
          className="text-sm font-medium text-[var(--foreground)] hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {accommodations.map((a) => (
          <AccommodationCard
            key={a.slug}
            accommodation={a}
            showBookingCTA
            sourceComponent="NearbyAccommodations"
          />
        ))}
      </div>
    </section>
  );
}
