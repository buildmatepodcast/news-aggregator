import { prisma } from "@/lib/prisma";
import { llmEnrich } from "@/lib/ingestion/llmEnrich";
import {
  detectCategory,
  detectRegionOverride,
  ruleBasedBaseScore,
  fallbackSummary,
} from "@/lib/ingestion/ruleBasedEnrichment";
import { checkExclusion } from "@/lib/ingestion/relevance";
import { computeFinalVirality } from "@/lib/virality";
import { sendAlert } from "@/lib/alert";

const BATCH_SIZE = 8;
const MAX_ATTEMPTS = 3;

export async function runEnrichmentCycle() {
  const pending = await prisma.article.findMany({
    where: {
      enrichmentStatus: "PENDING",
      enrichmentAttempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { ingestedAt: "asc" },
    take: BATCH_SIZE,
  });

  let succeeded = 0;
  let failed = 0;

  for (const article of pending) {
    const text = `${article.title} ${article.rawExcerpt ?? ""}`;

    try {
      const llmResult = await llmEnrich({
        title: article.title,
        excerpt: article.rawExcerpt,
        sourceName: article.sourceName,
        sourceRegion: article.region,
      });

      let category, region, summary, baseScore, reasonNote, excluded, excludedReason;

      if (llmResult) {
        category = llmResult.category;
        region = llmResult.region;
        summary = llmResult.summary;
        baseScore = llmResult.baseScore;
        reasonNote = llmResult.reason;
        excluded = !llmResult.relevant;
        excludedReason = llmResult.excludeReason;

        // URL-path is a very cheap, very reliable signal (see relevance.ts) -
        // let it override even an LLM "relevant" verdict as a safety net.
        if (!excluded) {
          const urlCheck = checkExclusion("", article.sourceUrl);
          if (urlCheck.excluded) {
            excluded = true;
            excludedReason = urlCheck.reason;
          }
        }
      } else {
        category = detectCategory(text);
        region = detectRegionOverride(text, article.region);
        summary = fallbackSummary(article.title, article.rawExcerpt);
        const rb = ruleBasedBaseScore(text);
        baseScore = rb.score;
        reasonNote = rb.reason;
        const exclusion = checkExclusion(text, article.sourceUrl);
        excluded = exclusion.excluded;
        excludedReason = exclusion.reason;
      }

      const { score, boosts } = computeFinalVirality({
        llmBaseScore: baseScore,
        publishedAt: article.publishedAt,
        mergedSourceCount: article.mergedSourceUrls.length,
      });

      const fullReason = boosts.length ? `${reasonNote} (+${boosts.join(", ")})` : reasonNote;

      await prisma.article.update({
        where: { id: article.id },
        data: {
          category,
          region,
          summary,
          viralityScore: score,
          viralityReason: fullReason,
          excluded,
          excludedReason,
          enrichmentStatus: "ENRICHED",
          enrichedAt: new Date(),
          enrichmentAttempts: { increment: 1 },
        },
      });
      succeeded++;
    } catch (err) {
      console.error(`[enrich] failed for article ${article.id}:`, err);
      const attempts = article.enrichmentAttempts + 1;
      await prisma.article.update({
        where: { id: article.id },
        data: {
          enrichmentAttempts: attempts,
          enrichmentStatus: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
        },
      });
      failed++;
    }
  }

  if (pending.length > 0) {
    console.log(`[enrich] cycle complete: ${succeeded} enriched, ${failed} failed, batch=${pending.length}`);
  }

  const stuckCount = await prisma.article.count({ where: { enrichmentStatus: "FAILED" } });
  if (stuckCount > 0 && stuckCount % 20 === 0) {
    await sendAlert(`${stuckCount} articles have permanently failed enrichment after ${MAX_ATTEMPTS} attempts.`);
  }

  return { processed: pending.length, succeeded, failed };
}
