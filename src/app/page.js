import Image from "next/image";
import { prisma } from "@/lib/db";
import Feed from "@/components/Feed";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
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
    <div className="min-h-screen">
      <Hero />
      <div id="app">
        <Feed jobs={jobs} statuses={statuses} sources={sources} />
      </div>
      <Image
        src="/last.png"
        alt="A hiker on a mountainside watches job listings arrive from a robin's search, connected by dotted lines, with a city visible in the valley below"
        width={1774}
        height={887}
        className="h-auto w-full"
        sizes="100vw"
      />
      <Footer />
    </div>
  );
}
