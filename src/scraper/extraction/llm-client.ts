/**
 * OpenAI client with structured outputs and cost tracking.
 */

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { config } from "../config";

const client = new OpenAI({ apiKey: config.openaiApiKey });

// Cost tracking
let totalInputTokens = 0;
let totalOutputTokens = 0;

// GPT-4o-mini pricing (per 1M tokens)
const INPUT_COST_PER_M = 0.15;
const OUTPUT_COST_PER_M = 0.6;

export async function extractStructured<T extends z.ZodType>(
  systemPrompt: string,
  userContent: string,
  schema: T,
  schemaName: string
): Promise<z.infer<T>> {
  const completion = await client.chat.completions.parse({
    model: config.llm.model,
    temperature: config.llm.temperature,
    max_tokens: config.llm.maxTokensPerRequest,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(schema, schemaName),
  });

  // Track usage
  if (completion.usage) {
    totalInputTokens += completion.usage.prompt_tokens;
    totalOutputTokens += completion.usage.completion_tokens;
  }

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    throw new Error(`LLM returned no parseable content for ${schemaName}`);
  }

  return parsed;
}

export function getLLMCostSummary(): {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUSD: number;
} {
  const inputCost = (totalInputTokens / 1_000_000) * INPUT_COST_PER_M;
  const outputCost = (totalOutputTokens / 1_000_000) * OUTPUT_COST_PER_M;
  return {
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    estimatedCostUSD: Math.round((inputCost + outputCost) * 1000) / 1000,
  };
}

export function resetCostTracking(): void {
  totalInputTokens = 0;
  totalOutputTokens = 0;
}
