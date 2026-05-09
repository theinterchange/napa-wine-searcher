"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Map,
  ArrowRight,
} from "lucide-react";
import { HeroSearchTrigger } from "./HeroSearchTrigger";

interface FeaturedWinery {
  slug: string;
  name: string;
  heroImageUrl: string | null;
  subRegion: string | null;
  valley: string | null;
  googleRating: number | null;
}

export function HeroFeatured({
  wineries,
}: {
  wineries: FeaturedWinery[];
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  // Defer rendering the next-slide image until after first paint so it
  // doesn't compete with the LCP image for bandwidth.
  const [nextSlideMounted, setNextSlideMounted] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % wineries.length);
  }, [wineries.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + wineries.length) % wineries.length);
  }, [wineries.length]);

  useEffect(() => {
    if (paused || wineries.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [paused, next, wineries.length]);

  useEffect(() => {
    if (wineries.length <= 1) return;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback;
    if (idle) {
      const handle = idle(() => setNextSlideMounted(true), { timeout: 2500 });
      return () => {
        const cancel = (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
        if (cancel) cancel(handle);
      };
    }
    const t = window.setTimeout(() => setNextSlideMounted(true), 2000);
    return () => window.clearTimeout(t);
  }, [wineries.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next]);

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

  const w = wineries[current];
  if (!w) return null;

  const valleyLabel = w.valley === "napa" ? "Napa Valley" : "Sonoma County";

  const now = new Date();
  const monthIdx = now.getUTCMonth();
  const yearStr = now.getUTCFullYear();

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const seasonLabel = `${MONTH_NAMES[monthIdx]} ${yearStr}`;

  const MONTHLY_DISPATCH = [
    "Pruning the vines",        // Jan
    "Mustard in bloom",         // Feb
    "Bud break",                // Mar
    "Flowering in the vines",   // Apr
    "Bloom & BottleRock",       // May
    "Solstice in the vineyards",// Jun
    "High summer",              // Jul
    "Veraison",                 // Aug
    "Crush begins",             // Sep
    "Harvest in full swing",    // Oct
    "Cellar season",            // Nov
    "Holiday tastings",         // Dec
  ];
  const monthlyDispatch = MONTHLY_DISPATCH[monthIdx];

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Wineries"
      className="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] overflow-hidden bg-[var(--ink)] touch-pan-y"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Stacked images with crossfade — only render slides the user has
          seen plus the next one (for crossfade preload). Avoids the LCP hit
          of letting the browser pull every featured image at mount. */}
      {wineries.map((winery, i) => {
        const nextIdx = (current + 1) % wineries.length;
        const isCurrent = i === current;
        const isNext = i === nextIdx;
        // Only render the current slide on first paint; defer next slide
        // until idle so the LCP image has uncontested bandwidth.
        if (!winery.heroImageUrl) return null;
        if (!isCurrent && !(isNext && nextSlideMounted)) return null;
        return (
          <Image
            key={winery.slug}
            src={winery.heroImageUrl}
            alt={winery.name}
            fill
            sizes="100vw"
            quality={75}
            priority={isCurrent}
            loading={isCurrent ? "eager" : "lazy"}
            className={`object-cover transition-opacity duration-1000 ${
              isCurrent ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!isCurrent}
          />
        );
      })}

      {/* Editorial gradient overlay — strong vertical fade for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--ink)]/40 via-[var(--ink)]/55 to-[var(--ink)]/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)]/60 via-transparent to-transparent" />

      <div className="relative h-full min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] flex flex-col">
        {/* Top meta row — season + featured (left), AVA + rating (right) */}
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
          <div
            className="flex items-center justify-between gap-4"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
          >
            {/* Left: season · monthly dispatch */}
            <span className="font-mono text-[10.5px] sm:text-[11px] tracking-[0.22em] uppercase text-white/90 inline-flex items-center gap-2">
              <span>{seasonLabel}</span>
              <span className="opacity-50">·</span>
              <span className="text-[#f0d894]">{monthlyDispatch}</span>
            </span>

            {/* Right: AVA · valley · rating */}
            {(w.subRegion || w.googleRating != null) && (
              <span
                key={`meta-${current}`}
                className="animate-fade-in font-mono text-[10.5px] sm:text-[11px] tracking-[0.22em] uppercase text-white/90 text-right"
              >
                {w.subRegion}
                {w.valley && <> · {valleyLabel}</>}
                {w.googleRating != null && (
                  <>
                    <span className="mx-2 opacity-60">·</span>
                    <Star className="inline-block h-3 w-3 fill-[#f0d894] text-[#f0d894] -mt-px mr-1" />
                    {w.googleRating.toFixed(1)}
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Cover content anchored to bottom-left */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
            {/* Site title — small kicker above the cover story */}
            <span
              className="block font-mono text-[10.5px] sm:text-[11px] tracking-[0.22em] uppercase text-white/85"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              <span className="sm:hidden">Napa &amp; Sonoma Wineries</span>
              <span className="hidden sm:inline">Napa &amp; Sonoma Wineries — The Complete Visitor&apos;s Guide</span>
            </span>

            {/* H1 — winery name, capped to 2 lines */}
            <h1
              key={`h1-${current}`}
              className="animate-fade-in font-[var(--font-heading)] text-white leading-[1.15] tracking-[-0.015em] text-[34px] sm:text-[44px] lg:text-[52px] font-normal mt-3 line-clamp-2 max-w-[18ch] pr-4"
              style={{ textWrap: "balance", textShadow: "0 2px 24px rgba(0,0,0,0.55)" }}
            >
              {w.name}
            </h1>

            {/* Search trigger */}
            <div className="mt-7 max-w-3xl">
              <HeroSearchTrigger />
            </div>

            {/* CTAs */}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/wineries/${w.slug}`}
                className="inline-flex items-center gap-2 bg-[#f0d894] px-5 py-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
              >
                Visit Winery
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/wineries"
                className="inline-flex items-center gap-2 border border-white/60 bg-white/5 backdrop-blur-sm px-5 py-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-white hover:bg-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
              >
                Browse Wineries
              </Link>
              <Link
                href="/map"
                className="hidden sm:inline-flex items-center gap-2 border border-white/60 bg-white/5 backdrop-blur-sm px-5 py-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-white hover:bg-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
              >
                <Map className="h-3.5 w-3.5" />
                View Map
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        {wineries.length > 1 && (
          <>
            <button
              onClick={prev}
              className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 border border-white/30 bg-black/30 backdrop-blur-sm p-2.5 text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 border border-white/30 bg-black/30 backdrop-blur-sm p-2.5 text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {wineries.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" aria-live="polite">
            <style>{`@keyframes progress-fill { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>
            {wineries.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 ${
                  i === current
                    ? "relative overflow-hidden bg-white/30 w-8 h-[3px]"
                    : "bg-white/50 w-[3px] h-[3px] hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
              >
                {i === current && (
                  <span
                    key={current}
                    className="absolute inset-0 bg-[var(--brass)] origin-left"
                    style={{
                      animation: "progress-fill 5s linear forwards",
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
