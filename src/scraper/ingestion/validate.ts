/**
 * Validate extracted data before writing to database.
 */

import { config } from "../config";
import { WINE_TYPES } from "../extraction/prompts";
import type {
  ExtractedWine,
  ExtractedTasting,
  ExtractedWineryInfo,
  WineryExtractionResult,
} from "../types";

const wineTypeSet = new Set<string>(WINE_TYPES);

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  cleanedWines: ExtractedWine[];
  cleanedTastings: ExtractedTasting[];
}

function validateWine(wine: ExtractedWine): {
  valid: boolean;
  issue?: string;
} {
  if (!wine.name || wine.name.trim().length === 0) {
    return { valid: false, issue: "Wine missing name" };
  }

  if (!wineTypeSet.has(wine.wineType)) {
    return { valid: false, issue: `Unknown wine type: ${wine.wineType}` };
  }

  if (
    wine.price !== null &&
    (wine.price < config.validation.winePriceMin ||
      wine.price > config.validation.winePriceMax)
  ) {
    return {
      valid: false,
      issue: `Wine price out of range: $${wine.price} (${wine.name})`,
    };
  }

  if (wine.vintage !== null && (wine.vintage < 1970 || wine.vintage > 2026)) {
    return {
      valid: false,
      issue: `Wine vintage out of range: ${wine.vintage} (${wine.name})`,
    };
  }

  return { valid: true };
}

function validateTasting(tasting: ExtractedTasting): {
  valid: boolean;
  issue?: string;
} {
  if (!tasting.name || tasting.name.trim().length === 0) {
    return { valid: false, issue: "Tasting missing name" };
  }

  if (
    tasting.price !== null &&
    (tasting.price < 0 ||
      tasting.price > config.validation.tastingPriceMax)
  ) {
    return {
      valid: false,
      issue: `Tasting price out of range: $${tasting.price} (${tasting.name})`,
    };
  }

  if (
    tasting.durationMinutes !== null &&
    (tasting.durationMinutes < 10 || tasting.durationMinutes > 480)
  ) {
    return {
      valid: false,
      issue: `Tasting duration out of range: ${tasting.durationMinutes}min (${tasting.name})`,
    };
  }

  return { valid: true };
}

export function validateExtraction(
  result: WineryExtractionResult
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Validate wines
  const cleanedWines: ExtractedWine[] = [];
  for (const wine of result.wines) {
    const check = validateWine(wine);
    if (check.valid) {
      cleanedWines.push(wine);
    } else {
      warnings.push(check.issue!);
    }
  }

  // Validate tastings
  const cleanedTastings: ExtractedTasting[] = [];
  for (const tasting of result.tastings) {
    const check = validateTasting(tasting);
    if (check.valid) {
      cleanedTastings.push(tasting);
    } else {
      warnings.push(check.issue!);
    }
  }

  // Must have at least 1 wine or 1 tasting
  if (cleanedWines.length === 0 && cleanedTastings.length === 0) {
    errors.push("No valid wines or tastings extracted");
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    cleanedWines,
    cleanedTastings,
  };
}

export function validateCoordinates(
  lat: number,
  lng: number
): boolean {
  const { latBounds, lngBounds } = config.validation;
  return (
    lat >= latBounds.min &&
    lat <= latBounds.max &&
    lng >= lngBounds.min &&
    lng <= lngBounds.max
  );
}
