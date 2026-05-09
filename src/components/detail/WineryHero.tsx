"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
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
  // Defer mounting neighbor images until after first paint so they don't
  // contend for bandwidth with the LCP image on slow networks.
  const [neighborsMounted, setNeighborsMounted] = useState(false);

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

  useEffect(() => {
    if (allImages.length <= 1) return;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback;
    if (idle) {
      const handle = idle(() => setNeighborsMounted(true), { timeout: 2000 });
      return () => {
        const cancel = (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
        if (cancel) cancel(handle);
      };
    }
    const t = window.setTimeout(() => setNeighborsMounted(true), 1500);
    return () => window.clearTimeout(t);
  }, [allImages.length]);

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

  const verifiedDate = winery.curatedAt
    ? new Date(winery.curatedAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

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
            const isCurrent = i === current;
            const isNeighbor =
              i === (current + 1) % allImages.length ||
              i === (current - 1 + allImages.length) % allImages.length;
            const shouldRender = isCurrent || (neighborsMounted && isNeighbor);
            if (!shouldRender) return null;
            return (
              <Image
                key={url}
                src={url}
                alt={`${winery.name} photo ${i + 1}`}
                fill
                sizes="100vw"
                quality={75}
                priority={i === 0}
                className={`object-cover transition-opacity duration-700 ease-in-out ${
                  isCurrent ? "opacity-100" : "opacity-0"
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
            <WineIcon className="h-48 w-48" />
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
        {(winery.subRegion || winery.valley || winery.city) && (
          <div className="flex items-center gap-2 mb-5" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
            <MapPin className="h-3 w-3 text-[#f0d894]" />
            <span className="font-mono text-[10.5px] sm:text-[11px] tracking-[0.22em] uppercase text-[#f0d894]">
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

        <h1
          className="font-[var(--font-heading)] text-white text-[28px] sm:text-[44px] lg:text-[58px] leading-[1.12] sm:leading-[1.08] lg:leading-[1.05] tracking-[-0.015em] font-normal max-w-[18ch] pr-4"
          style={{ textWrap: "balance", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
        >
          {winery.name}
        </h1>

        <hr className="rule-brass mt-5" style={{ marginInline: 0 }} />

        {winery.shortDescription && (
          <p
            className="mt-5 max-w-2xl font-[var(--font-serif-text)] text-white text-[16px] sm:text-[18px] leading-[1.55]"
            style={{ textWrap: "pretty", textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}
          >
            {winery.shortDescription}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-[0.18em] uppercase text-white/95" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
          {winery.aggregateRating && (
            <div className="flex items-center gap-2">
              <StarRating rating={winery.aggregateRating} size="md" />
              <span className="font-semibold text-white">
                {winery.aggregateRating.toFixed(1)}
              </span>
              {winery.totalRatings != null && (
                <span className="text-white/70 normal-case tracking-normal font-[var(--font-serif-text)] text-[13px]">
                  ({winery.totalRatings.toLocaleString()})
                </span>
              )}
            </div>
          )}
          {winery.priceLevel && (
            <span
              className="text-[#f0d894] font-medium"
              aria-label={`Price level ${winery.priceLevel} of 4`}
            >
              {"$".repeat(winery.priceLevel)}
            </span>
          )}
          <span>
            {winery.reservationRequired ? "Reservations Required" : "Walk-ins Welcome"}
          </span>
          {winery.curated && verifiedDate && (
            <span className="inline-flex items-center gap-1.5 text-[10.5px] text-emerald-300">
              <BadgeCheck className="h-3 w-3" />
              Verified {verifiedDate}
            </span>
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
