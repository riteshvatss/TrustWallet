-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "confidence" TEXT NOT NULL DEFAULT 'low',
ADD COLUMN     "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[];
