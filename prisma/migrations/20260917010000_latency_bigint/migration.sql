-- AlterTable: some feed items report a publishedAt far enough in the past
-- that (ingestedAt - publishedAt) in milliseconds overflows a 32-bit int.
ALTER TABLE "Article" ALTER COLUMN "ingestionLatencyMs" TYPE BIGINT;
