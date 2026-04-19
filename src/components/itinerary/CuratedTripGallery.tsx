import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";

export type CuratedTripCard = {
  slug: string;
  title: string;
  description: string | null;
  region: string | null;
  theme: string | null;
  estimatedHours: number | null;
  heroImageUrl: string | null;
  groupVibe: string | null;
  duration: string | null;
  fallbackImageUrl: string | null;
  stopCount: number;
};

interface CuratedTripGalleryProps {
  trips: CuratedTripCard[];
}

function durationLabel(duration: string | null, hours: number | null): string {
  if (duration === "half") return "Half day";
  if (duration === "full") return "Full day";
  if (duration === "weekend") return "Weekend";
  if (hours != null) return `${hours}h`;
  return "";
}

export function CuratedTripGallery({ trips }: CuratedTripGalleryProps) {
  if (trips.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Curated itineraries coming soon.
      </p>
    );
  }
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((t) => {
        const img = t.heroImageUrl ?? t.fallbackImageUrl;
        const dLabel = durationLabel(t.duration, t.estimatedHours);
        return (
          <li key={t.slug}>
            <Link
              href={`/itineraries/${t.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] w-full bg-[var(--muted)]">
                {img && (
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                {(t.region || t.groupVibe) && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    {t.region && <span>{t.region}</span>}
                    {t.region && t.groupVibe && <span>·</span>}
                    {t.groupVibe && <span>{t.groupVibe}</span>}
                  </div>
                )}
                <h3 className="font-serif text-lg font-semibold text-[var(--foreground)] group-hover:underline">
                  {t.title}
                </h3>
                {t.description && (
                  <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">
                    {t.description}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-xs text-[var(--muted-foreground)]">
                  {dLabel && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {dLabel}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {t.stopCount} stops
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
