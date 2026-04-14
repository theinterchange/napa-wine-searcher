import Link from "next/link";
import Image from "next/image";
import { type LucideIcon } from "lucide-react";

interface GuideCardProps {
  slug: string;
  label: string;
  intro: string;
  icon: LucideIcon;
  heroImage: string | null;
  href?: string;
}

export function GuideCard({
  slug,
  label,
  intro,
  icon: Icon,
  heroImage,
  href,
}: GuideCardProps) {
  return (
    <Link
      href={href ?? `/guides/${slug}`}
      className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-lg hover:border-burgundy-300 dark:hover:border-burgundy-700 transition-all"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-burgundy-100 dark:bg-burgundy-900 overflow-hidden">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={label}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-burgundy-300 dark:text-burgundy-700">
            <Icon className="h-10 w-10" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-burgundy-600 dark:text-burgundy-400 shrink-0" />
          <h3 className="text-sm font-semibold group-hover:text-burgundy-700 dark:group-hover:text-burgundy-400 transition-colors truncate">
            {label}
          </h3>
        </div>
        <p className="mt-2 text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2 sm:line-clamp-3">
          {intro}
        </p>
      </div>
    </Link>
  );
}
