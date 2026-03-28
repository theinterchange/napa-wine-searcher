"use client";

interface Stay22WidgetProps {
  name: string;
  lat: number;
  lng: number;
}

export function Stay22Widget({ name, lat, lng }: Stay22WidgetProps) {
  const affiliateId = process.env.NEXT_PUBLIC_STAY22_AFFILIATE_ID;
  if (!affiliateId) return null;

  const src = `https://www.stay22.com/embed/gm?aid=${affiliateId}&lat=${lat}&lng=${lng}&title=${encodeURIComponent(name)}&checkin=&checkout=&adults=2&rooms=1&zoom=14&show=hotels&theme=light`;

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <h3 className="px-4 py-3 text-sm font-semibold border-b border-[var(--border)] bg-[var(--card)]">
        Compare Prices
      </h3>
      <iframe
        src={src}
        width="100%"
        height="360"
        style={{ border: 0 }}
        loading="lazy"
        title={`Compare prices for ${name}`}
      />
    </div>
  );
}
