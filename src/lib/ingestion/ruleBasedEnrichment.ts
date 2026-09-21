import type { CategoryValue, RegionValue } from "@/lib/types";

/**
 * Deterministic fallback used when no ANTHROPIC_API_KEY is configured, or
 * when the LLM call fails after retries. Keeps the site populated and
 * scored rather than stuck in PENDING; the brief calls for a repeatable
 * rubric either way, so this is documented the same way virality.ts is.
 */

const CATEGORY_KEYWORDS: Record<Exclude<CategoryValue, "GENERAL">, string[]> = {
  NEW_TECHNOLOGIES: [
    "3d print",
    "3d-print",
    "robot",
    "artificial intelligence",
    " ai ",
    "modular",
    "prefab",
    "smart building",
    "drone",
    "digital twin",
    "bim",
    "material science",
    "autonomous",
  ],
  NEW_PROJECTS: [
    "groundbreaking",
    "topping out",
    "topping-out",
    "opens",
    "unveil",
    "launch",
    "announces",
    "breaks ground",
    "completes",
    "inaugurat",
    "reveals",
  ],
  BYLAWS_REGULATIONS: [
    "zoning",
    "building code",
    "regulation",
    "bylaw",
    "policy",
    "ban",
    "approves",
    " law ",
    "permit",
    "compliance",
    "safety code",
    "legislation",
  ],
  // Deliberately covers two different things under one label: real
  // post-mortem/failure content, AND instructional "how to"/"how it works"
  // guides (format wins over topic here - "how to install tiles" belongs
  // here, not under BUILDING_MATERIALS, because of the how-to format).
  LESSONS_LEARNED: [
    "collapse",
    "failure",
    "lawsuit",
    "investigation",
    "post-mortem",
    "postmortem",
    "case study",
    "killed",
    "injur",
    "litigation",
    "fined",
    "negligence",
    "defect",
    "how to",
    "how-to",
    "how do you",
    "how does a",
    "how it works",
    "step by step",
    "step-by-step",
    "guide to",
    "beginner's guide",
    "diy",
    "tips for",
    "how to choose",
    "how to select",
    "how to install",
    "how to build",
    "how to lay",
    "how to polish",
    "how to hire",
  ],
  // Deliberately broad - see the BUILDING_MATERIALS description in
  // llmEnrich.ts's tool schema for the full scope this is meant to mirror.
  BUILDING_MATERIALS: [
    "cement",
    "concrete",
    "steel",
    "timber",
    "lumber",
    "glass panel",
    "facade",
    "insulation",
    "aggregate",
    "composite material",
    "rebar",
    "admixture",
    "mass timber",
    "glulam",
    "cross-laminated",
    "recycled material",
    "material innovation",
    "brick",
    "block",
    "asphalt",
    "gypsum",
    "marble",
    "stone",
    "sand mining",
    "fly ash",
    "ggbs",
    "gfrp",
    "cfrp",
    "carbon nanotube",
    "upvc",
    "aluminium window",
    "aluminium door",
    "partition system",
    "kitchen cabinet",
    "wardrobe",
    "architectural hardware",
    "door hardware",
    "tile",
    "sanitaryware",
    "sanitary ware",
    "bathware",
    "formwork",
    "scaffolding",
    "construction equipment",
    "testing machine",
    "power tool",
    "safety gear",
    "ppe ",
    "carpet",
    "flooring",
    "upholstery fabric",
    "paint",
    "waterproofing",
    "varnish",
    "swimming pool construction",
    "sauna",
    "shower cubicle",
  ],
};

const SHOCK_KEYWORDS = [
  "collapse",
  "record-breaking",
  "record breaking",
  "tallest",
  "largest",
  "world's first",
  "first-ever",
  "banned",
  "scandal",
  "controversy",
  "lawsuit",
  "ai replaces",
  "shocking",
  "viral",
];

