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

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-lg hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
    >
      {/* Image with region name overlay */}
      <div className="relative aspect-[16/9] bg-burgundy-100 dark:bg-burgundy-900 overflow-hidden">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={`Wineries in ${name}`}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-burgundy-300 dark:text-burgundy-700 font-heading text-2xl font-bold">
            {name}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-white">
            {name}
          </h3>
        </div>
      </div>

      {/* Editorial content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <span className="inline-flex self-start px-2.5 py-0.5 rounded-full text-xs font-medium bg-burgundy-100 text-burgundy-900 dark:bg-burgundy-900 dark:text-burgundy-100">
          {signatureVarietal}
        </span>
        <p className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed line-clamp-3">
          {whyVisit}
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>
            {count} {count === 1 ? "winery" : "wineries"} &middot;{" "}
            {valley === "napa" ? "Napa Valley" : "Sonoma County"}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
}
