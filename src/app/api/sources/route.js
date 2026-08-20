import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { createCollector } from "@/lib/scraper";
import { refreshOneSource } from "@/lib/refreshSource";
import { createJob, updateJob } from "@/lib/scraperJobs";
import { prisma } from "@/lib/db";

const MAX_SOURCES_PER_SESSION = 5;

// Kept deliberately minimal: an earlier version also asked for
// employment_type and product_page_url per listing, and the schema
// generator misread that as a signal to treat "product page" as a separate
// top-level entity (it picked an unrelated link on the page instead of
// nesting per-job fields) — no open_positions array came back at all.
// normalize.js already tolerates missing employment_type/product_page_url
// via its own fallbacks, so asking for only the two essential fields plus
// the apply link is both simpler for the model and sufficient for us.
const CREATE_PROMPT =
  "Extract each job listing on this careers page as open_positions. For each: " +
  "job_title (the role title), location, and application_link (the URL to apply or view the job).";

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function companyNameFromUrl(url) {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const root = hostname.split(".")[0];
  return root.charAt(0).toUpperCase() + root.slice(1);
}

export async function POST(request) {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return NextResponse.json(
      { error: "No session found — reload the page and try again." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { url, apiKey } = body;

  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: "Enter a valid http(s) URL." }, { status: 400 });
  }
  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json({ error: "A Bright Data API key is required." }, { status: 400 });
  }

  const existingCount = await prisma.source.count({ where: { sessionId } });
  if (existingCount >= MAX_SOURCES_PER_SESSION) {
    return NextResponse.json(
      { error: `You can track up to ${MAX_SOURCES_PER_SESSION} companies per session.` },
      { status: 400 }
    );
  }

  const company = companyNameFromUrl(url);
  const sourceKey = `user-${slugify(company)}-${Date.now()}`;
  const jobId = createJob();

  // Deliberately not awaited: building a scraper can take several minutes
  // (AI codegen + preview), and the client polls
  // GET /api/sources/status/[jobId] for live progress instead of holding
  // one long HTTP request open. This runs on this process's own event
  // loop, which is fine for this app's single persistent-Node deployment —
  // a serverless host would need a real job queue behind this instead.
  runInBackground(jobId, sessionId, sourceKey, company, url, apiKey);

  return NextResponse.json({ jobId });
}

async function runInBackground(jobId, sessionId, sourceKey, company, url, apiKey) {
  try {
    const envelope = await createCollector(url, CREATE_PROMPT, {
      apiKey,
      name: sourceKey,
      onStep: (step) => updateJob(jobId, { step }),
    });

    if (envelope.status !== "done" || !envelope.collector_id) {
      updateJob(jobId, {
        status: "error",
        error: envelope.error || "Scraper build failed.",
      });
      return;
    }

    const collectorId = envelope.collector_id;
    const label = `${company} (self-service)`;

    await prisma.source.create({
      data: { key: sourceKey, label, company, url, collectorId, sessionId },
    });

    updateJob(jobId, { step: "running_first_scrape" });
    const result = await refreshOneSource(
      sourceKey,
      { label, company, url, collectorId },
      { sessionId, apiKey }
    );

    if (!result.ok) {
      // The collector itself built fine — just found nothing on this run.
      // Keep the source around; it'll keep getting checked like any other.
      updateJob(jobId, {
        status: "done",
        collectorId,
        jobCount: 0,
        sourceKey,
        error: `Scraper built, but the first run found 0 listings (${result.error}). It'll keep checking on future refreshes.`,
      });
      return;
    }

    updateJob(jobId, {
      status: "done",
      collectorId,
      jobCount: result.jobCount,
      sourceKey,
    });
  } catch (err) {
    updateJob(jobId, { status: "error", error: String(err?.message || err) });
  }
}
