import { prisma } from "@/lib/db";
import Feed from "@/components/Feed";
import { getSessionId } from "@/lib/session";
import { getSourcesForSession } from "@/lib/sourcesServer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sessionId = await getSessionId();
  const sources = await getSourcesForSession(sessionId);
  const sourceKeys = Object.keys(sources);

  const [jobs, statuses] = await Promise.all([
    prisma.job.findMany({
      where: { OR: [{ sessionId: null }, { sessionId }] },
      orderBy: { firstSeenAt: "desc" },
    }),
    prisma.sourceStatus.findMany({ where: { source: { in: sourceKeys } } }),
  ]);

  return (
    <div className="min-h-screen bg-[#fdf8f0]">
      <Feed jobs={jobs} statuses={statuses} sources={sources} />
    </div>
  );
}
