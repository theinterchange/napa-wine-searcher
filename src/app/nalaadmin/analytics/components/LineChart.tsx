"use client";

import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface LinePoint {
  date: string;
  total: number;
}

interface LineChartProps {
  data: LinePoint[];
  color?: string;
  height?: number;
  emptyMessage?: string;
}

export function LineChart({
  data,
  color = "#7f1d1d",
  height = 220,
  emptyMessage = "No data yet",
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)] py-4">
        {emptyMessage}
      </p>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    shortDate: formatShortDate(d.date),
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RLineChart
          data={formatted}
          margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="shortDate"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--foreground)" }}
            formatter={(value) => [value as number, "Clicks"]}
            labelFormatter={(label, payload) => {
              const p = payload?.[0]?.payload as LinePoint | undefined;
              return p?.date ?? label;
            }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 2, fill: color }}
            activeDot={{ r: 4 }}
          />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatShortDate(iso: string): string {
  // iso is 'YYYY-MM-DD'
  const [, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}
