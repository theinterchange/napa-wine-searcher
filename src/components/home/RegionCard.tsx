import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface RegionCardProps {
  name: string;
  slug: string;
  valley: "napa" | "sonoma";
  count: number;
  signatureVarietal: string;
  whyVisit: string;
  heroImageUrl: string | null;
}

export function RegionCard({
  name,
  slug,
  valley,
  count,
  signatureVarietal,
  whyVisit,
  heroImageUrl,
}: RegionCardProps) {
  const href =
    valley === "napa" ? `/napa-valley/${slug}` : `/sonoma-county/${slug}`;
  const valleyLabel = valley === "napa" ? "Napa Valley" : "Sonoma County";

  return (
    <Link
      href={href}
      className="group flex flex-col bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] transition-colors"
    >
      <div className="photo-zoom relative aspect-[16/10] bg-[var(--paper-2)]">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={`Wineries in ${name}`}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--rule)] font-[var(--font-heading)] text-3xl">
            {name}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <span className="kicker">{valleyLabel}</span>

        <hr className="rule-brass mt-3" />

        <h3 className="editorial-h2 text-[26px] mt-2 group-hover:text-[var(--color-burgundy-900)] transition-colors">
          {name}
        </h3>

        <p className="font-[var(--font-serif-text)] text-[15px] leading-relaxed text-[var(--ink-2)] mt-3 line-clamp-3 flex-1">
          {whyVisit}
        </p>

        <div className="mt-4 pt-4 border-t border-[var(--rule-soft)] flex items-center justify-between font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
          <span>
            {count} {count === 1 ? "winery" : "wineries"} · {signatureVarietal}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-[var(--ink-2)] transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
