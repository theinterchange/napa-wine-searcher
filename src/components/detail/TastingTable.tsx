import { Clock, Users, CalendarCheck, GlassWater } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { TrackedLink } from "@/components/monetization/TrackedLink";
import { BookTastingCTA } from "@/components/monetization/BookTastingCTA";

interface Tasting {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  durationMinutes: number | null;
  includes: string | null;
  reservationRequired: boolean | null;
  minGroupSize: number | null;
  maxGroupSize: number | null;
  sourceUrl?: string | null;
}

export function TastingTable({
  tastings,
  curated = false,
  websiteUrl,
  phone,
  wineryId,
  winerySlug,
  wineryName,
}: {
  tastings: Tasting[];
  curated?: boolean;
  websiteUrl?: string | null;
  phone?: string | null;
  wineryId?: number;
  winerySlug?: string;
  wineryName?: string;
}) {
  if (tastings.length === 0) {
    return (
      <div>
        <span className="kicker">The Tasting</span>
        <h2 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">
          Tasting <em>experiences.</em>
        </h2>
        <hr className="rule-brass mt-3" style={{ marginInline: 0 }} />
        <div className="mt-6 border border-dashed border-[var(--rule)] bg-[var(--paper-2)]/40 px-6 py-12 text-center">
          <GlassWater className="mx-auto h-10 w-10 text-[var(--brass)]/50" />
          <p className="mt-3 font-[var(--font-serif-text)] text-[15px] text-[var(--ink-2)]">
            Tasting details aren&apos;t available online.
          </p>
          {(websiteUrl || phone) && (
            <p className="mt-2 font-[var(--font-serif-text)] text-[14px] text-[var(--ink-2)]">
              Contact {wineryName || "the winery"} directly for current
              offerings
              {" \u2014 "}
              {websiteUrl && (
                <TrackedLink
                  href={websiteUrl}
                  clickType="website"
                  wineryId={wineryId}
                  sourcePage={
                    winerySlug ? `/wineries/${winerySlug}` : undefined
                  }
                  sourceComponent="TastingTable"
                  className="text-[var(--ink)] underline decoration-[var(--brass)] underline-offset-4 font-medium"
                >
                  visit their website
                </TrackedLink>
              )}
              {websiteUrl && phone && " or "}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="text-[var(--ink)] underline decoration-[var(--brass)] underline-offset-4 font-medium"
                >
                  call {phone}
                </a>
              )}
              .
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="kicker">The Tasting</span>
      <h2 className="editorial-h2 text-[26px] sm:text-[32px] mt-2">
        Tasting <em>experiences.</em>
      </h2>
      <hr className="rule-brass mt-3" style={{ marginInline: 0 }} />
      {!curated && (
        <p className="mt-4 font-[var(--font-serif-text)] text-[12.5px] text-[var(--ink-3)]">
          Prices and availability are approximate and may not reflect current
          offerings.
        </p>
      )}
      <div className="mt-6 space-y-5">
        {tastings.map((t) => (
          <div
            key={t.id}
            className="border border-[var(--rule-soft)] bg-[var(--paper-2)]/40 p-6 hover:border-[var(--brass)]/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-[var(--font-heading)] text-[20px] leading-[1.2] font-normal text-[var(--ink)] tracking-[-0.01em]">{t.name}</h3>
              {t.price != null && (
                <span className="font-[var(--font-heading)] text-[20px] font-normal text-[var(--brass-2)] tabular-nums">
                  {formatPrice(t.price)}
                </span>
              )}
            </div>
            {t.description && (
              <p className="mt-3 font-[var(--font-serif-text)] text-[15px] leading-[1.6] text-[var(--ink-2)]" style={{ textWrap: "pretty" }}>
                {t.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10.5px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
              {t.durationMinutes && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-[var(--brass)]" />
                  {t.durationMinutes} min
                </span>
              )}
              {t.maxGroupSize && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-[var(--brass)]" />
                  {t.minGroupSize || 1}–{t.maxGroupSize} guests
                </span>
              )}
              {t.reservationRequired && (
                <span className="flex items-center gap-1.5 text-burgundy-700">
                  <CalendarCheck className="h-3 w-3" />
                  Reservation Required
                </span>
              )}
            </div>
            {t.includes && (
              <p className="mt-4 pt-4 border-t border-[var(--rule-soft)] font-[var(--font-serif-text)] text-[13px] text-[var(--ink-3)]">
                Includes: {t.includes}
              </p>
            )}
            {websiteUrl && (
              <div className="mt-4 pt-4 border-t border-[var(--rule-soft)]">
                <BookTastingCTA
                  websiteUrl={
                    t.sourceUrl?.startsWith("http") ? t.sourceUrl : websiteUrl
                  }
                  wineryId={wineryId}
                  winerySlug={winerySlug}
                  sourceComponent="TastingTable"
                  size="sm"
                  label="Book This"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
