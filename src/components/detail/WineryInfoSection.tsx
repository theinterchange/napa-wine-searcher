import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Dog,
  TreePine,
  CalendarCheck,
  Baby,
  Info,
  Route,
  Leaf,
} from "lucide-react";
import Link from "next/link";
import { TrackedLink } from "@/components/monetization/TrackedLink";
import { BookTastingCTA } from "@/components/monetization/BookTastingCTA";

interface Hours {
  mon?: string;
  tue?: string;
  wed?: string;
  thu?: string;
  fri?: string;
  sat?: string;
  sun?: string;
}

interface DayTrip {
  slug: string;
  title: string;
}

interface WineryInfoProps {
  id: number;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  visitUrl: string | null;
  hoursJson: string | null;
  reservationRequired: boolean | null;
  dogFriendly: boolean | null;
  dogFriendlyNote: string | null;
  dogFriendlySource: string | null;
  picnicFriendly: boolean | null;
  kidFriendly: boolean | null;
  kidFriendlyNote: string | null;
  kidFriendlySource: string | null;
  kidFriendlyConfidence: string | null;
  sustainableFarming: boolean | null;
  sustainableNote: string | null;
  sustainableSource: string | null;
  description: string | null;
  whyVisit: string | null;
  theSetting: string | null;
  visitorTips: string | null;
  curated: boolean | null;
  curatedAt: string | null;
  lastScrapedAt: string | null;
  updatedAt: string | null;
}

/* ── Editorial Description ── */
export function WineryDescription({
  description,
}: {
  description: string | null;
}) {
  if (!description) return null;

  return (
    <p className="text-base leading-relaxed text-[var(--muted-foreground)]">
      {description}
    </p>
  );
}

