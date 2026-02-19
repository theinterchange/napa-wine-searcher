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
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : score >= 4.0
      ? "bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-200"
      : score >= 3.5
      ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
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
        <span className="opacity-60 capitalize">{source}</span>
      )}
      {count != null && (
        <span className="opacity-60">({count.toLocaleString()})</span>
      )}
    </span>
  );
}
