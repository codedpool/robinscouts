import { prisma } from "./db.js";
import { runCollector } from "./scraper.js";
import {
  normalizeJobPosting,
  isCrawlError,
  isRealJobPosting,
  describeChange,
} from "./normalize.js";
import { findDuplicate } from "./dedup.js";

// Extracted verbatim from the original single-source loop body in
// src/app/api/refresh/route.js so both the two built-in sources and a
// session's self-service "add a company" sources share one code path.
// sessionId is null for the two built-in sources, set for a user-added one
// (stamped onto every Job row it creates so the feed can be scoped per
// browser); apiKey is only needed for a user-added source's own collector.
export async function refreshOneSource(sourceKey, config, { sessionId, apiKey } = {}) {
  const raw = await runCollector(config.collectorId, config.url, apiKey);
  const errors = raw.filter(isCrawlError);
  const validEntries = raw.filter((e) => !isCrawlError(e) && isRealJobPosting(e));

  if (validEntries.length === 0) {
    // Source unhealthy: this run returned 0 usable jobs. Leave existing
    // Job rows untouched so the feed doesn't go blank on a bad crawl, and
    // never advance possibly-closed detection off a failed run.
    // null when there's no specific crawl error beyond "nothing came back"
    // — the banner's own copy already says "0 valid jobs", so a fallback
    // string here would just repeat that back redundantly.
    const lastError = errors[0]?.error || null;
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
    return { ok: false, error: lastError || "0 valid jobs returned" };
  }

  const seenApplicationUrls = new Set();
  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  for (const entry of validEntries) {
    const normalized = normalizeJobPosting(entry, {
      company: config.company,
      source: sourceKey,
    });
    seenApplicationUrls.add(normalized.applicationUrl);

    const existing = await prisma.job.findUnique({
      where: { applicationUrl: normalized.applicationUrl },
    });

    if (!existing) {
      const otherSourceJobs = await prisma.job.findMany({
        where: { source: { not: sourceKey }, duplicateOfId: null },
      });
      const duplicate = findDuplicate(normalized, otherSourceJobs);

      await prisma.job.create({
        data: {
          ...normalized,
          status: "active",
          lastRunChangeType: "new",
          duplicateOfId: duplicate ? duplicate.id : null,
          sessionId: sessionId || null,
        },
      });
      newCount++;
    } else {
      const changed = existing.contentHash !== normalized.contentHash;

      await prisma.job.update({
        where: { id: existing.id },
        data: {
          ...normalized,
          status: "active", // reappeared or reconfirmed — never stays possibly_closed once seen again
          missingSince: null,
          lastChangedAt: changed ? new Date() : existing.lastChangedAt,
          changeSummary: changed
            ? describeChange(existing, normalized)
            : existing.changeSummary,
          lastRunChangeType: changed ? "updated" : "unchanged",
        },
      });
      changed ? updatedCount++ : unchangedCount++;
    }
  }

  // Possibly-closed detection: only runs here, i.e. only after a healthy
  // crawl. A job missing once is just flagged internally; it only flips to
  // possibly_closed after a second consecutive healthy run still doesn't
  // find it.
  const missingJobs = await prisma.job.findMany({
    where: {
      source: sourceKey,
      status: "active",
      applicationUrl: { notIn: Array.from(seenApplicationUrls) },
    },
  });

  for (const job of missingJobs) {
    if (job.missingSince) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "possibly_closed", lastRunChangeType: "possibly_closed" },
      });
    } else {
      await prisma.job.update({
        where: { id: job.id },
        data: { missingSince: new Date(), lastRunChangeType: null },
      });
    }
  }

  await prisma.sourceStatus.upsert({
    where: { source: sourceKey },
    update: {
      status: "healthy",
      lastSuccessAt: new Date(),
      lastError: null,
      jobCount: validEntries.length,
    },
    create: {
      source: sourceKey,
      label: config.label,
      status: "healthy",
      lastSuccessAt: new Date(),
      jobCount: validEntries.length,
    },
  });

  return {
    ok: true,
    jobCount: validEntries.length,
    new: newCount,
    updated: updatedCount,
    unchanged: unchangedCount,
    possiblyClosed: missingJobs.filter((j) => j.missingSince).length,
  };
}
