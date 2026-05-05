import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Dog,
  TreePine,
  CalendarCheck,
  Baby,
  Route,
  Leaf,
} from "lucide-react";
import Link from "next/link";
import { TrackedLink } from "@/components/monetization/TrackedLink";
import { BookTastingCTA } from "@/components/monetization/BookTastingCTA";

/** Strip existing UTM params and append our own tracking */
function addUtm(url: string, flag: string): string {
  try {
    const u = new URL(url);
    // Remove existing UTM params
    [...u.searchParams.keys()].filter(k => k.startsWith("utm_")).forEach(k => u.searchParams.delete(k));
    // Add ours
    u.searchParams.set("utm_source", "napasonomaguide");
    u.searchParams.set("utm_medium", "referral");
    u.searchParams.set("utm_campaign", flag);
    return u.toString();
  } catch {
    return url;
  }
}


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
    <p className="drop-cap-editorial font-[var(--font-serif-text)] text-[17px] leading-[1.7] text-[var(--ink-2)]" style={{ textWrap: "pretty" }}>
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

  // Display rule (post 2026-04-09 nullable refactor):
  //   value === null  → omit row (we don't know)
  //   value === true  → "Dog/Kid Friendly", wrapped in source link if present
  //   value === false → "No Pets" / "Adults Only" / "Service Dogs Only", linked if source
  // No "medium / Confirm policy" tier — the schema now stores real NULLs for unknown.
  const dogIsServiceOnly =
    winery.dogFriendly === false &&
    !!winery.dogFriendlyNote?.toLowerCase().includes("service");
  const dogLabel =
    winery.dogFriendly === true
      ? "Dog Friendly"
      : dogIsServiceOnly
      ? "Service Dogs Only"
      : "No Pets";
  const kidLabel = winery.kidFriendly ? "Kid Friendly" : "Adults Only";

  return (
    <div className="sticky top-24 space-y-6">
      <div className="border border-[var(--rule-soft)] bg-[var(--paper-2)]/60 p-6">
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
        <div>
          <span className="kicker">Contact</span>
          <div className="mt-3 space-y-3 font-[var(--font-serif-text)] text-[14.5px] text-[var(--ink-2)]">
            {winery.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[var(--brass)]" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([winery.address, winery.city, winery.state, winery.zip].filter(Boolean).join(", "))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--ink)] transition-colors"
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
            {winery.phone && winery.phone !== "null" && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[var(--brass)]" />
                <a
                  href={`tel:${winery.phone}`}
                  className="hover:text-[var(--ink)] transition-colors"
                >
                  {winery.phone}
                </a>
              </div>
            )}
            {winery.websiteUrl && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 shrink-0 text-[var(--brass)]" />
                <TrackedLink
                  href={winery.websiteUrl}
                  clickType="website"
                  wineryId={winery.id}
                  sourcePage={`/wineries/${winery.slug}`}
                  sourceComponent="WinerySidebar"
                  className="hover:text-[var(--ink)] truncate transition-colors underline decoration-[var(--brass)] underline-offset-4"
                >
                  Website
                </TrackedLink>
              </div>
            )}
          </div>
        </div>

        {/* Amenities — always show dog and kid labels */}
        <div className="mt-5 pt-5 border-t border-[var(--rule-soft)]">
          <span className="kicker">Amenities</span>
          <div className="mt-3 space-y-2.5 font-[var(--font-serif-text)] text-[14.5px] text-[var(--ink-2)]">
          {winery.reservationRequired && (
            <div className="flex items-center gap-2 text-[var(--foreground)]">
              <CalendarCheck className="h-4 w-4" />
              Reservation Required
            </div>
          )}

          {/* Dog — omit when null, render label as fact otherwise (linked if source) */}
          {winery.dogFriendly != null && (
            <div className="flex items-start gap-2">
              <Dog className="h-4 w-4 shrink-0 mt-0.5 text-[var(--muted-foreground)]" />
              <div>
                {winery.dogFriendlySource ? (
                  <a
                    href={addUtm(winery.dogFriendlySource, "dog-policy")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[var(--foreground)]"
                  >
                    {dogLabel}
                  </a>
                ) : (
                  <span>{dogLabel}</span>
                )}
                {winery.dogFriendlyNote && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{winery.dogFriendlyNote}</p>
                )}
              </div>
            </div>
          )}

          {/* Kid — omit when null, render label as fact otherwise (linked if source) */}
          {winery.kidFriendly != null && (
            <div className="flex items-start gap-2">
              <Baby className="h-4 w-4 shrink-0 mt-0.5 text-[var(--muted-foreground)]" />
              <div>
                {winery.kidFriendlySource ? (
                  <a
                    href={addUtm(winery.kidFriendlySource, "kid-policy")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[var(--foreground)]"
                  >
                    {kidLabel}
                  </a>
                ) : (
                  <span>{kidLabel}</span>
                )}
                {winery.kidFriendlyNote && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{winery.kidFriendlyNote}</p>
                )}
              </div>
            </div>
          )}

          {/* Picnic — only show when true */}
          {winery.picnicFriendly && (
            <div className="flex items-center gap-2">
              <TreePine className="h-4 w-4 text-[var(--muted-foreground)]" />
              Picnic Friendly
            </div>
          )}

          {/* Sustainable — only show when true */}
          {winery.sustainableFarming && (
            <div className="flex items-start gap-2">
              <Leaf className="h-4 w-4 shrink-0 mt-0.5 text-[var(--muted-foreground)]" />
              <div>
                {winery.sustainableSource ? (
                  <a href={addUtm(winery.sustainableSource!, "sustainable")} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--foreground)]">
                    Sustainable
                  </a>
                ) : (
                  <span>Sustainable</span>
                )}
                {winery.sustainableNote && (
                  <span className="text-xs text-[var(--ink-3)]"> · {winery.sustainableNote}</span>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Hours */}
        {hours && (
          <div className="mt-5 pt-5 border-t border-[var(--rule-soft)]">
            <span className="kicker inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-[var(--brass)]" />
              Hours
            </span>
            <div className="mt-3 space-y-1 font-[var(--font-serif-text)] text-[13px]">
              {Object.entries(dayNames).map(([key, label]) => {
                const isToday = key === today;
                return (
                  <div
                    key={key}
                    className={`flex justify-between ${isToday ? "font-semibold text-[var(--ink)]" : "text-[var(--ink-3)]"}`}
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
          <div className="mt-5 pt-5 border-t border-[var(--rule-soft)]">
            <span className="kicker">Featured In</span>
            <ul className="mt-3 space-y-1.5">
              {dayTrips.map((trip) => (
                <li key={trip.slug}>
                  <Link
                    href={`/itineraries/${trip.slug}`}
                    className="group inline-flex items-baseline gap-2 text-[14px] leading-[1.5] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
                    style={{ fontFamily: "var(--font-serif-text)" }}
                  >
                    <Route className="h-3 w-3 self-center text-[var(--brass)] shrink-0" />
                    <span className="border-b border-transparent group-hover:border-[var(--brass)] transition-colors">
                      {trip.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Visitor Tips */}
        {winery.visitorTips && (
          <div className="mt-5 pt-5 border-t border-[var(--rule-soft)]">
            <span className="kicker">Before You Go</span>
            <p className="mt-3 font-[var(--font-serif-text)] text-[13.5px] leading-[1.6] text-[var(--ink-2)]" style={{ textWrap: "pretty" }}>
              {winery.visitorTips}
            </p>
          </div>
        )}

        {/* Verification / last updated */}
        <div className="mt-5 pt-4 border-t border-[var(--rule-soft)]">
          {winery.curated && winery.curatedAt ? (
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
              Verified{" "}
              {new Date(winery.curatedAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          ) : (
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-3)]">
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
