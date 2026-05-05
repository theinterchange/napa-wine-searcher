import Link from "next/link";
import Image from "next/image";
import { Map, ArrowRight } from "lucide-react";

interface ValleyHeroProps {
  title: string;
  subtitle: string;
  wineryCount: number;
  subRegionCount: number;
  valley: "napa" | "sonoma";
  heroImageUrl?: string | null;
}

function splitItalicLastWord(title: string): React.ReactNode {
  const parts = title.split(" ");
  if (parts.length === 1) return title;
  const last = parts.pop();
  return (
    <>
      {parts.join(" ")}{" "}
      <em
        className="italic font-normal"
        style={{ color: "#f0d894" }}
      >
        {last}
      </em>
    </>
  );
}

export function ValleyHero({
  title,
  subtitle,
  wineryCount,
  subRegionCount,
  valley,
  heroImageUrl,
}: ValleyHeroProps) {
  const valleyLabel = valley === "napa" ? "Napa Valley" : "Sonoma County";

  return (
    <section className="relative bg-[var(--ink)] overflow-hidden">
      {heroImageUrl && (
        <>
          <Image
            src={heroImageUrl}
            alt={`${valleyLabel} wine country`}
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--ink)]/40 via-[var(--ink)]/55 to-[var(--ink)]/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)]/55 via-transparent to-transparent" />
        </>
      )}

      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-14 sm:px-6 sm:pt-24 sm:pb-18 lg:px-8 lg:pt-28 lg:pb-20">
        <span className="font-mono text-[10.5px] sm:text-[11px] tracking-[0.22em] uppercase text-[#f0d894]" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
          {valleyLabel} · The Region Guide
        </span>

        <h1
          className="mt-4 font-[var(--font-heading)] text-white text-[34px] sm:text-[44px] lg:text-[56px] leading-[1.05] tracking-[-0.015em] font-normal max-w-[20ch]"
          style={{ textWrap: "balance", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
        >
          {splitItalicLastWord(title)}
        </h1>

        <hr className="rule-brass mt-5" style={{ marginInline: 0 }} />

        <p
          className="mt-5 max-w-[56ch] font-[var(--font-serif-text)] text-white text-[16px] sm:text-[18px] leading-[1.55]"
          style={{ textWrap: "pretty", textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}
        >
          {subtitle}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10.5px] sm:text-[11px] tracking-[0.22em] uppercase text-white/85" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
          <span>
            <strong className="text-white font-semibold">{wineryCount}</strong>{" "}
            Wineries
          </span>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <span>
            <strong className="text-white font-semibold">{subRegionCount}</strong>{" "}
            Sub-Regions
          </span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/wineries?valley=${valley}`}
            className="inline-flex items-center gap-2 bg-white px-5 py-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--ink)] hover:bg-[#f0d894] transition-colors"
          >
            Explore the wineries
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/map?valley=${valley}`}
            className="inline-flex items-center gap-2 border border-white/60 bg-white/5 backdrop-blur-sm px-5 py-3 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-white hover:bg-white/15 transition-colors"
          >
            <Map className="h-3.5 w-3.5" />
            View Map
          </Link>
        </div>
      </div>
    </section>
  );
}
