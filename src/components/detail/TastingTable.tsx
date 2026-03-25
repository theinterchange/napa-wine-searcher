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
        <h2 className="font-heading text-2xl font-semibold mb-4">
          Tasting Experiences
        </h2>
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-6 py-12 text-center">
          <GlassWater className="mx-auto h-10 w-10 text-[var(--muted-foreground)]/50" />
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Tasting details aren&apos;t available online.
          </p>
          {(websiteUrl || phone) && (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
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
                  className="text-burgundy-700 dark:text-burgundy-400 underline font-medium"
                >
                  visit their website
                </TrackedLink>
              )}
              {websiteUrl && phone && " or "}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="text-burgundy-700 dark:text-burgundy-400 underline font-medium"
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
      <h2 className="font-heading text-2xl font-semibold mb-4">
        Tasting Experiences
      </h2>
      {!curated && (
        <p className="mb-3 text-xs text-[var(--muted-foreground)] italic">
          Prices and availability are approximate and may not reflect current
          offerings.
        </p>
      )}
      <div className="space-y-4">
        {tastings.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-heading text-lg font-semibold">{t.name}</h3>
              {t.price != null && (
                <span className="text-lg font-semibold text-burgundy-700 dark:text-burgundy-400">
                  {formatPrice(t.price)}
                </span>
              )}
            </div>
            {t.description && (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {t.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
              {t.durationMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {t.durationMinutes} min
                </span>
              )}
              {t.maxGroupSize && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {t.minGroupSize || 1}–{t.maxGroupSize} guests
                </span>
              )}
              {t.reservationRequired && (
                <span className="flex items-center gap-1 text-burgundy-600 dark:text-burgundy-400">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Reservation Required
                </span>
              )}
            </div>
            {t.includes && (
              <p className="mt-3 text-xs text-[var(--muted-foreground)] border-t border-[var(--border)] pt-3">
                Includes: {t.includes}
              </p>
            )}
            {websiteUrl && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
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
