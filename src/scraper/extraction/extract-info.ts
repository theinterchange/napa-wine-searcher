/**
 * Extract winery info from about/homepage using LLM structured outputs.
 */

import { z } from "zod";
import { extractStructured } from "./llm-client";
import { wineryInfoExtractionPrompt } from "./prompts";
import type { ExtractedWineryInfo } from "../types";

const HoursSchema = z.object({
  mon: z.string().nullable(),
  tue: z.string().nullable(),
  wed: z.string().nullable(),
  thu: z.string().nullable(),
  fri: z.string().nullable(),
  sat: z.string().nullable(),
  sun: z.string().nullable(),
});

const WineryInfoSchema = z.object({
  description: z.string().nullable(),
  shortDescription: z.string().nullable(),
  hours: HoursSchema.nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  reservationRequired: z.boolean(),
  dogFriendly: z.boolean(),
  picnicFriendly: z.boolean(),
});

export async function extractWineryInfo(
  wineryName: string,
  pageText: string
): Promise<ExtractedWineryInfo> {
  if (!pageText || pageText.trim().length < 50) {
    return {
      description: null,
      shortDescription: null,
      hours: null,
      phone: null,
      email: null,
      reservationRequired: false,
      dogFriendly: false,
      picnicFriendly: false,
    };
  }

  return extractStructured(
    wineryInfoExtractionPrompt(wineryName),
    pageText,
    WineryInfoSchema,
    "winery_info"
  );
}
