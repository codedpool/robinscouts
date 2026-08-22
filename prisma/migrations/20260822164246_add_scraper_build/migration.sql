-- CreateTable
CREATE TABLE "ScraperBuild" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "collectorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "step" TEXT,
    "error" TEXT,
    "jobCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScraperBuild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScraperBuild_sessionId_idx" ON "ScraperBuild"("sessionId");
