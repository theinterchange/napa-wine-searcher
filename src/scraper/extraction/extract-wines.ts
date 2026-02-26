/**
 * Extract wines from a crawled wine page using LLM structured outputs.
 */

import { z } from "zod";
import { extractStructured } from "./llm-client";
import { wineExtractionPrompt, WINE_TYPES } from "./prompts";
import type { ExtractedWine } from "../types";

const WineSchema = z.object({
  name: z.string(),
  wineType: z.enum(WINE_TYPES),
  vintage: z.number().nullable(),
  price: z.number().nullable(),
  description: z.string().nullable(),
});

const WineListSchema = z.object({
  wines: z.array(WineSchema),
});

export async function extractWines(
  wineryName: string,
  pageText: string
): Promise<ExtractedWine[]> {
  if (!pageText || pageText.trim().length < 50) {
    return [];
  }

  const result = await extractStructured(
    wineExtractionPrompt(wineryName),
    pageText,
    WineListSchema,
    "wine_list"
  );

  return result.wines;
}
