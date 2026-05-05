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
      className="group flex flex-col bg-[var(--paper-2)] border-t-2 border-[var(--rule)] hover:border-[var(--brass)] transition-colors"
    >
      <div className="photo-zoom relative aspect-[4/5] bg-[var(--paper-2)]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={label}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--rule)]">
            <Icon className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <span className="kicker">Guide</span>

        <hr className="rule-brass mt-3" />

        <h3 className="editorial-h2 text-[20px] mt-2 line-clamp-2 group-hover:text-[var(--color-burgundy-900)] transition-colors">
          {label}
        </h3>

        <p className="font-[var(--font-serif-text)] text-[14px] leading-relaxed text-[var(--ink-2)] mt-3 line-clamp-3 flex-1">
          {intro}
        </p>

        <div className="mt-4 pt-4 border-t border-[var(--rule-soft)] flex items-center justify-between font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
          <span>Read</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}
