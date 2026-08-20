import { prisma } from "@/lib/db";
import { SOURCES } from "@/lib/sources";

// Server-only. Deliberately kept out of src/lib/sources.js, which is
// imported by JobCard.js (a Client Component) — pulling Prisma into that
// module would drag better-sqlite3's native bindings into the browser
// bundle and break the build.
//
// Merges the two built-in sources with this session's self-service
// "add a company" sources into one shape usable by both the refresh route
// and the feed page.
export async function getSourcesForSession(sessionId) {
  const merged = {};

  for (const [key, config] of Object.entries(SOURCES)) {
    merged[key] = { key, ...config };
  }

  if (sessionId) {
    const dynamicSources = await prisma.source.findMany({ where: { sessionId } });
    for (const source of dynamicSources) {
      merged[source.key] = {
        key: source.key,
        label: source.label,
        shortLabel: shortLabelFromUrl(source.url),
        kind: "user",
        collectorId: source.collectorId,
        url: source.url,
        company: source.company,
      };
    }
  }

  return merged;
}

function shortLabelFromUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const root = hostname.split(".")[0];
    return root.charAt(0).toUpperCase() + root.slice(1);
  } catch {
    return "Custom";
  }
}
