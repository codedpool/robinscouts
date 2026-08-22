import { NextResponse } from "next/server";
import { getBuild, updateBuild } from "@/lib/scraperJobs";
import { checkScraperCreationProgress } from "@/lib/scraper";
import { refreshOneSource } from "@/lib/refreshSource";
import { prisma } from "@/lib/db";

// POST rather than GET specifically so the visitor's API key — needed on
// every poll to check progress with Bright Data, since nothing about this
// build is held in server memory between requests — travels in the body
// rather than a query string. Never persisted: read from the request,
// used, discarded, same as every other BYOK call in this app.
function toClientShape(build) {
  return {
    status: build.status,
    step: build.step,
    error: build.error,
    collectorId: build.collectorId,
    jobCount: build.jobCount,
  };
}

export async function POST(request, { params }) {
  const { jobId } = await params;
  const body = await request.json().catch(() => ({}));
  const apiKey = typeof body.apiKey === "string" ? body.apiKey : null;

  const build = await getBuild(jobId);
  if (!build) {
    return NextResponse.json({ error: "Unknown job id" }, { status: 404 });
  }

  // Already finished (successfully or not) — just return the stored result,
  // no need to check Bright Data again.
  if (build.status !== "running") {
    return NextResponse.json(toClientShape(build));
  }

  if (!apiKey) {
    return NextResponse.json({ error: "API key required to check build status" }, { status: 400 });
  }

  try {
    const progress = await checkScraperCreationProgress(build.collectorId, apiKey);

    if (!progress.done) {
      const updated = await updateBuild(build.id, { step: progress.step });
      return NextResponse.json(toClientShape(updated));
    }

    // AI generation just finished — create the real Source row and run its
    // first scrape, exactly like the old synchronous flow did once its
    // (never-actually-working) background promise resolved.
    const label = `${build.company} (self-service)`;
    await prisma.source.create({
      data: {
        key: build.sourceKey,
        label,
        company: build.company,
        url: build.url,
        collectorId: build.collectorId,
        sessionId: build.sessionId,
      },
    });

    const result = await refreshOneSource(
      build.sourceKey,
      { label, company: build.company, url: build.url, collectorId: build.collectorId },
      { sessionId: build.sessionId, apiKey }
    );

    if (!result.ok) {
      // The collector itself built fine — just found nothing on this run.
      // Keep the source around; it'll keep getting checked like any other.
      const updated = await updateBuild(build.id, {
        status: "done",
        jobCount: 0,
        error: `Scraper built, but the first run found 0 listings (${result.error}). It'll keep checking on future refreshes.`,
      });
      return NextResponse.json(toClientShape(updated));
    }

    const updated = await updateBuild(build.id, { status: "done", jobCount: result.jobCount });
    return NextResponse.json(toClientShape(updated));
  } catch (err) {
    // Same lesson as /api/refresh's own catch-all: an unexpected failure
    // here (a CLI timeout, a network error) carries raw internal detail in
    // its message — a real example hit while verifying this fix on
    // production included the full command line, collector ID, and a
    // multi-line Bright Data batch-mode polling dump. Full detail goes to
    // the server log only; the visitor gets a short, safe summary.
    console.error(`[sources/status] build ${build.id} failed:`, err);
    const message = "The scraper run failed unexpectedly — check server logs for details.";
    const updated = await updateBuild(build.id, { status: "error", error: message });
    return NextResponse.json(toClientShape(updated));
  }
}
