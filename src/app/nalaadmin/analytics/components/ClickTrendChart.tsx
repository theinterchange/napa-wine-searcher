"use client";

interface TrendData {
  date: string;
  total: number;
}

interface ClickTrendChartProps {
  data: TrendData[];
}

export function ClickTrendChart({ data }: ClickTrendChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)] py-4">
        No click data yet
      </p>
    );
  }

  const max = Math.max(...data.map((d) => d.total));

  return (
    <div className="flex items-end gap-[2px] h-32">
      {data.map((item) => {
        const height = max > 0 ? Math.max((item.total / max) * 100, 4) : 0;
        const dateLabel = new Date(item.date + "T00:00:00").toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" }
        );
        return (
          <div
            key={item.date}
            className="flex-1 group relative flex flex-col items-center justify-end h-full"
          >
            <div
              className="w-full min-w-[4px] rounded-t bg-[var(--brand,#7c3aed)] opacity-80 hover:opacity-100 transition-opacity"
              style={{ height: `${height}%` }}
            />
            <div className="absolute -top-8 hidden group-hover:block bg-[var(--card)] border border-[var(--border)] rounded px-2 py-1 text-xs whitespace-nowrap shadow-sm z-10">
              {dateLabel}: {item.total} click{item.total !== 1 ? "s" : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
