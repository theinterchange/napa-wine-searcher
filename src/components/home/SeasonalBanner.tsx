import Link from "next/link";
import { type SeasonalBannerDef } from "@/lib/seasonal";

interface SeasonalBannerProps {
  banner: SeasonalBannerDef;
}

export function SeasonalBanner({ banner }: SeasonalBannerProps) {
  const Icon = banner.icon;

  return (
    <section className={`${banner.bgClass} text-white`}>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-center">
          <span className="flex items-center gap-2 font-semibold">
            <Icon className="h-4 w-4" />
            {banner.title}
          </span>
          {banner.links.length > 0 && (
            <span className="flex gap-3">
              {banner.links.map((link, i) => (
                <span key={link.href} className="flex items-center gap-3">
                  {i > 0 && (
                    <span className="text-white/40" aria-hidden="true">
                      |
                    </span>
                  )}
                  <Link
                    href={link.href}
                    className="underline underline-offset-2 hover:text-gold-300 transition-colors"
                  >
                    {link.label} &rarr;
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
