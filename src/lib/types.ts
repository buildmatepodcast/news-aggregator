// Frontend-safe enum mirrors of the Prisma schema (kept separate from
// @prisma/client so these can be imported into client components).

export const CATEGORIES = [
  "NEW_TECHNOLOGIES",
  "NEW_PROJECTS",
  "BYLAWS_REGULATIONS",
  "LESSONS_LEARNED",
  "GENERAL",
] as const;
export type CategoryValue = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  NEW_TECHNOLOGIES: "New Technologies",
  NEW_PROJECTS: "New Projects",
  BYLAWS_REGULATIONS: "Bylaws & Regulations",
  LESSONS_LEARNED: "Lessons Learned",
  GENERAL: "General",
};

export const REGIONS = ["GLOBAL", "INDIA"] as const;
export type RegionValue = (typeof REGIONS)[number];

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
