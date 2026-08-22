import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { triggerScraperCreation, redact } from "@/lib/scraper";
import { createBuild } from "@/lib/scraperJobs";
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

  // Only the quick "kick off AI generation" step happens here — the actual
  // multi-minute codegen runs on Bright Data's own servers and is checked
  // separately by GET /api/sources/status/[jobId] on each poll. Trying to
  // await the whole build in one request (as an earlier version did, via a
  // CLI subprocess left running unawaited after the response) never
  // actually worked once deployed: confirmed empirically that it silently
  // stopped progressing at all in production, since a serverless function
  // isn't guaranteed to keep running once its response has been sent.
  try {
    const { collectorId } = await triggerScraperCreation(url, CREATE_PROMPT, apiKey, sourceKey);
    const build = await createBuild({ sessionId, sourceKey, company, url, collectorId });
    return NextResponse.json({ jobId: build.id });
  } catch (err) {
    const message = redact(String(err?.message || err), apiKey);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
