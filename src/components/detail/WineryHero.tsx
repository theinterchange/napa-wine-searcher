"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Wine as WineIcon,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StarRating } from "@/components/ratings/StarRating";

interface Photo {
  id: number;
  url: string;
  altText: string | null;
}

interface WineryHeroProps {
  id: number;
  slug: string;
  name: string;
  subRegion: string | null;
  valley: string | null;
  city: string | null;
  aggregateRating: number | null;
  totalRatings: number | null;
  priceLevel: number | null;
  shortDescription: string | null;
  heroImageUrl: string | null;
  websiteUrl: string | null;
  curated: boolean | null;
  curatedAt: string | null;
  reservationRequired: boolean | null;
}

function normalizePhotoUrl(url: string): string {
  return url.replace(/=s\d+[-]?[wh]?\d*$/, "");
}

export function WineryHero({
  winery,
  photos = [],
}: {
  winery: WineryHeroProps;
  photos?: Photo[];
}) {
  const seen = new Set<string>();
  const allImages: string[] = [];

  if (winery.heroImageUrl) {
    seen.add(normalizePhotoUrl(winery.heroImageUrl));
    allImages.push(winery.heroImageUrl);
  }
  for (const p of photos) {
    const norm = normalizePhotoUrl(p.url);
    if (!seen.has(norm)) {
      seen.add(norm);
      allImages.push(p.url);
    }
  }

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % allImages.length);
  }, [allImages.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  useEffect(() => {
    if (paused || allImages.length <= 1) return;
    const id = setInterval(next, 3000);
    return () => clearInterval(id);
  }, [paused, next, allImages.length]);

  const verifiedDate = winery.curatedAt
    ? new Date(winery.curatedAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="relative bg-burgundy-900 dark:bg-burgundy-950 text-white overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {allImages.length > 0 ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-[background-image] duration-700 ease-in-out"
          style={{ backgroundImage: `url(${allImages[current]})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-burgundy-800 via-burgundy-900 to-burgundy-950">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <WineIcon className="h-48 w-48" />
          </div>
        </div>
      )}

      {allImages.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div className="relative mx-auto max-w-5xl px-4 pt-32 sm:pt-40 lg:pt-56 pb-10 sm:pb-14 sm:px-6 lg:px-8">
        {(winery.subRegion || winery.valley || winery.city) && (
          <div className="flex items-center gap-2 text-white/70 text-sm mb-4">
            <MapPin className="h-4 w-4" />
            <span>
              {[
                winery.subRegion,
                winery.valley === "napa"
                  ? "Napa Valley"
                  : winery.valley === "sonoma"
                    ? "Sonoma County"
                    : null,
                winery.city,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        )}

        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          {winery.name}
        </h1>

        {winery.shortDescription && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/80">
            {winery.shortDescription}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {winery.aggregateRating && (
            <div className="flex items-center gap-2">
              <StarRating rating={winery.aggregateRating} size="md" />
              <span className="font-semibold">
                {winery.aggregateRating.toFixed(1)}
              </span>
              {winery.totalRatings != null && (
                <span className="text-white/60">
                  ({winery.totalRatings.toLocaleString()})
                </span>
              )}
            </div>
          )}
          {winery.priceLevel && (
            <span
              className="text-gold-300 font-medium"
              aria-label={`Price level ${winery.priceLevel} of 4`}
            >
              {"$".repeat(winery.priceLevel)}
            </span>
          )}
          <span className="text-sm text-white/60">
            {winery.reservationRequired
              ? "Reservations Required"
              : "Walk-ins Welcome"}
          </span>
          {winery.curated && verifiedDate && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300/80">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified {verifiedDate}
            </span>
          )}
        </div>
      </div>

      {allImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current
                  ? "w-2.5 h-2.5 bg-white"
                  : "w-2 h-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
