"use client";

interface HeatmapCell {
  dow: string; // "0"-"6" where 0 = Sunday
  hour: string; // "00"-"23"
  total: number;
}

interface HeatmapProps {
  data: HeatmapCell[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Heatmap({ data }: HeatmapProps) {
  // Build a 7×24 matrix
  const matrix: number[][] = Array.from({ length: 7 }, () =>
    Array(24).fill(0)
  );
  let max = 0;
  for (const cell of data) {
    const d = parseInt(cell.dow, 10);
    const h = parseInt(cell.hour, 10);
    if (Number.isNaN(d) || Number.isNaN(h)) continue;
    matrix[d][h] = cell.total;
    if (cell.total > max) max = cell.total;
  }

  if (max === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)] py-4">
        No click data in this period yet
      </p>
    );
  }

  function cellColor(value: number): string {
    if (value === 0) return "var(--muted)";
    const intensity = Math.min(value / max, 1);
    // burgundy gradient: #fce7e7 → #7f1d1d
    const alpha = 0.15 + intensity * 0.85;
    return `rgba(127, 29, 29, ${alpha})`;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="flex items-end text-[10px] text-[var(--muted-foreground)] mb-1 pl-10">
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="flex-1 text-center"
              style={{ minWidth: 20 }}
            >
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {DAYS.map((day, dIdx) => (
          <div key={day} className="flex items-center mb-0.5">
            <div className="w-10 text-[11px] text-[var(--muted-foreground)] pr-2 text-right">
              {day}
            </div>
            {Array.from({ length: 24 }, (_, h) => {
              const value = matrix[dIdx][h];
              return (
                <div
                  key={h}
                  className="flex-1 aspect-square rounded-sm mx-0.5 relative group cursor-default"
                  style={{
                    backgroundColor: cellColor(value),
                    minWidth: 18,
                    maxWidth: 32,
                  }}
                  title={`${day} ${h}:00 — ${value} click${value === 1 ? "" : "s"}`}
                />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-3 text-[10px] text-[var(--muted-foreground)]">
          <span>Less</span>
          {[0.15, 0.35, 0.55, 0.75, 1].map((a) => (
            <div
              key={a}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: `rgba(127, 29, 29, ${a})` }}
            />
          ))}
          <span>More</span>
          <span className="ml-auto">Peak: {max} clicks</span>
        </div>
      </div>
    </div>
  );
}
