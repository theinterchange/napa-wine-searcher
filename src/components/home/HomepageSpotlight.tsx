import Link from "next/link";
import Image from "next/image";

export interface SpotlightWinery {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  heroImageUrl: string | null;
  websiteUrl: string | null;
  visitUrl: string | null;
  reservationRequired: boolean | null;
  priceLevel: number | null;
  whyVisit: string | null;
  whyThisWinery: string | null;
  knownFor: string | null;
  subRegion: string | null;
  valley: string | null;
  spotlightTeaser: string | null;
}

function poursLabel(priceLevel: number | null): string {
  if (!priceLevel) return "Inquire for tasting menu";
  if (priceLevel === 1) return "Tastings under $40";
  if (priceLevel === 2) return "Tastings $40–$75";
  if (priceLevel === 3) return "Reserve seated · $75–$150";
  return "By appointment · $150+";
}

function parseReasons(jsonArrayOrText: string | null): string[] {
  if (!jsonArrayOrText) return [];
  const trimmed = jsonArrayOrText.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (r): r is string => typeof r === "string" && r.trim().length > 0
        );
      }
    } catch {
      // fall through to plain-text path
    }
  }
  return trimmed.length > 0 ? [trimmed] : [];
}

function pickLead(w: SpotlightWinery): string | null {
  // Prefer the AI-written spotlight teaser (homepage-only, doesn't duplicate detail page).
  // Fall back to detail-page fields if a spotlight winery doesn't have one yet.
  if (w.spotlightTeaser && w.spotlightTeaser.trim().length > 0) {
    return w.spotlightTeaser.trim();
  }
  if (w.whyVisit && !w.whyVisit.trim().startsWith("[")) return w.whyVisit.trim();
  if (w.shortDescription && !w.shortDescription.trim().startsWith("[")) {
    return w.shortDescription.trim();
  }
  return parseReasons(w.whyThisWinery)[0] ?? null;
}

