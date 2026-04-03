export interface Wine {
  id: number;
  name: string;
  wineType: string | null;
  category: string | null;
  vintage: number | null;
  price: number | null;
  description: string | null;
  rating: number | null;
  ratingSource: string | null;
  ratingCount: number | null;
}

export const CATEGORY_ORDER = ["red", "white", "rosé", "sparkling", "dessert", "other"];

export const categoryColors: Record<string, string> = {
  red: "bg-burgundy-100 text-burgundy-800 dark:bg-burgundy-900 dark:text-burgundy-200",
  white: "bg-amber-50 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  rosé: "bg-pink-50 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  sparkling: "bg-sky-50 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  dessert: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
};

export const categoryIcons: Record<string, string> = {
  red: "🍷",
  white: "🥂",
  rosé: "🌸",
  sparkling: "✨",
  dessert: "🍯",
  other: "🍇",
};

export const categoryLabels: Record<string, string> = {
  red: "Red Wines",
  white: "White Wines",
  rosé: "Rosé Wines",
  sparkling: "Sparkling Wines",
  dessert: "Dessert Wines",
  other: "Other Wines",
};