/* ── Sticky Sidebar Visit Card ── */
export function WinerySidebar({
  winery,
  dayTrips = [],
}: {
  winery: WineryInfoProps;
  dayTrips?: DayTrip[];
}) {
  let hours: Hours | null = null;
  try {
    if (winery.hoursJson) {
      const parsed = JSON.parse(winery.hoursJson);
      // Only use hours if at least one day has a real value
      const hasAnyHours = Object.values(parsed).some(
        (v) => v && v !== "Closed"
      );
      if (hasAnyHours) hours = parsed;
    }
  } catch {}

  const dayNames: Record<string, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase()
    .slice(0, 3);

  const hasAmenities =
    winery.reservationRequired ||
    winery.dogFriendly ||
    winery.picnicFriendly ||
    winery.kidFriendly ||
    winery.sustainableFarming;

  return (
    <div className="sticky top-24 space-y-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        {/* Book CTA */}
        {(winery.visitUrl || winery.websiteUrl) && (
          <div className="mb-5">
            <BookTastingCTA
              websiteUrl={winery.visitUrl || winery.websiteUrl!}
              wineryId={winery.id}
              winerySlug={winery.slug}
              sourceComponent="WinerySidebar"
              size="lg"
            />
          </div>
        )}

        {/* Contact */}
        <div className="space-y-3 text-sm">
          {winery.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[var(--muted-foreground)]" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([winery.address, winery.city, winery.state, winery.zip].filter(Boolean).join(", "))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
              >
                {[
                  winery.address,
                  winery.city,
                  [winery.state, winery.zip].filter(Boolean).join(" "),
                ]
                  .filter(Boolean)
                  .join(", ")}
              </a>
            </div>
          )}
          {winery.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              <a
                href={`tel:${winery.phone}`}
                className="hover:text-burgundy-700 dark:hover:text-burgundy-400 transition-colors"
              >
                {winery.phone}
              </a>
            </div>
          )}
          {winery.websiteUrl && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              <TrackedLink
                href={winery.websiteUrl}
                clickType="website"
                wineryId={winery.id}
                sourcePage={`/wineries/${winery.slug}`}
                sourceComponent="WinerySidebar"
                className="hover:text-burgundy-700 dark:hover:text-burgundy-400 truncate transition-colors"
              >
                Website
              </TrackedLink>
            </div>
          )}
        </div>

        {/* Amenities (before hours — more important) */}
        {hasAmenities && (
          <div className="mt-5 pt-5 border-t border-[var(--border)] space-y-2 text-sm">
            {winery.reservationRequired && (
              <div className="flex items-center gap-2 text-burgundy-700 dark:text-burgundy-400">
                <CalendarCheck className="h-4 w-4" />
                Reservation Required
              </div>
            )}
            {winery.dogFriendly && (
              <div className="flex items-center gap-2">
                <Dog className="h-4 w-4 text-[var(--muted-foreground)]" />
                {winery.dogFriendlySource ? (
                  <a
                    href={winery.dogFriendlySource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-burgundy-700 dark:hover:text-burgundy-400"
                  >
                    Dog Friendly
                  </a>
                ) : (
                  "Dog Friendly"
                )}
              </div>
            )}
            {winery.picnicFriendly && (
              <div className="flex items-center gap-2">
                <TreePine className="h-4 w-4 text-[var(--muted-foreground)]" />
                Picnic Friendly
              </div>
            )}
            {winery.kidFriendly && (
              <div className="flex items-center gap-2">
                <Baby className="h-4 w-4 text-[var(--muted-foreground)]" />
                {winery.kidFriendlySource ? (
                  <a
                    href={winery.kidFriendlySource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-burgundy-700 dark:hover:text-burgundy-400"
                  >
                    Kid Friendly
                  </a>
                ) : (
                  "Kid Friendly"
                )}
                {winery.kidFriendlyConfidence === "medium" && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    *
                  </span>
                )}
              </div>
            )}
            {winery.sustainableFarming && (
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-[var(--muted-foreground)]" />
                {winery.sustainableSource ? (
                  <a
                    href={winery.sustainableSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-burgundy-700 dark:hover:text-burgundy-400"
                  >
                    Sustainable
                  </a>
                ) : (
                  "Sustainable"
                )}
                {winery.sustainableNote && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    — {winery.sustainableNote}
                  </span>
                )}
              </div>
            )}
            {(winery.dogFriendly || winery.kidFriendly) && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mt-1">
                <Info className="h-3 w-3 shrink-0" />
                Confirm policies before visiting
              </p>
            )}
          </div>
        )}

        {/* Hours */}
        {hours && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
              Hours
            </h3>
            <div className="space-y-1 text-xs">
              {Object.entries(dayNames).map(([key, label]) => {
                const isToday = key === today;
                return (
                  <div
                    key={key}
                    className={`flex justify-between ${isToday ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}
                  >
                    <span>{label}</span>
                    <span>{hours![key as keyof Hours] || "Closed"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day trips */}
        {dayTrips.length > 0 && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold mb-2">Featured In</h3>
            <div className="flex flex-wrap gap-1.5">
              {dayTrips.map((trip) => (
                <Link
                  key={trip.slug}
                  href={`/day-trips/${trip.slug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-burgundy-50 dark:bg-burgundy-950 border border-burgundy-200 dark:border-burgundy-800 px-2.5 py-0.5 text-xs text-burgundy-700 dark:text-burgundy-300 hover:bg-burgundy-100 dark:hover:bg-burgundy-900 transition-colors"
                >
                  <Route className="h-3 w-3" />
                  {trip.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Visitor Tips */}
        {winery.visitorTips && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold mb-2">Before You Go</h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              {winery.visitorTips}
            </p>
          </div>
        )}

        {/* Verification / last updated */}
        <div className="mt-5 pt-4 border-t border-[var(--border)]">
          {winery.curated && winery.curatedAt ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              Verified{" "}
              {new Date(winery.curatedAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)]">
              Last updated{" "}
              {new Date(
                winery.lastScrapedAt || winery.updatedAt || "2025-01-01"
              ).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Legacy exports ── */
export function WineryInfoSection({
  winery,
}: {
  winery: WineryInfoProps;
  photos?: { id: number; url: string; altText: string | null }[];
}) {
  return <WineryDescription description={winery.description} />;
}

export function WineryVisitInfo({ winery }: { winery: WineryInfoProps }) {
  return <WinerySidebar winery={winery} />;
}

export function HoursSection(_: { hoursJson: string | null }) {
  return null;
}
