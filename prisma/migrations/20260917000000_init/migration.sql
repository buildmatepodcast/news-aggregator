-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('NEW_TECHNOLOGIES', 'NEW_PROJECTS', 'BYLAWS_REGULATIONS', 'LESSONS_LEARNED', 'GENERAL');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('GLOBAL', 'INDIA');

-- CreateEnum
CREATE TYPE "OriginType" AS ENUM ('PUBLICATION', 'SOCIAL');

-- CreateEnum
CREATE TYPE "EnrichmentStatus" AS ENUM ('PENDING', 'ENRICHED', 'FAILED');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feedUrl" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "originType" "OriginType" NOT NULL DEFAULT 'PUBLICATION',
    "handle" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "canonicalHash" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrichedAt" TIMESTAMP(3),
    "category" "Category",
    "region" "Region" NOT NULL,
    "summary" TEXT,
    "rawExcerpt" TEXT,
    "viralityScore" INTEGER,
    "viralityReason" TEXT,
    "originType" "OriginType" NOT NULL DEFAULT 'PUBLICATION',
    "originHandle" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "enrichmentStatus" "EnrichmentStatus" NOT NULL DEFAULT 'PENDING',
    "enrichmentAttempts" INTEGER NOT NULL DEFAULT 0,
    "mergedSourceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mergedSourceNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ingestionLatencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "sourcesPolled" INTEGER NOT NULL DEFAULT 0,
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsNew" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_name_key" ON "Source"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Source_feedUrl_key" ON "Source"("feedUrl");

-- CreateIndex
CREATE INDEX "Source_enabled_idx" ON "Source"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Article_sourceUrl_key" ON "Article"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Article_canonicalHash_key" ON "Article"("canonicalHash");

-- CreateIndex
CREATE INDEX "Article_region_category_idx" ON "Article"("region", "category");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE INDEX "Article_viralityScore_idx" ON "Article"("viralityScore");

-- CreateIndex
CREATE INDEX "Article_enrichmentStatus_idx" ON "Article"("enrichmentStatus");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
