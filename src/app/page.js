import { prisma } from "@/lib/db";
import JobCard from "@/components/JobCard";
import RefreshButton from "@/components/RefreshButton";
import SourceStatusBanner from "@/components/SourceStatusBanner";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [jobs, statuses] = await Promise.all([
    prisma.job.findMany({ orderBy: { firstSeenAt: "desc" } }),
    prisma.sourceStatus.findMany(),
  ]);

  return (
    <div className="flex-1 bg-zinc-50">
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">RobinScouts</h1>
            <p className="mt-1 text-sm text-slate-600">
              A hiring-change intelligence feed — what&apos;s new or changed
              since you last checked.
            </p>
          </div>
          <RefreshButton />
        </div>

        <div className="mt-6">
          <SourceStatusBanner statuses={statuses} />
        </div>

        {jobs.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-500">
            No jobs yet — click &quot;Check for new jobs&quot; to run the
            scraper.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
