import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runCollector } from "@/lib/scraper";
import { normalizeJobPosting, isCrawlError, isRealJobPosting } from "@/lib/normalize";
import { SOURCES } from "@/lib/sources";

export async function POST() {
  const results = {};

  for (const [sourceKey, config] of Object.entries(SOURCES)) {
    try {
      const raw = await runCollector(config.collectorId, config.url);
      const errors = raw.filter(isCrawlError);
      const validEntries = raw.filter((e) => !isCrawlError(e) && isRealJobPosting(e));

      if (validEntries.length === 0) {
        // Source unhealthy: this run returned 0 usable jobs. Leave existing
        // Job rows untouched so the feed doesn't go blank on a bad crawl.
        const lastError = errors[0]?.error || "0 valid jobs returned";
        await prisma.sourceStatus.upsert({
          where: { source: sourceKey },
          update: { status: "unhealthy", lastError },
          create: {
            source: sourceKey,
            label: config.label,
            status: "unhealthy",
            lastError,
            jobCount: 0,
          },
        });
        results[sourceKey] = { ok: false, error: lastError };
        continue;
      }

      let savedCount = 0;
      for (const entry of validEntries) {
        const normalized = normalizeJobPosting(entry, {
          company: config.company,
          source: sourceKey,
        });
        await prisma.job.upsert({
          where: { applicationUrl: normalized.applicationUrl },
          update: normalized,
          create: normalized,
        });
        savedCount++;
      }

      await prisma.sourceStatus.upsert({
        where: { source: sourceKey },
        update: {
          status: "healthy",
          lastSuccessAt: new Date(),
          lastError: null,
          jobCount: savedCount,
        },
        create: {
          source: sourceKey,
          label: config.label,
          status: "healthy",
          lastSuccessAt: new Date(),
          jobCount: savedCount,
        },
      });

      results[sourceKey] = { ok: true, jobCount: savedCount };
    } catch (err) {
      const message = String(err?.message || err);
      await prisma.sourceStatus.upsert({
        where: { source: sourceKey },
        update: { status: "unhealthy", lastError: message },
        create: {
          source: sourceKey,
          label: config.label,
          status: "unhealthy",
          lastError: message,
          jobCount: 0,
        },
      });
      results[sourceKey] = { ok: false, error: message };
    }
  }

  return NextResponse.json({ results });
}
