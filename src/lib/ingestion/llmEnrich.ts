import Anthropic from "@anthropic-ai/sdk";
import type { CategoryValue, RegionValue } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  if (!client) client = new Anthropic({ apiKey: key });
  return client;
}

export type LlmEnrichmentResult = {
  category: CategoryValue;
  region: RegionValue;
  summary: string;
  baseScore: number;
  reason: string;
};

const ENRICH_TOOL = {
  name: "record_enrichment",
  description: "Record the categorization, factual summary, and virality score for a construction/architecture/design news item.",
  input_schema: {
    type: "object" as const,
    properties: {
      category: { type: "string", enum: CATEGORIES as unknown as string[] },
      region: { type: "string", enum: ["GLOBAL", "INDIA"] },
      summary: {
        type: "string",
        description: "2-3 sentence factual summary using ONLY information present in the provided title/excerpt. Never invent facts, numbers, or quotes not present in the source text.",
      },
      base_score: {
        type: "integer",
        minimum: 1,
        maximum: 10,
        description:
          "Virality score 1-10 based on: source authority, novelty/shock factor (collapses, records, bans, lawsuits, 'world's tallest', AI breakthroughs, controversial regulation), and general newsworthiness. Do NOT factor in recency or cross-outlet spread - that is applied separately.",
      },
      reason: { type: "string", description: "One short sentence explaining the base_score." },
    },
    required: ["category", "region", "summary", "base_score", "reason"],
  },
};

/**
 * Categorize, summarize, and give a base virality score for one article
 * using only the title/excerpt already captured during ingestion — no
 * extra fetch, so this stays fast and cheap per item.
 */
export async function llmEnrich(input: {
  title: string;
  excerpt: string | null;
  sourceName: string;
  sourceRegion: RegionValue;
}): Promise<LlmEnrichmentResult | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      tools: [ENRICH_TOOL],
      tool_choice: { type: "tool", name: "record_enrichment" },
      messages: [
        {
          role: "user",
          content: [
            `Source: ${input.sourceName} (default region: ${input.sourceRegion})`,
            `Title: ${input.title}`,
            `Excerpt: ${input.excerpt ?? "(none provided)"}`,
            "",
            "Classify this construction/architecture/interior-design news item and score it per the tool schema.",
            "region should stay GLOBAL unless the story is specifically about India (Indian cities, Indian government/regulatory bodies, Indian companies/projects).",
          ].join("\n"),
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return null;
    const parsed = toolUse.input as {
      category: CategoryValue;
      region: RegionValue;
      summary: string;
      base_score: number;
      reason: string;
    };

    return {
      category: parsed.category,
      region: parsed.region,
      summary: parsed.summary,
      baseScore: parsed.base_score,
      reason: parsed.reason,
    };
  } catch (err) {
    console.error("[llmEnrich] Anthropic call failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
