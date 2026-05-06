import Link from "next/link";
import { type SeasonalBannerDef } from "@/lib/seasonal";

interface SeasonalBannerProps {
  banner: SeasonalBannerDef;
}

export function SeasonalBanner({ banner }: SeasonalBannerProps) {
  const Icon = banner.icon;

  return (
    <section className="bg-[var(--ink)] text-[var(--paper)] border-y border-[var(--brass)]/30">
      <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
          <span className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#f0d894]">
            <Icon className="h-3.5 w-3.5" />
            {banner.mobileTitle ? (
              <>
                <span className="sm:hidden">{banner.mobileTitle}</span>
                <span className="hidden sm:inline">{banner.title}</span>
              </>
            ) : (
              banner.title
            )}
          </span>
          {banner.links.length > 0 && (
            <span className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
              {banner.links.map((link, i) => (
                <span key={link.href} className="flex items-center gap-5">
                  {i > 0 && (
                    <span className="text-[var(--paper)]/30" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <Link
                    href={link.href}
                    className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[var(--paper)] border-b border-[var(--brass)] pb-0.5 hover:text-[#f0d894] hover:border-[#f0d894] transition-colors"
                  >
                    {link.label} →
                  </Link>
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
