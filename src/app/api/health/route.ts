import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const lastRun = await prisma.ingestionRun.findFirst({ orderBy: { finishedAt: "desc" } });
    const totalArticles = await prisma.article.count();
    const pendingEnrichment = await prisma.article.count({ where: { enrichmentStatus: "PENDING" } });

    const minutesSinceLastRun = lastRun?.finishedAt
      ? Math.round((Date.now() - lastRun.finishedAt.getTime()) / 60000)
      : null;

    const stallThreshold = Number(process.env.ALERT_STALL_THRESHOLD_MINUTES ?? 30);
    const healthy = minutesSinceLastRun !== null && minutesSinceLastRun <= stallThreshold;

    return NextResponse.json({
      healthy,
      lastIngestionRun: lastRun,
      minutesSinceLastRun,
      totalArticles,
      pendingEnrichment,
    });
  } catch (err) {
    console.error("[api/health] query failed:", err);
    return NextResponse.json(
      { healthy: false, lastIngestionRun: null, minutesSinceLastRun: null, error: "Database unavailable" },
      { status: 503 }
    );
  }
}
