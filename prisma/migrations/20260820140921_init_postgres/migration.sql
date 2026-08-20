-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleNormalized" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "experience" TEXT NOT NULL DEFAULT 'unspecified',
    "skills" TEXT NOT NULL DEFAULT '[]',
    "salary" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT NOT NULL,
    "applicationUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "lastChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeSummary" TEXT,
    "missingSince" TIMESTAMP(3),
    "lastRunChangeType" TEXT,
    "contentHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "duplicateOfId" TEXT,
    "rawJson" TEXT NOT NULL,
    "sessionId" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceStatus" (
    "source" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'healthy',
    "lastCheckedAt" TIMESTAMP(3) NOT NULL,
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "jobCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SourceStatus_pkey" PRIMARY KEY ("source")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_applicationUrl_key" ON "Job"("applicationUrl");

-- CreateIndex
CREATE INDEX "Job_source_idx" ON "Job"("source");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_sessionId_idx" ON "Job"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Source_key_key" ON "Source"("key");

-- CreateIndex
CREATE INDEX "Source_sessionId_idx" ON "Source"("sessionId");
