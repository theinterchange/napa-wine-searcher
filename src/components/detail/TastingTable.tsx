import { Clock, Users, CalendarCheck, GlassWater } from "lucide-react";
import { formatPrice } from "@/lib/utils";

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
}

export function TastingTable({
  tastings,
  curated = false,
  websiteUrl,
  phone,
}: {
  tastings: Tasting[];
  curated?: boolean;
  websiteUrl?: string | null;
  phone?: string | null;
}) {
  if (tastings.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="font-heading text-2xl font-semibold mb-4">
          Tasting Experiences
        </h2>
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-6 py-12 text-center">
          <GlassWater className="mx-auto h-10 w-10 text-[var(--muted-foreground)]/50" />
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Tasting details aren&apos;t available online.
            {(websiteUrl || phone) && (
              <>
                {" "}
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-burgundy-700 dark:text-burgundy-400 underline"
                  >
                    Visit their website
                  </a>
                )}
                {websiteUrl && phone && " or "}
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="text-burgundy-700 dark:text-burgundy-400 underline"
                  >
                    call {phone}
                  </a>
                )}
                {" "}for current offerings.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="font-heading text-2xl font-semibold mb-4">
        Tasting Experiences
      </h2>
      {!curated && (
        <p className="mb-3 text-xs text-[var(--muted-foreground)] italic">
          Prices and availability are approximate and may not reflect current offerings.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tastings.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
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
          </div>
        ))}
      </div>
    </div>
  );
}
