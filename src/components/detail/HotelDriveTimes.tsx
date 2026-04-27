import Link from "next/link";
import { estimateSegment, formatDistance, formatDriveTime, haversineDistance } from "@/lib/geo";

type Hotel = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
};

const NAPA_HOTELS: Hotel[] = [
  { slug: "the-westin-verasa-napa", name: "The Westin Verasa Napa", lat: 38.3040878, lng: -122.2836431 },
  { slug: "archer-hotel-napa", name: "Archer Hotel Napa", lat: 38.2985362, lng: -122.2876861 },
  { slug: "andaz-napa-by-hyatt", name: "Andaz Napa", lat: 38.2975698, lng: -122.2892687 },
  { slug: "silverado-resort", name: "Silverado Resort", lat: 38.3491745, lng: -122.2656878 },
  { slug: "carneros-resort-and-spa", name: "Carneros Resort and Spa", lat: 38.2557099, lng: -122.3351096 },
  { slug: "the-meritage-resort-and-spa", name: "The Meritage Resort and Spa", lat: 38.246123, lng: -122.2741878 },
];

interface HotelDriveTimesProps {
  wineryLat: number;
  wineryLng: number;
  wineryName: string;
}

export function HotelDriveTimes({ wineryLat, wineryLng, wineryName }: HotelDriveTimesProps) {
  const rows = NAPA_HOTELS
    .map((hotel) => {
      const straightLine = haversineDistance(hotel.lat, hotel.lng, wineryLat, wineryLng);
      const { miles, minutes } = estimateSegment(straightLine);
      return { hotel, miles, minutes };
    })
    .sort((a, b) => a.minutes - b.minutes);

  return (
    <div>
      <h2 className="font-heading text-xl font-bold mb-2">
        Drive Times from Popular Napa Hotels
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        Estimated drive time from each hotel to {wineryName}, ordered by proximity.
      </p>
      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)]/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Hotel</th>
              <th className="px-4 py-2 font-medium text-right">Drive time</th>
              <th className="px-4 py-2 font-medium text-right">Distance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ hotel, miles, minutes }) => (
              <tr key={hotel.slug} className="border-t border-[var(--border)]">
                <td className="px-4 py-2">
                  <Link
                    href={`/where-to-stay/${hotel.slug}`}
                    className="text-[var(--foreground)] hover:underline"
                  >
                    {hotel.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-right tabular-nums">~{formatDriveTime(minutes)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatDistance(miles)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[var(--muted-foreground)]">
        Estimates based on straight-line distance with a wine-country routing factor. Actual drive times vary with traffic and route choice.
      </p>
    </div>
  );
}
