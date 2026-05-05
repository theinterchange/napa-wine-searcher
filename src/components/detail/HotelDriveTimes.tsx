import Link from "next/link";
import { estimateSegment, formatDistance, formatDriveTime, haversineDistance } from "@/lib/geo";
import { getAccommodationBySlug } from "@/lib/accommodation-data";
import { BookHotelCTA } from "@/components/accommodation/BookHotelCTA";

const NAPA_HOTEL_SLUGS = [
  "the-westin-verasa-napa",
  "archer-hotel-napa",
  "andaz-napa-by-hyatt",
  "silverado-resort",
  "carneros-resort-and-spa",
  "the-meritage-resort-and-spa",
] as const;

const SONOMA_HOTEL_SLUGS = [
  "hotel-healdsburg",
  "montage-healdsburg",
  "farmhouse-inn",
  "olea-hotel",
  "cottage-inn-and-spa",
  "the-lodge-at-bodega-bay",
] as const;

const VALLEY_LABEL = { napa: "Napa", sonoma: "Sonoma" } as const;

interface HotelDriveTimesProps {
  wineryLat: number;
  wineryLng: number;
  wineryName: string;
  valley?: "napa" | "sonoma";
  winerySlug?: string;
}

export async function HotelDriveTimes({ wineryLat, wineryLng, wineryName, valley = "napa", winerySlug }: HotelDriveTimesProps) {
  const slugs = valley === "sonoma" ? SONOMA_HOTEL_SLUGS : NAPA_HOTEL_SLUGS;
  const accommodations = await Promise.all(
    slugs.map((slug) => getAccommodationBySlug(slug))
  );

  const rows = accommodations
    .filter((acc): acc is NonNullable<typeof acc> => acc !== null && acc.lat !== null && acc.lng !== null)
    .map((acc) => {
      const straightLine = haversineDistance(acc.lat!, acc.lng!, wineryLat, wineryLng);
      const { miles, minutes } = estimateSegment(straightLine);
      return { acc, miles, minutes };
    })
    .sort((a, b) => a.minutes - b.minutes);

  if (rows.length === 0) return null;

  const sourcePage = winerySlug ? `/wineries/${winerySlug}` : undefined;
  const sourceComponent = `winery_hotel_drive_times_${valley}`;

  return (
    <div>
      <span className="kicker">Drive Times</span>
      <h2 className="editorial-h2 text-[24px] sm:text-[28px] mt-2">
        From {VALLEY_LABEL[valley]} <em>hotels.</em>
      </h2>
      <hr className="rule-brass mt-3" style={{ marginInline: 0 }} />
      <p className="mt-4 font-[var(--font-serif-text)] text-[14.5px] text-[var(--ink-2)]" style={{ textWrap: "pretty" }}>
        Estimated drive time from each hotel to {wineryName}, ordered by proximity.
      </p>
      <div className="mt-5 border-t-2 border-[var(--brass-2)] border-b border-[var(--rule)]">
        <table className="w-full">
          <thead>
            <tr className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--brass-2)] text-left">
              <th className="px-2 py-3 font-semibold">Hotel</th>
              <th className="px-2 py-3 font-semibold text-right">Drive</th>
              <th className="px-2 py-3 font-semibold text-right hidden sm:table-cell">Distance</th>
              <th className="px-2 py-3 font-semibold text-right">Book</th>
            </tr>
          </thead>
          <tbody className="font-[var(--font-serif-text)] text-[14.5px]">
            {rows.map(({ acc, miles, minutes }) => (
              <tr key={acc.slug} className="border-t border-[var(--rule-soft)]">
                <td className="px-2 py-3">
                  <Link
                    href={`/where-to-stay/${acc.slug}`}
                    className="text-[var(--ink)] hover:text-[var(--brass-2)] hover:underline decoration-[var(--brass)] underline-offset-4 transition-colors"
                  >
                    {acc.name}
                  </Link>
                </td>
                <td className="px-2 py-3 text-right tabular-nums text-[var(--ink-2)]">~{formatDriveTime(minutes)}</td>
                <td className="px-2 py-3 text-right tabular-nums text-[var(--ink-2)] hidden sm:table-cell">{formatDistance(miles)}</td>
                <td className="px-2 py-3 text-right">
                  <BookHotelCTA
                    bookingUrl={acc.bookingUrl}
                    websiteUrl={acc.websiteUrl}
                    accommodationName={acc.name}
                    lat={acc.lat}
                    lng={acc.lng}
                    accommodationId={acc.id}
                    accommodationSlug={acc.slug}
                    sourcePage={sourcePage}
                    sourceComponent={sourceComponent}
                    size="sm"
                    label="Book"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-[var(--font-serif-text)] text-[12.5px] text-[var(--ink-3)]">
        Estimates based on straight-line distance with a wine-country routing factor. Actual drive times vary with traffic and route choice.
      </p>
    </div>
  );
}
