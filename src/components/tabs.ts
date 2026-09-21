export type TabId =
  | "global"
  | "india"
  | "new-tech"
  | "new-projects"
  | "bylaws"
  | "lessons"
  | "materials"
  | "viral";

export const TABS: {
  id: TabId;
  label: string;
  params: { region?: "GLOBAL" | "INDIA"; category?: string; viralOnly?: boolean };
}[] = [
  { id: "global", label: "Global", params: { region: "GLOBAL" } },
  { id: "india", label: "India", params: { region: "INDIA" } },
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