const INDIA_HINTS = [
  "india",
  "mumbai",
  "delhi",
  "bengaluru",
  "bangalore",
  "hyderabad",
  "chennai",
  "kolkata",
  "pune",
  "ahmedabad",
  "rera",
  "pib",
  "modi",
  "crore",
  "lakh",
];

// Keyword hints for the rule-based fallback only - the LLM path (primary,
// used whenever ANTHROPIC_API_KEY is set) makes this call with real
// judgment instead. Two keyword hits required before overriding the
// source's default region, same threshold as India, to avoid false
// positives from an incidental mention.
const REGION_HINTS: Partial<Record<RegionValue, string[]>> = {
  SOUTH_ASIA: [
    "bangladesh",
    "dhaka",
    "pakistan",
    "karachi",
    "lahore",
    "islamabad",
    "nepal",
    "kathmandu",
    "sri lanka",
    "colombo",
  ],
  SOUTHEAST_ASIA: [
    "indonesia",
    "jakarta",
    "philippines",
    "manila",
    "vietnam",
    "hanoi",
    "ho chi minh",
    "thailand",
    "bangkok",
    "myanmar",
    "yangon",
  ],
  MIDDLE_EAST: [
    "uae",
    "dubai",
    "abu dhabi",
    "saudi arabia",
    "riyadh",
    "jeddah",
    "qatar",
    "doha",
    "gulf",
    "kuwait",
    "bahrain",
  ],
  SUB_SAHARAN_AFRICA: [
    "kenya",
    "nairobi",
    "nigeria",
    "lagos",
    "abuja",
    "ethiopia",
    "addis ababa",
    "tanzania",
    "dar es salaam",
  ],
  LATIN_AMERICA: [
    "brazil",
    "sao paulo",
    "rio de janeiro",
    "mexico",
    "mexico city",
    "colombia",
    "bogota",
    "buenos aires",
    "argentina",
  ],
  CHINA: ["china", "chinese", "beijing", "shanghai", "shenzhen", "hong kong", "guangzhou"],
};

export function detectCategory(text: string): CategoryValue {
  const lower = text.toLowerCase();
  let best: CategoryValue = "GENERAL";
  let bestHits = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    Exclude<CategoryValue, "GENERAL">,
    string[]
  ][]) {
    const hits = keywords.filter((k) => lower.includes(k)).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = category;
    }
  }
  return best;
}

export function detectRegionOverride(text: string, sourceRegion: RegionValue): RegionValue {
  // A source dedicated to a specific region (e.g. an India-only or
  // Middle-East-only outlet) is trusted as-is; only GLOBAL-sourced items
  // get re-examined for a more specific region.
  if (sourceRegion !== "GLOBAL") return sourceRegion;

  const lower = text.toLowerCase();

  const indiaHits = INDIA_HINTS.filter((k) => lower.includes(k)).length;
  if (indiaHits >= 2) return "INDIA";

  for (const [region, keywords] of Object.entries(REGION_HINTS) as [RegionValue, string[]][]) {
    const hits = keywords.filter((k) => lower.includes(k)).length;
    if (hits >= 2) return region;
  }

  return "GLOBAL";
}

export function ruleBasedBaseScore(text: string): { score: number; reason: string } {
  const lower = text.toLowerCase();
  const shockHits = SHOCK_KEYWORDS.filter((k) => lower.includes(k));
  const score = Math.min(7, 4 + shockHits.length); // baseline 4, capped pre-boosts at 7
  const reason = shockHits.length
    ? `Keyword signals: ${shockHits.slice(0, 3).join(", ")}`
    : "No strong novelty/shock keywords detected; baseline source-authority score";
  return { score, reason };
}

export function fallbackSummary(title: string, excerpt: string | null): string {
  if (excerpt && excerpt.length > 40) {
    const trimmed = excerpt.slice(0, 280);
    const lastPeriod = trimmed.lastIndexOf(". ");
    return lastPeriod > 80 ? trimmed.slice(0, lastPeriod + 1) : trimmed + (excerpt.length > 280 ? "…" : "");
  }
  return title;
}
