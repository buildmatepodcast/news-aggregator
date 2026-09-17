import "dotenv/config";
import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import { runIngestionCycle } from "@/workers/ingest";
import { runEnrichmentCycle } from "@/workers/enrich";
import { sendAlert } from "@/lib/alert";

const INGEST_INTERVAL_MINUTES = Number(process.env.INGEST_INTERVAL_MINUTES ?? 10);
const ENRICH_INTERVAL_SECONDS = Number(process.env.ENRICH_INTERVAL_SECONDS ?? 30);
const STALL_THRESHOLD_MINUTES = Number(process.env.ALERT_STALL_THRESHOLD_MINUTES ?? 30);

let ingesting = false;
let enriching = false;

async function safeIngest() {
  if (ingesting) return;
  ingesting = true;
  try {
    await runIngestionCycle();
  } catch (err) {
    console.error("[worker] ingestion cycle threw:", err);
    await sendAlert(`Ingestion cycle crashed: ${err instanceof Error ? err.message : err}`);
  } finally {
    ingesting = false;
  }
}

async function safeEnrich() {
  if (enriching) return;
  enriching = true;
  try {
    await runEnrichmentCycle();
  } catch (err) {
    console.error("[worker] enrichment cycle threw:", err);
  } finally {
    enriching = false;
  }
}

async function checkStall() {
  const lastRun = await prisma.ingestionRun.findFirst({ orderBy: { finishedAt: "desc" } });
  if (!lastRun?.finishedAt) return;
  const minutesSince = (Date.now() - lastRun.finishedAt.getTime()) / 60000;
  if (minutesSince > STALL_THRESHOLD_MINUTES) {
    await sendAlert(
      `Ingestion has not completed in ${Math.round(minutesSince)} minutes (threshold: ${STALL_THRESHOLD_MINUTES}). The worker process may be down.`
    );
  }
}

console.log(
  `[worker] starting: ingest every ${INGEST_INTERVAL_MINUTES}m, enrich every ${ENRICH_INTERVAL_SECONDS}s, stall alert after ${STALL_THRESHOLD_MINUTES}m`
);

// Run once immediately on boot so a fresh deploy isn't empty for a full interval.
safeIngest();
safeEnrich();
setInterval(safeEnrich, ENRICH_INTERVAL_SECONDS * 1000);

cron.schedule(`*/${INGEST_INTERVAL_MINUTES} * * * *`, safeIngest);
cron.schedule("*/5 * * * *", checkStall);

process.on("SIGTERM", async () => {
  console.log("[worker] shutting down");
  await prisma.$disconnect();
  process.exit(0);
});
