/**
 * Extract tasting experiences from a crawled tastings page using LLM structured outputs.
 */

import { z } from "zod";
import { extractStructured } from "./llm-client";
import { tastingExtractionPrompt } from "./prompts";
import type { ExtractedTasting } from "../types";

const TastingSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nullable(),
  durationMinutes: z.number().nullable(),
  reservationRequired: z.boolean(),
});

const TastingListSchema = z.object({
  tastings: z.array(TastingSchema),
});

export async function extractTastings(
  wineryName: string,
  pageText: string
): Promise<ExtractedTasting[]> {
  if (!pageText || pageText.trim().length < 50) {
    return [];
  }

  const result = await extractStructured(
    tastingExtractionPrompt(wineryName),
    pageText,
    TastingListSchema,
    "tasting_list"
  );

  return result.tastings;
}
