"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Star,
  Wine,
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
    const id = setInterval(next, 6000);
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
      {/* Stacked background images with crossfade */}
      {wineries.map((winery, i) => (
        <div
          key={winery.slug}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
          style={
            winery.heroImageUrl
              ? { backgroundImage: `url(${winery.heroImageUrl})` }
              : undefined
          }
          aria-hidden={i !== current}
        />
      ))}

      {/* Fallback bg if no image */}
      <div className="absolute inset-0 bg-burgundy-950" style={{ zIndex: -1 }} />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />

      {/* Content */}
      <div className="relative h-full min-h-[400px] sm:min-h-[500px] flex flex-col justify-end">
        <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          {/* Brand pill */}
          <div className="flex items-center gap-2 mb-3">
            <Wine className="h-5 w-5 text-gold-400" />
            <span className="text-sm font-medium text-gold-400/80">
              Napa Sonoma Guide
            </span>
          </div>

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
                  {w.googleRating}
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
              className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-burgundy-950 hover:bg-gold-400 transition-colors"
            >
              Visit Winery
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/wineries"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Browse All {totalWineries} Wineries
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {wineries.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" aria-live="polite">
            {wineries.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${
                  i === current
                    ? "bg-white w-6 h-2"
                    : "bg-white/50 w-2 h-2 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
