import { prisma } from "@/lib/db";
import Feed from "@/components/Feed";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [jobs, statuses] = await Promise.all([
    prisma.job.findMany({ orderBy: { firstSeenAt: "desc" } }),
    prisma.sourceStatus.findMany(),
  ]);

  return (
    <div className="min-h-screen bg-[#fdf8f0]">
      <Feed jobs={jobs} statuses={statuses} />
    </div>
  );
}
