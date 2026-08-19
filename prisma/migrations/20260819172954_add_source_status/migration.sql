-- CreateTable
CREATE TABLE "SourceStatus" (
    "source" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'healthy',
    "lastCheckedAt" DATETIME NOT NULL,
    "lastSuccessAt" DATETIME,
    "lastError" TEXT,
    "jobCount" INTEGER NOT NULL DEFAULT 0
);
