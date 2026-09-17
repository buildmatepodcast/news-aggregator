/**
 * Virality scoring formula (documented per the brief so scores stay
 * consistent as the pipeline evolves):
 *
 *   final = clamp(llmBaseScore + crossSourceBoost + recencyBoost, 1, 10)
 *
 * - llmBaseScore (1-10): the LLM is prompted to weigh source authority,
 *   novelty/shock keywords ("collapse", "record-breaking", "banned",
 *   "world's tallest", etc.) and the inherent newsworthiness of the story.
 *   This is the qualitative signal we don't have a cheap deterministic
 *   substitute for.
 * - crossSourceBoost (+1): set once at least one other outlet has been
 *   merged into the same story (see mergedSourceUrls) — real evidence of
 *   cross-platform spread rather than a prediction of it.
 * - recencyBoost (+1): set while the story is still within its first 6
 *   hours of life, since breaking news reads as more "viral" before the
 *   news cycle catches up. This is a temporary boost — it naturally drops
 *   off as the item ages, without needing a re-scoring job.
 *
 * v1 has no live engagement metrics (no social API), so engagement-velocity
 * is intentionally not a term here; the plan is to add it once social
 * ingestion (phase 2) is wired up.
 */
export function computeFinalVirality(params: {
  llmBaseScore: number;
  publishedAt: Date;
  mergedSourceCount: number;
  now?: Date;
}): { score: number; boosts: string[] } {
  const { llmBaseScore, publishedAt, mergedSourceCount } = params;
  const now = params.now ?? new Date();
  const boosts: string[] = [];
  let score = llmBaseScore;

  if (mergedSourceCount >= 1) {
    score += 1;
    boosts.push("cross-outlet spread");
  }

  const ageHours = (now.getTime() - publishedAt.getTime()) / 36e5;
  if (ageHours >= 0 && ageHours <= 6) {
    score += 1;
    boosts.push("breaking (<6h old)");
  }

  score = Math.max(1, Math.min(10, Math.round(score)));
  return { score, boosts };
}
