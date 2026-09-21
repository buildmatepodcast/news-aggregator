-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Region" ADD VALUE 'SOUTH_ASIA';
ALTER TYPE "Region" ADD VALUE 'SOUTHEAST_ASIA';
ALTER TYPE "Region" ADD VALUE 'MIDDLE_EAST';
ALTER TYPE "Region" ADD VALUE 'SUB_SAHARAN_AFRICA';
ALTER TYPE "Region" ADD VALUE 'LATIN_AMERICA';
ALTER TYPE "Region" ADD VALUE 'CHINA';

