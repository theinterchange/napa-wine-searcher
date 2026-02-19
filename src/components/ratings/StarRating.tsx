import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  maxRating = 5,
  size = "sm",
}: {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" }[size];
  const stars = [];

  for (let i = 1; i <= maxRating; i++) {
    const filled = i <= Math.floor(rating);
    const partial = !filled && i === Math.ceil(rating);
    stars.push(
      <Star
        key={i}
        className={cn(
          sizeClass,
          filled
            ? "fill-gold-500 text-gold-500"
            : partial
            ? "fill-gold-500/50 text-gold-500"
            : "text-gray-300 dark:text-gray-600"
        )}
      />
    );
  }

  return <div className="flex items-center gap-0.5">{stars}</div>;
}
