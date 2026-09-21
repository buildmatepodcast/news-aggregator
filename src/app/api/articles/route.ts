import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, Category, Region } from "@prisma/client";
import { getAccessFromRequest } from "@/lib/access";
import { TOP_STORY_THRESHOLD } from "@/components/tabs";
import { REGIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const region = params.get("region"); // one of RegionValue | null (all regions)
  const category = params.get("category"); // one of CategoryValue | null
  const sort = params.get("sort") ?? "newest"; // "newest" | "viral"
  const q = params.get("q")?.trim();
  const mediaOnly = params.get("mediaOnly") === "true";
  const viralOnly = params.get("viralOnly") === "true"; // score >= 8, cross-cutting "Viral" tab
  const cursor = params.get("cursor") ?? undefined;
  const take = Math.min(Number(params.get("take") ?? 24), 50);

  const where: Prisma.ArticleWhereInput = {
    enrichmentStatus: { in: ["ENRICHED", "FAILED"] }, // don't show un-enriched placeholders
    excluded: false, // off-topic (cars/vehicles, fashion, generic financial news, etc.)
  };

  if (region && (REGIONS as readonly string[]).includes(region)) {
    where.region = region as Region;
  }
  if (category) {
    where.category = category as Category;
  }
  if (viralOnly) {
    where.viralityScore = { gte: 8 };
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }
  if (mediaOnly) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { OR: [{ imageUrl: { not: null } }, { videoUrl: { not: null } }] },
    ];
  }

  const orderBy: Prisma.ArticleOrderByWithRelationInput[] =
    sort === "viral"
      ? [{ viralityScore: "desc" }, { publishedAt: "desc" }]
      : [{ publishedAt: "desc" }];

  try {
    const articles = await prisma.article.findMany({
      where,
      orderBy,
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      // Explicit select: keeps internal-only fields (rawExcerpt, enrichmentAttempts,
      // and ingestionLatencyMs which is a BigInt and can't pass through JSON.stringify)
      // out of the response instead of shipping the whole row to the client.
      select: {
        id: true,
        title: true,
        sourceName: true,
        sourceUrl: true,
        publishedAt: true,
        ingestedAt: true,
        category: true,
        region: true,
        summary: true,
        viralityScore: true,
        viralityReason: true,
        originType: true,
        originHandle: true,
        imageUrl: true,
        videoUrl: true,
        mergedSourceUrls: true,
        mergedSourceNames: true,
      },
    });

    const lastRun = await prisma.ingestionRun.findFirst({ orderBy: { finishedAt: "desc" } });

    // Paywall: only Top Stories (score >= threshold) are freely readable.
    // Redact the summary server-side for everyone else unless the request
    // carries a valid, active subscriber session - a CSS blur on the
    // client alone wouldn't actually withhold anything.
    const { hasAccess } = await getAccessFromRequest(req);
    const gated = articles.map((a) => {
      const isTopStory = (a.viralityScore ?? 0) >= TOP_STORY_THRESHOLD;
      if (hasAccess || isTopStory) return a;
      return { ...a, summary: null };
    });

    return NextResponse.json({
      articles: gated,
      nextCursor: articles.length === take ? articles[articles.length - 1].id : null,
      lastUpdated: lastRun?.finishedAt ?? null,
    });
  } catch (err) {
    console.error("[api/articles] query failed:", err);
    return NextResponse.json(
      { articles: [], nextCursor: null, lastUpdated: null, error: "Database unavailable" },
      { status: 503 }
    );
  }
}
