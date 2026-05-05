import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SubRegion {
  name: string;
  slug: string;
  count: number;
}

interface SubRegionGridProps {
  subRegions: SubRegion[];
  valley: "napa" | "sonoma";
}

const valleyPrefix = {
  napa: "/napa-valley",
  sonoma: "/sonoma-county",
};

export function SubRegionGrid({ subRegions, valley }: SubRegionGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0 border-t border-[var(--rule-soft)]">
      {subRegions.map((sr) => (
        <Link
          key={sr.slug}
          href={`${valleyPrefix[valley]}/${sr.slug}`}
          className="group flex items-baseline justify-between gap-4 border-b border-[var(--rule-soft)] py-5 transition-colors hover:bg-[var(--paper-2)]/40 focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2"
        >
          <div className="min-w-0 flex-1">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass-2)]">
              {valley === "napa" ? "Napa" : "Sonoma"} · Sub-AVA
            </span>
            <h3 className="mt-1.5 font-[var(--font-heading)] text-[20px] leading-[1.15] font-normal text-[var(--ink)] tracking-[-0.01em] group-hover:text-[var(--brass-2)] transition-colors">
              {sr.name}
            </h3>
            <p className="mt-1 font-[var(--font-serif-text)] text-[13px] text-[var(--ink-3)]">
              {sr.count} {sr.count === 1 ? "winery" : "wineries"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--ink-3)] group-hover:text-[var(--brass)] transition-colors shrink-0" />
        </Link>
      ))}
    </div>
  );
}
