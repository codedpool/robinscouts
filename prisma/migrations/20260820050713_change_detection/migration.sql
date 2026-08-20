-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
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
    "lastChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeSummary" TEXT,
    "missingSince" DATETIME,
    "lastRunChangeType" TEXT,
    "contentHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "duplicateOfId" TEXT,
    "rawJson" TEXT NOT NULL
);
INSERT INTO "new_Job" ("applicationUrl", "company", "contentHash", "description", "duplicateOfId", "employmentType", "experience", "firstSeenAt", "id", "lastSeenAt", "location", "rawJson", "salary", "skills", "source", "sourceUrl", "status", "title", "titleNormalized") SELECT "applicationUrl", "company", "contentHash", "description", "duplicateOfId", "employmentType", "experience", "firstSeenAt", "id", "lastSeenAt", "location", "rawJson", "salary", "skills", "source", "sourceUrl", "status", "title", "titleNormalized" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE UNIQUE INDEX "Job_applicationUrl_key" ON "Job"("applicationUrl");
CREATE INDEX "Job_source_idx" ON "Job"("source");
CREATE INDEX "Job_status_idx" ON "Job"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
