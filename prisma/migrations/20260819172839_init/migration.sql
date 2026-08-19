-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL,
    "contentHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "duplicateOfId" TEXT,
    "rawJson" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_applicationUrl_key" ON "Job"("applicationUrl");

-- CreateIndex
CREATE INDEX "Job_source_idx" ON "Job"("source");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");
