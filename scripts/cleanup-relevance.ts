import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { checkExclusion } from "@/lib/ingestion/relevance";

/**
 * One-off retroactive cleanup: applies the rule-based relevance filter to
 * everything already ingested (title + summary/excerpt), so cars/vehicles
 * and off-topic financial news that got through before the filter existed
 * disappear from the feed immediately, without re-spending Anthropic calls
 * on the whole backlog. Going forward, new articles get this check as part
 * of normal enrichment (LLM path when a key is set, this same rule-based
 * check otherwise).
 */
(async () => {
  const articles = await prisma.article.findMany({
    where: { excluded: false },
    select: { id: true, title: true, summary: true, rawExcerpt: true, sourceUrl: true },
  });

  let excludedCount = 0;
  const examples: { title: string; reason: string }[] = [];

  for (const a of articles) {
    const text = `${a.title} ${a.summary ?? a.rawExcerpt ?? ""}`;
    const { excluded, reason } = checkExclusion(text, a.sourceUrl);
    if (excluded) {
      await prisma.article.update({
        where: { id: a.id },
        data: { excluded: true, excludedReason: reason },
      });
      excludedCount++;
      if (examples.length < 20) examples.push({ title: a.title, reason: reason! });
    }
  }

  console.log(`Scanned ${articles.length} articles, excluded ${excludedCount}.`);
  for (const e of examples) console.log(` - "${e.title}" -> ${e.reason}`);

  await prisma.$disconnect();
})();
