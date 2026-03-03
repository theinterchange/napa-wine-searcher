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
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  white: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  rosé: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  sparkling: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  dessert: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
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
