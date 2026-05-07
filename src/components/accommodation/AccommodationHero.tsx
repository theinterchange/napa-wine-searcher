"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) prev();
      else next();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const valleyLabel =
    accommodation.valley === "napa" ? "Napa Valley" : "Sonoma County";

  const tags: string[] = accommodation.bestForTags
    ? JSON.parse(accommodation.bestForTags)
    : [];

  return (
    <div
      className="relative bg-burgundy-900 dark:bg-burgundy-950 text-white overflow-hidden touch-pan-y"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
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
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--ink)]/40 via-[var(--ink)]/55 to-[var(--ink)]/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)]/55 via-transparent to-transparent" />
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
            className="hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 z-10 border border-white/30 bg-black/30 backdrop-blur-sm p-2.5 text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 z-10 border border-white/30 bg-black/30 backdrop-blur-sm p-2.5 text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div className="relative mx-auto max-w-5xl px-4 pt-32 sm:pt-40 lg:pt-56 pb-12 sm:pb-16 sm:px-6 lg:px-8">
        {(accommodation.subRegion || accommodation.city) && (
          <div className="flex items-center gap-2 mb-5" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
            <MapPin className="h-3 w-3 text-[#f0d894]" />
            <span className="font-mono text-[10.5px] sm:text-[11px] tracking-[0.22em] uppercase text-[#f0d894]">
              {[accommodation.subRegion, valleyLabel, accommodation.city]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        )}

        <h1
          className="font-[var(--font-heading)] text-white text-[28px] sm:text-[44px] lg:text-[58px] leading-[1.12] sm:leading-[1.08] lg:leading-[1.05] tracking-[-0.015em] font-normal max-w-[18ch] pr-4"
          style={{ textWrap: "balance", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
        >
          {accommodation.name}
        </h1>

        <hr className="rule-brass mt-5" style={{ marginInline: 0 }} />

        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1.5" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}>
          <span className="font-[var(--font-serif-text)] text-white text-[15px] sm:text-[17px]">
            {accommodation.starRating
              ? `${accommodation.starRating}-star ${(typeLabels[accommodation.type] || accommodation.type).toLowerCase()}`
              : typeLabels[accommodation.type] || accommodation.type}
          </span>
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#f0d894] border border-[#f0d894]/50 px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-[0.18em] uppercase text-white/95" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
          {accommodation.googleRating && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-[#f0d894] text-[#f0d894]" />
              <span className="font-semibold text-white">
                {accommodation.googleRating.toFixed(1)}
              </span>
              {accommodation.googleReviewCount != null && (
                <span className="text-white/70 normal-case tracking-normal font-[var(--font-serif-text)] text-[13px]">
                  ({accommodation.googleReviewCount.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {allImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5" aria-live="polite">
          <style>{`@keyframes progress-fill { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 ${
                i === current
                  ? "relative overflow-hidden bg-white/30 w-8 h-[3px]"
                  : "bg-white/50 w-[3px] h-[3px] hover:bg-white/70"
              }`}
              aria-label={`Go to photo ${i + 1}`}
              aria-current={i === current ? "true" : undefined}
            >
              {i === current && (
                <span
                  key={current}
                  className="absolute inset-0 bg-[var(--brass)] origin-left"
                  style={{
                    animation: "progress-fill 3s linear forwards",
                    animationPlayState: paused ? "paused" : "running",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
