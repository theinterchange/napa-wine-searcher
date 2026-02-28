import { Star } from "lucide-react";

const sizePx = { sm: 14, md: 16, lg: 20 } as const;

export function StarRating({
  rating,
  maxRating = 5,
  size = "sm",
}: {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
}) {
  const px = sizePx[size];
  const stars = [];

  for (let i = 1; i <= maxRating; i++) {
    const filled = i <= Math.floor(rating);
    const fraction = !filled && i === Math.ceil(rating) ? rating % 1 : 0;

    if (filled) {
      stars.push(
        <Star
          key={i}
          style={{ width: px, height: px }}
          className="fill-gold-500 text-gold-500"
        />
      );
    } else if (fraction > 0) {
      // Partial star: empty background + clipped filled foreground
      stars.push(
        <span key={i} className="relative" style={{ width: px, height: px }}>
          <Star
            style={{ width: px, height: px }}
            className="absolute inset-0 text-gray-300 dark:text-gray-600"
          />
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${Math.round(fraction * 100)}%` }}
          >
            <Star
              style={{ width: px, height: px }}
              className="fill-gold-500 text-gold-500"
            />
          </span>
        </span>
      );
    } else {
      stars.push(
        <Star
          key={i}
          style={{ width: px, height: px }}
          className="text-gray-300 dark:text-gray-600"
        />
      );
    }
  }

  return <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of ${maxRating} stars`}>{stars}</div>;
}
