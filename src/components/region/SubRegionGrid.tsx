import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {subRegions.map((sr) => (
        <Link
          key={sr.slug}
          href={`${valleyPrefix[valley]}/${sr.slug}`}
          className="group flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-burgundy-400 hover:shadow-sm dark:hover:border-burgundy-600 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-burgundy-50 dark:bg-burgundy-950 shrink-0">
            <MapPin className="h-5 w-5 text-burgundy-600 dark:text-burgundy-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-sm font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
              {sr.name}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {sr.count} {sr.count === 1 ? "winery" : "wineries"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-burgundy-600 dark:group-hover:text-burgundy-400 transition-colors shrink-0" />
        </Link>
      ))}
    </div>
  );
}
