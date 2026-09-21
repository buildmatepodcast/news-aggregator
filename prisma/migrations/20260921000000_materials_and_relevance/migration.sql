-- AlterEnum
ALTER TYPE "Category" ADD VALUE 'BUILDING_MATERIALS';

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "excluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "excludedReason" TEXT;

-- CreateIndex
CREATE INDEX "Article_excluded_idx" ON "Article"("excluded");

