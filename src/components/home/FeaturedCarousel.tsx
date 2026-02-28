"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BadgeCheck, Star } from "lucide-react";

interface FeaturedWinery {
  slug: string;
  name: string;
  heroImageUrl: string | null;
  subRegion: string | null;
  valley: string | null;
  googleRating: number | null;
}

export function FeaturedCarousel({
  wineries,
}: {
  wineries: FeaturedWinery[];
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

  if (wineries.length === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Wineries"
      className="relative overflow-hidden rounded-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {wineries.map((w, i) => (
          <Link
            key={w.slug}
            href={`/wineries/${w.slug}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${wineries.length}: ${w.name}`}
            className="relative flex-shrink-0 w-full aspect-[2.5/1] min-h-[240px] block"
          >
            {w.heroImageUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${w.heroImageUrl})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
            <div className="relative h-full flex flex-col justify-end p-6 sm:p-8">
              <span className="inline-flex items-center gap-1 self-start rounded-full bg-gold-500/90 px-2.5 py-0.5 text-xs font-semibold text-burgundy-950 mb-2">
                <BadgeCheck className="h-3.5 w-3.5" />
                Featured
              </span>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                {w.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
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
          </Link>
        ))}
      </div>

      {/* Navigation arrows */}
      {wineries.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
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
              onClick={(e) => { e.preventDefault(); setCurrent(i); }}
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
  );
}
