import Link from "next/link";

interface BarChartItem {
  label: string;
  value: number;
  href?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  maxValue?: number;
}

const CLICK_TYPE_LABELS: Record<string, string> = {
  website: "Website Visit",
  book_tasting: "Book Tasting",
  buy_wine: "Buy Wine",
  affiliate: "Affiliate",
  directions: "Directions",
  book_hotel: "Book Hotel",
};

export function formatClickType(type: string) {
  return CLICK_TYPE_LABELS[type] || type;
}

export function BarChart({ data, maxValue }: BarChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)] py-4">
        No data yet
      </p>
    );
  }

  const max = maxValue ?? Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const width = max > 0 ? Math.max((item.value / max) * 100, 2) : 0;
        const label = (
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="truncate">{item.label}</span>
            <span className="font-medium tabular-nums ml-2">{item.value}</span>
          </div>
        );
        return (
          <div key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-[var(--foreground)] text-[var(--muted-foreground)]"
              >
                {label}
              </Link>
            ) : (
              <div className="text-[var(--muted-foreground)]">{label}</div>
            )}
            <div className="h-2 rounded-full bg-[var(--muted)]">
              <div
                className="h-2 rounded-full bg-[var(--brand,#7c3aed)]"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
