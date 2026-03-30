import { cn } from "@/lib/utils";

export function RatingBadge({
  score,
  source,
  count,
  className,
}: {
  score: number;
  source?: string;
  count?: number;
  className?: string;
}) {
  const color =
    score >= 4.5
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      : score >= 4.0
      ? "bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200"
      : score >= 3.5
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        color,
        className
      )}
    >
      {score.toFixed(1)}
      {source && (
        <span className="opacity-75 capitalize">{source}</span>
      )}
      {count != null && (
        <span className="opacity-75">({count.toLocaleString()})</span>
      )}
    </span>
  );
}
