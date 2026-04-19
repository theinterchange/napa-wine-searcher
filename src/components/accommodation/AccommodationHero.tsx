"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  MapPin,
  BedDouble,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Photo {
  id: number;
  url: string;
  caption: string | null;
}

interface AccommodationHeroProps {
  name: string;
  type: string;
  subRegion: string | null;
  valley: string;
  city: string | null;
  priceTier: number | null;
  starRating: number | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  heroImageUrl: string | null;
  bestForTags: string | null;
}

const typeLabels: Record<string, string> = {
  hotel: "Hotel",
  inn: "Inn",
  resort: "Resort",
  vacation_rental: "Vacation Rental",
  bed_and_breakfast: "Bed & Breakfast",
};

function normalizePhotoUrl(url: string): string {
  return url.replace(/=s\d+[-]?[wh]?\d*$/, "");
}

export function AccommodationHero({
  accommodation,
  photos = [],
}: {
  accommodation: AccommodationHeroProps;
  photos?: Photo[];
}) {
  const seen = new Set<string>();
  const allImages: string[] = [];

  if (accommodation.heroImageUrl) {
    seen.add(normalizePhotoUrl(accommodation.heroImageUrl));
    allImages.push(accommodation.heroImageUrl);
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

  const valleyLabel =
    accommodation.valley === "napa" ? "Napa Valley" : "Sonoma County";

  const tags: string[] = accommodation.bestForTags
    ? JSON.parse(accommodation.bestForTags)
    : [];

  return (
    <div
      className="relative bg-burgundy-900 dark:bg-burgundy-950 text-white overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {allImages.length > 0 ? (
        <>
          {allImages.map((url, i) => {
            const shouldRender =
              i === current ||
              i === (current + 1) % allImages.length ||
              i === (current - 1 + allImages.length) % allImages.length;
            if (!shouldRender) return null;
            return (
              <Image
                key={url}
                src={url}
                alt={`${accommodation.name} photo ${i + 1}`}
                fill
                sizes="100vw"
                quality={85}
                priority={i === 0}
                className={`object-cover transition-opacity duration-700 ease-in-out ${
                  i === current ? "opacity-100" : "opacity-0"
                }`}
              />
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-burgundy-800 via-burgundy-900 to-burgundy-950">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <BedDouble className="h-48 w-48" />
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
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium">
            {accommodation.starRating
              ? `${accommodation.starRating}-star ${(typeLabels[accommodation.type] || accommodation.type).toLowerCase()}`
              : typeLabels[accommodation.type] || accommodation.type}
          </span>
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gold-500/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-gold-200"
            >
              {tag}
            </span>
          ))}
        </div>

        {(accommodation.subRegion || accommodation.city) && (
          <div className="flex items-center gap-2 text-white/70 text-sm mb-4">
            <MapPin className="h-4 w-4" />
            <span>
              {[accommodation.subRegion, valleyLabel, accommodation.city]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        )}

        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          {accommodation.name}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {accommodation.googleRating && (
            <div className="flex items-center gap-1.5">
              <Star className="h-5 w-5 fill-gold-400 text-gold-400" />
              <span className="font-semibold text-lg">
                {accommodation.googleRating.toFixed(1)}
              </span>
              {accommodation.googleReviewCount != null && (
                <span className="text-white/60">
                  ({accommodation.googleReviewCount.toLocaleString()} reviews)
                </span>
              )}
            </div>
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
