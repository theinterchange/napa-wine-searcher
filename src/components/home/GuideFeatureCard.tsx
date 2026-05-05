import Link from "next/link";
import Image from "next/image";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface GuideFeatureCardProps {
  slug: string;
  label: string;
  intro: string;
  icon: LucideIcon;
  heroImage: string | null;
}

export function GuideFeatureCard({
  slug,
  label,
  intro,
  icon: Icon,
  heroImage,
}: GuideFeatureCardProps) {
  return (
    <Link
      href={`/guides/${slug}`}
      className="group flex flex-col sm:flex-row rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-lg hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
    >
      {/* Image */}
      <div className="relative sm:w-2/5 aspect-[16/9] sm:aspect-auto bg-burgundy-100 dark:bg-burgundy-900 overflow-hidden">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={label}
            fill
            sizes="(max-width: 640px) 100vw, 40vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-burgundy-300 dark:text-burgundy-700">
            <Icon className="h-12 w-12" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center flex-1 p-5 sm:p-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Guide
        </span>
        <h3 className="mt-2 font-[var(--font-heading)] text-[22px] sm:text-[26px] font-normal tracking-[-0.01em] text-[var(--ink)] group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors">
          {label}
        </h3>
        <p className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed line-clamp-3">
          {intro}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)] group-hover:underline">
          Read the Guide
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
