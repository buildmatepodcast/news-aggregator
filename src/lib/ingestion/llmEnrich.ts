import Anthropic from "@anthropic-ai/sdk";
import type { CategoryValue, RegionValue } from "@/lib/types";
import { CATEGORIES, REGIONS } from "@/lib/types";

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
  relevant: boolean;
  excludeReason: string | null;
};

const ENRICH_TOOL = {
  name: "record_enrichment",
  description: "Record the categorization, factual summary, virality score, and relevance for a construction/architecture/interior-design/building-materials news item.",
  input_schema: {
    type: "object" as const,
    properties: {
      relevant: {
        type: "boolean",
        description:
          "false if this item is NOT actually about construction, architecture, interior design, civil engineering, building materials, or real estate. Building materials scope is deliberately broad and IS relevant: structural materials, steel, concrete, glass/facades, doors/windows/partitions, kitchens, wardrobes, hardware, stone/marble/aggregates, composites (GFRP/CFRP/etc.), equipment/tools/safety gear, tiles, bathware/sanitaryware, bricks/blocks, wood, flooring/carpets/upholstery fabric, paints/waterproofing, pools/saunas, and the businesses/research behind any of these. 'How to'/instructional guides and 'how it works' explainers for any of the above trades or materials (tiling, masonry, woodworking, painting, choosing a material or hiring an architect/engineer, etc.) are ALSO relevant, even if written for homeowners/DIYers rather than professionals. Site scope excludes: automotive/vehicle stories (cars, motorcycles, road tests), fashion/beauty/jewellery/watch product content, and general financial/market/economy news (stock prices, GDP, interest rates, IPOs) that only mentions construction in passing without being about a specific building, project, material, company, or regulation. When in doubt about a borderline design/art/culture piece from an architecture outlet, prefer relevant: true.",
      },
      exclude_reason: {
        type: "string",
        description: "Required when relevant is false: one short phrase naming why (e.g. 'automotive review', 'general stock market news').",
      },
      category: {
        type: "string",
        enum: CATEGORIES as unknown as string[],
        description:
          "BUILDING_MATERIALS covers a wide, deliberately broad scope - any story centered on a specific building product, material, equipment, or the businesses/technology behind them, including: structural materials, construction steel, concrete and concrete technologies, glass and facades, uPVC/aluminium doors/windows/partitions, kitchens, wardrobes, hardware and architectural hardware, marble/stone/sand/aggregates, fly ash and GGBS, GFRP/CFRP/carbon nanotubes and other advanced/composite materials, construction equipment/tools/testing machines/safety gear, tiles, bathware/sanitaryware, formwork, bricks and blocks, wood, upholstery fabrics, carpets and flooring, interior-design materials and finishes, paints/polishes/varnishes/waterproofing, swimming pools/saunas/shower cubicles, and both new-age and traditional materials generally - plus R&D/research breakthroughs and business news (funding, expansion, M&A) about companies in this space.\n\nLESSONS_LEARNED also deliberately covers two different things under one label: (1) the original meaning - collapses, failures, litigation, post-mortems, safety case studies; AND (2) instructional/educational content - any 'how to' guide, 'how it works' explainer, tutorial, or practical technique piece for construction, architecture, civil engineering, masonry, woodwork, tiling, painting, or choosing a material/professional (e.g. 'how to install tiles properly', 'how to lay brick', 'how to make perfect concrete', 'how to polish wood', 'how to choose the best window/steel/cement', 'how to choose an architect or structural engineer', 'how does a crane/HVAC system/foundation work'). FORMAT WINS OVER TOPIC for this second case: an instructional/how-to piece about a specific material (e.g. 'how to install tiles') goes in LESSONS_LEARNED, not BUILDING_MATERIALS, because the how-to guide format is what matters here.\n\nUse the other categories as before; BUILDING_MATERIALS wins over GENERAL or NEW_TECHNOLOGIES whenever the story's real subject is a physical product or material rather than a project, company strategy, or software/AI method in the abstract (and isn't itself an instructional guide, per the LESSONS_LEARNED rule above).",
      },
      region: {
        type: "string",
        enum: REGIONS as unknown as string[],
        description:
          "Which region this story is actually ABOUT (not which outlet published it). INDIA for stories about India specifically. SOUTH_ASIA for Bangladesh, Pakistan, Nepal, or Sri Lanka. SOUTHEAST_ASIA for Indonesia, Philippines, Vietnam, Thailand, or Myanmar. MIDDLE_EAST for UAE, Saudi Arabia, Qatar, or the wider Gulf. SUB_SAHARAN_AFRICA for Kenya, Nigeria, Ethiopia, Tanzania, etc. LATIN_AMERICA for Brazil, Mexico, Colombia, etc. CHINA for mainland China / Hong Kong. GLOBAL for everything else (US, Europe, international, or no specific country tied to the story).",
      },
      summary: {
        type: "string",
        description: "2-3 sentence factual summary using ONLY information present in the provided title/excerpt. Never invent facts, numbers, or quotes not present in the source text. If relevant is false, a one-sentence summary is fine.",
      },
      base_score: {
        type: "integer",
        minimum: 1,
        maximum: 10,
        description:
          "Virality score 1-10 based on: source authority, novelty/shock factor (collapses, records, bans, lawsuits, 'world's tallest', AI breakthroughs, controversial regulation), and general newsworthiness. Do NOT factor in recency or cross-outlet spread - that is applied separately. Irrelevant items can still get a plausible score; it's unused once excluded.",
      },
      reason: { type: "string", description: "One short sentence explaining the base_score." },
    },
    required: ["relevant", "category", "region", "summary", "base_score", "reason"],
  },
};

/**
 * Categorize, summarize, score, and check relevance for one article using
 * only the title/excerpt already captured during ingestion — no extra
 * fetch, so this stays fast and cheap per item.
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
      max_tokens: 500,
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
            "First decide if this item is actually in scope for a construction/architecture/interior-design/building-materials/real-estate news site, then classify and score it per the tool schema.",
            `The source's default region is ${input.sourceRegion} - use that as a starting assumption, but override it based on what the story is actually about (a Global-source outlet can still run a story specifically about Nigeria, Vietnam, or the UAE, and that should be tagged accordingly).`,
          ].join("\n"),
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return null;
    const parsed = toolUse.input as {
      relevant: boolean;
      exclude_reason?: string;
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
      relevant: parsed.relevant,
      excludeReason: parsed.relevant ? null : parsed.exclude_reason ?? "Out of scope",
    };
  } catch (err) {
    console.error("[llmEnrich] Anthropic call failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
