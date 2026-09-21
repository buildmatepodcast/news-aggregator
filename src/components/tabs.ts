import type { RegionValue } from "@/lib/types";

export type TabId =
  | "global"
  | "india"
  | "south-asia"
  | "southeast-asia"
  | "middle-east"
  | "africa"
  | "latin-america"
  | "china"
  | "new-tech"
  | "new-projects"
  | "bylaws"
  | "lessons"
  | "materials"
  | "viral";

export const TABS: {
  id: TabId;
  label: string;
  params: { region?: RegionValue; category?: string; viralOnly?: boolean };
}[] = [
  { id: "global", label: "Global", params: { region: "GLOBAL" } },
  { id: "india", label: "India", params: { region: "INDIA" } },
  { id: "south-asia", label: "South Asia", params: { region: "SOUTH_ASIA" } },
  { id: "southeast-asia", label: "Southeast Asia", params: { region: "SOUTHEAST_ASIA" } },
  { id: "middle-east", label: "Middle East", params: { region: "MIDDLE_EAST" } },
  { id: "africa", label: "Sub-Saharan Africa", params: { region: "SUB_SAHARAN_AFRICA" } },
  { id: "latin-america", label: "Latin America", params: { region: "LATIN_AMERICA" } },
  { id: "china", label: "China", params: { region: "CHINA" } },
  { id: "new-tech", label: "New Technologies", params: { category: "NEW_TECHNOLOGIES" } },
  { id: "new-projects", label: "New Projects", params: { category: "NEW_PROJECTS" } },
  { id: "bylaws", label: "Bylaws & Regulations", params: { category: "BYLAWS_REGULATIONS" } },
  { id: "lessons", label: "Lessons Learned", params: { category: "LESSONS_LEARNED" } },
  { id: "materials", label: "Building Materials", params: { category: "BUILDING_MATERIALS" } },
  { id: "viral", label: "Top Stories 🔥", params: { viralOnly: true } },
];

/** Score threshold shared with the "viralOnly" query param - a Top Story
 * (score >= this) is free to read for everyone, subscriber or not. */
export const TOP_STORY_THRESHOLD = 8;
