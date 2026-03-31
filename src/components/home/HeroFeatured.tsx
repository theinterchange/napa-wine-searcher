"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
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
  totalWineries,
}: {
  wineries: FeaturedWinery[];
  totalWineries: number;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next]);

  const w = wineries[current];
  if (!w) return null;

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Wineries"
      className="relative min-h-[400px] sm:min-h-[500px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Fallback bg */}
      <div className="absolute inset-0 bg-burgundy-950" />

      {/* Stacked images with crossfade — using Next.js Image for optimization */}
      {wineries.map((winery, i) =>
        winery.heroImageUrl ? (
          <Image
            key={winery.slug}
            src={winery.heroImageUrl}
            alt={winery.name}
            fill
            sizes="100vw"
            priority={i === 0}
            className={`object-cover transition-opacity duration-1000 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== current}
          />
        ) : null
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />

      {/* Content */}
      <div className="relative h-full min-h-[400px] sm:min-h-[500px] flex flex-col justify-end">
        <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          {/* Slide content with fade animation */}
          <div key={current} className="animate-fade-in min-h-[120px] sm:min-h-[140px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/90 px-2.5 py-0.5 text-xs font-semibold text-burgundy-950 mb-2">
              <BadgeCheck className="h-3.5 w-3.5" />
              Featured
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-2xl">
              {w.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {w.subRegion && (
                <span className="text-sm text-white/80">
                  {w.subRegion}
                  {w.valley && (
                    <> &middot; {w.valley === "napa" ? "Napa Valley" : "Sonoma County"}</>
                  )}
                </span>
              )}
              {w.googleRating && (
                <span className="inline-flex items-center gap-1 text-sm text-white/90">
                  <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                  {w.googleRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="mt-6">
            <HeroSearchTrigger />
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href={`/wineries/${w.slug}`}
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-burgundy-950 hover:bg-gold-400 transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
            >
              Visit Winery
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/wineries"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
            >
              Browse Wineries
            </Link>
            <Link
              href="/map"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
            >
              <Map className="h-4 w-4" />
              View Map
            </Link>
          </div>
        </div>

        {/* Navigation arrows */}
        {wineries.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
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
                className={`rounded-full transition-all focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 ${
                  i === current
                    ? "relative overflow-hidden bg-white/30 w-6 h-2"
                    : "bg-white/50 w-2 h-2 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
              >
                {i === current && (
                  <span
                    key={current}
                    className="absolute inset-0 rounded-full bg-white origin-left"
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
