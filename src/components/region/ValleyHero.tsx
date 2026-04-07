import Link from "next/link";
import Image from "next/image";
import { Wine, Map, ArrowRight } from "lucide-react";

interface ValleyHeroProps {
  title: string;
  subtitle: string;
  wineryCount: number;
  subRegionCount: number;
  valley: "napa" | "sonoma";
  heroImageUrl?: string | null;
}

export function ValleyHero({
  title,
  subtitle,
  wineryCount,
  subRegionCount,
  valley,
  heroImageUrl,
}: ValleyHeroProps) {
  return (
    <section className="relative bg-burgundy-950 overflow-hidden">
      {/* Background image with gradient */}
      {heroImageUrl && (
        <>
          <Image
            src={heroImageUrl}
            alt={`${valley === "napa" ? "Napa Valley" : "Sonoma County"} wine country`}
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </>
      )}

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex items-center gap-2 mb-4">
          <Wine className="h-5 w-5 text-gold-400" />
          <span className="text-sm font-medium text-gold-400">
            Napa Sonoma Guide
          </span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-2xl">
          {title}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-white/70 max-w-xl">
          {subtitle}
        </p>

        {/* Stat bar */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/70">
          <span>
            <strong className="text-white">{wineryCount}</strong> Wineries
          </span>
          <span className="text-white/50" aria-hidden="true">|</span>
          <span>
            <strong className="text-white">{subRegionCount}</strong> Sub-Regions
          </span>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={`/wineries?valley=${valley}`}
            className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-burgundy-950 hover:bg-gold-400 transition-colors"
          >
            Explore All
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/map?valley=${valley}`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            <Map className="h-4 w-4" />
            View Map
          </Link>
        </div>
      </div>
    </section>
  );
}
