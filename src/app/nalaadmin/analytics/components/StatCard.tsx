import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  trend?: number | null;
}

export function StatCard({ label, value, icon, subtitle, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold">{value}</p>
        {trend != null && trend !== 0 && (
          <span
            className={`text-sm font-medium ${
              trend > 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
