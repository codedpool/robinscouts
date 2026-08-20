import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getSourcesForSession } from "@/lib/sourcesServer";
import { refreshOneSource } from "@/lib/refreshSource";
import { prisma } from "@/lib/db";

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

    try {
      results[sourceKey] = await refreshOneSource(sourceKey, config, {
        sessionId: config.kind === "user" ? sessionId : null,
        apiKey: config.kind === "user" ? apiKey : undefined,
      });
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
