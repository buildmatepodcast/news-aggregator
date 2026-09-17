import Parser from "rss-parser";
import { prisma } from "@/lib/prisma";
import { SEED_SOURCES } from "../../prisma/sources";
import { canonicalHash } from "@/lib/ingestion/dedupe";
import { extractMediaFromFeedItem, fetchOgMedia } from "@/lib/ingestion/media";
import { sendAlert } from "@/lib/alert";
import { FEED_USER_AGENT } from "@/lib/ingestion/userAgent";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": FEED_USER_AGENT,
  },
  customFields: {
    item: [
      ["media:content", "media:content", { keepArray: false }],
      ["media:thumbnail", "media:thumbnail", { keepArray: false }],
      ["content:encoded", "content:encoded"],
    ],
  },
});

const MAX_CONSECUTIVE_FAILURES_FOR_ALERT = 5;

/** Ensures the Source table matches prisma/sources.ts (idempotent, run every cycle). */
async function syncSources() {
  for (const s of SEED_SOURCES) {
    await prisma.source.upsert({
      where: { feedUrl: s.feedUrl },
      create: {
        name: s.name,
        feedUrl: s.feedUrl,
        siteUrl: s.siteUrl,
        region: s.region,
      },
      update: {
        name: s.name,
        siteUrl: s.siteUrl,
        region: s.region,
      },
    });
  }
}

async function ingestSource(source: {
  id: string;
  name: string;
  feedUrl: string;
  region: "GLOBAL" | "INDIA";
}) {
  let itemsFound = 0;
  let itemsNew = 0;
  let feedFailed = false;

  try {
    const feed = await parser.parseURL(source.feedUrl);

    for (const item of feed.items) {
      itemsFound++;
      try {
        const title = item.title?.trim();
        const link = item.link?.trim();
        if (!title || !link) continue;

        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
        const hash = canonicalHash(title);
        const ingestedAt = new Date();

        const existingByUrl = await prisma.article.findUnique({ where: { sourceUrl: link } });
        if (existingByUrl) continue; // already have this exact article

        const existingByHash = await prisma.article.findUnique({
          where: { canonicalHash: hash },
        });

        if (existingByHash) {
          // Same story, different outlet: merge instead of creating a duplicate card.
          if (!existingByHash.mergedSourceUrls.includes(link)) {
            await prisma.article.update({
              where: { id: existingByHash.id },
              data: {
                mergedSourceUrls: { push: link },
                mergedSourceNames: { push: source.name },
              },
            });
          }
          continue;
        }

        let { imageUrl, videoUrl } = extractMediaFromFeedItem(item as never);
        if (!imageUrl && !videoUrl) {
          const og = await fetchOgMedia(link);
          imageUrl = og.imageUrl;
          videoUrl = og.videoUrl;
        }

        const rawExcerpt = (item.contentSnippet || item.summary || "").slice(0, 1000);

        await prisma.article.create({
          data: {
            title,
            sourceId: source.id,
            sourceName: source.name,
            sourceUrl: link,
            canonicalHash: hash,
            publishedAt,
            ingestedAt,
            region: source.region,
            rawExcerpt,
            imageUrl,
            videoUrl,
            ingestionLatencyMs: ingestedAt.getTime() - publishedAt.getTime(),
          },
        });
        itemsNew++;
      } catch (itemErr) {
        // One bad item (odd feed data, a constraint violation, etc.) shouldn't
        // take down the rest of this source's feed for the cycle.
        console.error(`[ingest] ${source.name}: skipped one item -`, itemErr);
      }
    }

    await prisma.source.update({
      where: { id: source.id },
      data: {
        lastFetchedAt: new Date(),
        lastSuccessAt: new Date(),
        lastError: null,
        consecutiveFailures: 0,
      },
    });
  } catch (err) {
    feedFailed = true;
    const message = err instanceof Error ? err.message : String(err);
    const updated = await prisma.source.update({
      where: { id: source.id },
      data: {
        lastFetchedAt: new Date(),
        lastError: message,
        consecutiveFailures: { increment: 1 },
      },
    });
    console.error(`[ingest] ${source.name} failed:`, message);
    if (updated.consecutiveFailures === MAX_CONSECUTIVE_FAILURES_FOR_ALERT) {
      await sendAlert(
        `Source "${source.name}" has failed ${updated.consecutiveFailures} consecutive polls. Last error: ${message}`
      );
    }
  }

  return { itemsFound, itemsNew, feedFailed };
}

export async function runIngestionCycle() {
  const startedAt = new Date();
  await syncSources();
  const sources = await prisma.source.findMany({ where: { enabled: true } });

  let itemsFound = 0;
  let itemsNew = 0;
  let errors = 0;

  for (const source of sources) {
    const result = await ingestSource(source);
    itemsFound += result.itemsFound;
    itemsNew += result.itemsNew;
    if (result.feedFailed) errors++;
  }

  await prisma.ingestionRun.create({
    data: {
      startedAt,
      finishedAt: new Date(),
      sourcesPolled: sources.length,
      itemsFound,
      itemsNew,
      errors,
    },
  });

  console.log(
    `[ingest] cycle complete: ${sources.length} sources, ${itemsFound} items seen, ${itemsNew} new, ${errors} errors`
  );

  return { sourcesPolled: sources.length, itemsFound, itemsNew, errors };
}
