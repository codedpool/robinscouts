import { scoreJob } from "@/lib/matching";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Groups currently-active (non-duplicate, non-possibly-closed) jobs by
// company and summarizes posting velocity over the last 7 days, using
// firstSeenAt as the honest signal — we don't know the real posting date,
// only when we first observed the listing, and that's what gets reported.
export function summarizeByCompany(jobs, preferences, matching) {
  const cutoff = Date.now() - WEEK_MS;
  const byCompany = new Map();

  for (const job of jobs) {
    if (job.duplicateOfId || job.status === "possibly_closed") continue;

    if (!byCompany.has(job.company)) {
      byCompany.set(job.company, {
        company: job.company,
        totalActive: 0,
        postedThisWeek: 0,
        matchedThisWeek: 0,
      });
    }
    const entry = byCompany.get(job.company);
    entry.totalActive++;

    if (new Date(job.firstSeenAt).getTime() >= cutoff) {
      entry.postedThisWeek++;
      if (matching && scoreJob(job, preferences).score > 0) {
        entry.matchedThisWeek++;
      }
    }
  }

  return Array.from(byCompany.values())
    .filter((entry) => entry.postedThisWeek > 0)
    .sort((a, b) => b.postedThisWeek - a.postedThisWeek);
}
