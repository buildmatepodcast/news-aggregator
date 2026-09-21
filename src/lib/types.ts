// Frontend-safe enum mirrors of the Prisma schema (kept separate from
// @prisma/client so these can be imported into client components).

export const CATEGORIES = [
  "NEW_TECHNOLOGIES",
  "NEW_PROJECTS",
  "BYLAWS_REGULATIONS",
  "LESSONS_LEARNED",
  "BUILDING_MATERIALS",
  "GENERAL",
] as const;
export type CategoryValue = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  NEW_TECHNOLOGIES: "New Technologies",
  NEW_PROJECTS: "New Projects",
  BYLAWS_REGULATIONS: "Bylaws & Regulations",
  LESSONS_LEARNED: "Lessons Learned",
  BUILDING_MATERIALS: "Building Materials",
  GENERAL: "General",
};

export const REGIONS = [
  "GLOBAL",
  "INDIA",
  "SOUTH_ASIA",
  "SOUTHEAST_ASIA",
  "MIDDLE_EAST",
  "SUB_SAHARAN_AFRICA",
  "LATIN_AMERICA",
  "CHINA",
] as const;
export type RegionValue = (typeof REGIONS)[number];

export const REGION_LABELS: Record<RegionValue, string> = {
  GLOBAL: "Global",
  INDIA: "India",
  SOUTH_ASIA: "South Asia",
  SOUTHEAST_ASIA: "Southeast Asia",
  MIDDLE_EAST: "Middle East",
  SUB_SAHARAN_AFRICA: "Sub-Saharan Africa",
  LATIN_AMERICA: "Latin America",
  CHINA: "China",
};

export type ArticleCard = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  ingestedAt: string;
  category: CategoryValue | null;
  region: RegionValue;
  summary: string | null;
  viralityScore: number | null;
  viralityReason: string | null;
  originType: "PUBLICATION" | "SOCIAL";
  originHandle: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  mergedSourceUrls: string[];
  mergedSourceNames: string[];
};

export function viralityTier(score: number | null): "low" | "mid" | "high" {
  if (score === null) return "low";
  if (score >= 8) return "high";
  if (score >= 5) return "mid";
  return "low";
}