export function HomepageSpotlight({ winery }: { winery: SpotlightWinery | null }) {
  if (!winery) return null;

  const lead = pickLead(winery);
  const reasons = parseReasons(winery.whyThisWinery).slice(0, 3);
  const valleyLabel = winery.valley === "napa" ? "Napa Valley" : winery.valley === "sonoma" ? "Sonoma County" : null;
  const bookHref = winery.visitUrl ?? winery.websiteUrl;

  return (
    <section className="bg-[var(--ink)] text-[var(--paper)] py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-end gap-x-8 gap-y-3 pb-6 border-b"
          style={{ borderColor: "var(--brass-2)" }}
        >
          <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--brass)] pb-2 whitespace-nowrap">
            N° 02 / Spotlight
          </span>
          <h2
            className="font-[var(--font-heading)] text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.05] tracking-[-0.02em] font-normal text-[var(--paper)] max-w-[20ch]"
            style={{ textWrap: "balance" }}
          >
            This month&apos;s{" "}
            <em
              className="italic font-light"
              style={{ color: "color-mix(in srgb, var(--brass) 70%, white)" }}
            >
              cellar.
            </em>
          </h2>
          <p
            className="text-[15px] leading-[1.5] text-[var(--paper)]/70 pb-1 lg:whitespace-nowrap"
            style={{ fontFamily: "var(--font-serif-text)" }}
          >
            Hand-picked by the editors, monthly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 mt-10 lg:items-stretch">
          <figure className="photo-zoom flex flex-col">
            <div className="relative flex-1 min-h-[400px] aspect-[4/3] lg:aspect-auto overflow-hidden">
              {winery.heroImageUrl ? (
                <Image
                  src={winery.heroImageUrl}
                  alt={winery.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              ) : (
                <div className="w-full h-full bg-[var(--ink-2)]" />
              )}
            </div>
            <figcaption
              className="font-[var(--font-serif-text)] text-[14px] mt-3 pl-3 border-l shrink-0"
              style={{ color: "var(--rule)", borderColor: "var(--brass)" }}
            >
              {winery.name}
              {winery.subRegion && <> · {winery.subRegion}</>}
              {valleyLabel && <> · {valleyLabel}</>}
            </figcaption>
          </figure>

          <div className="flex flex-col">
            <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--brass)]">
              Editor&apos;s Pick
            </span>

            <h3
              className="font-[var(--font-heading)] text-[28px] sm:text-[34px] lg:text-[40px] leading-[1.05] tracking-[-0.02em] font-normal text-[var(--paper)] mt-3"
              style={{ textWrap: "balance" }}
            >
              {winery.name}
            </h3>

            {lead && (
              <p
                className="font-[var(--font-serif-text)] text-[16.5px] leading-[1.55] mt-4 max-w-[52ch] line-clamp-4"
                style={{ color: "var(--dark-ink)", textWrap: "pretty" }}
              >
                {lead}
              </p>
            )}

            {reasons.length > 0 && (
              <div className="mt-5">
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass)]">
                  Why this estate
                </span>
                <ul className="mt-3 space-y-2 max-w-[56ch]">
                  {reasons.map((reason, i) => (
                    <li key={i} className="flex gap-3 items-baseline">
                      <span className="font-mono text-[10.5px] text-[var(--brass)] tabular-nums shrink-0 pt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="font-[var(--font-serif-text)] text-[14.5px] leading-[1.5] text-[var(--paper)] line-clamp-2"
                        style={{ textWrap: "pretty" }}
                      >
                        {reason}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/wineries/${winery.slug}`}
                  className="inline-flex items-center gap-1.5 mt-4 font-mono text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[var(--brass)] border-b border-[var(--brass)]/40 pb-0.5 hover:text-[var(--paper)] hover:border-[var(--paper)] transition-colors"
                >
                  Read the full story →
                </Link>
              </div>
            )}

            <dl
              className="grid grid-cols-2 gap-x-6 gap-y-3 mt-5 pt-5 border-t"
              style={{ borderColor: "var(--brass-2)" }}
            >
              <div>
                <dt className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass)]">
                  Appellation
                </dt>
                <dd className="font-[var(--font-serif-text)] text-[15px] mt-1.5 text-[var(--paper)]">
                  {winery.subRegion ?? "—"}
                  {valleyLabel && (
                    <span className="text-[var(--rule)]"> · {winery.valley === "napa" ? "Napa" : "Sonoma"}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass)]">
                  Pours
                </dt>
                <dd className="font-[var(--font-serif-text)] text-[15px] mt-1.5 text-[var(--paper)]">
                  {poursLabel(winery.priceLevel)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass)]">
                  Reservations
                </dt>
                <dd className="font-[var(--font-serif-text)] text-[15px] mt-1.5 text-[var(--paper)]">
                  {winery.reservationRequired ? "Required" : "Walk-ins welcome"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass)]">
                  Stay nearby
                </dt>
                <dd className="font-[var(--font-serif-text)] text-[15px] mt-1.5 text-[var(--paper)]">
                  <Link
                    href={`/where-to-stay${winery.valley === "napa" ? "/napa-valley" : winery.valley === "sonoma" ? "/sonoma-county" : ""}`}
                    className="underline decoration-[var(--brass)] underline-offset-4 hover:text-[var(--brass)] transition-colors"
                  >
                    Browse stays →
                  </Link>
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              {bookHref && (
                <a
                  href={bookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[var(--paper)] text-[var(--ink)] font-mono text-[11px] tracking-[0.18em] uppercase font-semibold px-6 py-3.5 hover:bg-[var(--brass)] transition-colors"
                >
                  Book a tasting →
                </a>
              )}
              <Link
                href={`/wineries/${winery.slug}`}
                className="inline-flex items-center gap-2 border border-[var(--paper)]/30 text-[var(--paper)] font-mono text-[11px] tracking-[0.18em] uppercase font-semibold px-6 py-3.5 hover:bg-[var(--paper)]/10 transition-colors"
              >
                Read more
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
