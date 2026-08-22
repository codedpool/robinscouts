import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getSourcesForSession } from "@/lib/sourcesServer";
import { refreshOneSource } from "@/lib/refreshSource";
import { prisma } from "@/lib/db";

// Built-in sources (Onehouse, Sourcegraph, the RobinTest fixture) run
// against this project's own Bright Data key, shared across every visitor
// who hits this route — unlike a BYOK source, which bills the visitor's
// own key. A basic cooldown keeps repeated clicks (or a script) from
// hammering the same collectors on this project's account/quota.
const REFRESH_COOLDOWN_MS = 30_000;

export async function POST(request) {
  const sessionId = await getSessionId();
  const body = await request.json().catch(() => ({}));
  const apiKey = typeof body.apiKey === "string" ? body.apiKey : null;

  const sources = await getSourcesForSession(sessionId);
  const results = {};

  for (const [sourceKey, config] of Object.entries(sources)) {
    if (config.kind === "user" && !apiKey) {
      results[sourceKey] = { ok: false, error: "API key required to refresh this source" };
      continue;
    }

    if (config.kind !== "user") {
      const existing = await prisma.sourceStatus.findUnique({ where: { source: sourceKey } });
      const sinceLastCheck = existing ? Date.now() - existing.lastCheckedAt.getTime() : Infinity;
      if (existing && sinceLastCheck < REFRESH_COOLDOWN_MS) {
        results[sourceKey] = {
          ok: existing.status === "healthy",
          jobCount: existing.jobCount,
          error: existing.status === "unhealthy" ? existing.lastError : undefined,
          rateLimited: true,
          retryAfterMs: REFRESH_COOLDOWN_MS - sinceLastCheck,
        };
        continue;
      }
    }

    try {
      results[sourceKey] = await refreshOneSource(sourceKey, config, {
        sessionId: config.kind === "user" ? sessionId : null,
        apiKey: config.kind === "user" ? apiKey : undefined,
      });
    } catch (err) {
      // This branch is for unexpected failures (a crashed CLI invocation, a
      // network error, a bad exit code) as opposed to refreshOneSource's own
      // graceful "0 valid jobs" unhealthy path. err.message here can be a raw
      // child_process failure — the full command line plus stderr — which
      // is genuinely useful for debugging but must never reach a public
      // visitor verbatim (it exposed collector IDs and internal shell output
      // directly in the SourceStatusBanner before this fix). Full detail
      // goes to the server log only; the DB/UI get a short, safe summary.
      console.error(`[refresh] ${sourceKey} failed:`, err);
      const message = "Scraper run failed unexpectedly — check server logs for details.";
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
