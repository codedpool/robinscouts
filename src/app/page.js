import { prisma } from "@/lib/db";
import Feed from "@/components/Feed";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [jobs, statuses] = await Promise.all([
    prisma.job.findMany({ orderBy: { firstSeenAt: "desc" } }),
    prisma.sourceStatus.findMany(),
  ]);

  return (
    <div className="flex-1 bg-zinc-50">
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Feed jobs={jobs} statuses={statuses} />
      </main>
    </div>
  );
}
