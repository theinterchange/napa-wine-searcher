"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface InteractiveStarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
}

export function InteractiveStarRating({
  value,
  onChange,
  size = "md",
}: InteractiveStarRatingProps) {
  const [hover, setHover] = useState(0);

  const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              starSize,
              "transition-colors",
              (hover || value) >= star
                ? "fill-gold-500 text-gold-500"
                : "text-gray-300 dark:text-gray-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}
