"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import PreferencesForm from "@/components/PreferencesForm";
import RefreshButton from "@/components/RefreshButton";
import SourceStatusBanner from "@/components/SourceStatusBanner";
import JobCard from "@/components/JobCard";
import AddCompanyForm from "@/components/AddCompanyForm";
import { EMPTY_PREFERENCES, hasAnyPreference, scoreJob } from "@/lib/matching";
import { summarizeByCompany } from "@/lib/companySummary";

const STORAGE_KEY = "robinscouts-preferences";

export default function Feed({ jobs, statuses, sources }) {
  const [preferences, setPreferences] = useState(EMPTY_PREFERENCES);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPreferences({ ...EMPTY_PREFERENCES, ...JSON.parse(saved) });
    } catch {
      // ignore malformed/unavailable storage
    }
  }, []);

  function updatePreferences(next) {
    setPreferences(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  const matching = hasAnyPreference(preferences);

  const duplicateCounts = useMemo(() => {
    const counts = {};
    for (const job of jobs) {
      if (job.duplicateOfId) {
        counts[job.duplicateOfId] = (counts[job.duplicateOfId] || 0) + 1;
      }
    }
    return counts;
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    const filtered = jobs
      .filter((job) => !job.duplicateOfId) // duplicates are merged into their canonical card
      .filter((job) => {
        if (preferences.employmentType && preferences.employmentType !== "any") {
          return job.employmentType === preferences.employmentType;
        }
        return true;
      })
      .map((job) => ({ ...job, duplicateCount: duplicateCounts[job.id] || 0 }));

    if (!matching) {
      return filtered.map((job) => ({ job, score: null, reasons: [] }));
    }

    return filtered
      .map((job) => ({ job, ...scoreJob(job, preferences) }))
      .sort((a, b) => b.score - a.score);
  }, [jobs, preferences, matching, duplicateCounts]);

  const companySummaries = useMemo(
    () => summarizeByCompany(jobs, preferences, matching),
    [jobs, preferences, matching]
  );

  const activeCount = jobs.filter((j) => !j.duplicateOfId && j.status !== "possibly_closed").length;
  const companyCount = new Set(
    jobs.filter((j) => !j.duplicateOfId).map((j) => j.company)
  ).size;

  return (
    <>
      <header className="border-b border-[#ece4d6] bg-[#fdf8f0]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Image
            src="/robinscoutshorizontal.png"
            alt="RobinScouts"
            width={1774}
            height={887}
            priority
            className="h-9 w-auto mix-blend-multiply sm:h-10"
          />
          <RefreshButton />
        </div>
      </header>

      <SourceStatusBanner statuses={statuses} />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm text-stone-500">
          <span>
            <span className="font-semibold text-[#16233f]">{activeCount}</span> open
            roles across <span className="font-semibold text-[#16233f]">{companyCount}</span>{" "}
            {companyCount === 1 ? "company" : "companies"}
          </span>
          {companySummaries.map((entry) => (
            <span key={entry.company}>
              <span className="mx-1.5 text-stone-300">·</span>
              {entry.company}{" "}
              <span className="font-medium text-[#16233f]">+{entry.postedThisWeek}</span> this
              week
              {matching && entry.matchedThisWeek > 0 && (
                <>
                  {" "}
                  (<span className="font-medium text-[#ee5a2c]">{entry.matchedThisWeek} match</span>)
                </>
              )}
            </span>
          ))}
        </div>

        <PreferencesForm preferences={preferences} onChange={updatePreferences} />
        <AddCompanyForm />

        {visibleJobs.length === 0 ? (
          <p className="mt-10 text-center text-sm text-stone-400">
            No jobs match right now — click &quot;Check for new jobs&quot; or
            loosen your preferences.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            {visibleJobs.map(({ job, score, reasons }) => (
              <JobCard key={job.id} job={job} score={score} reasons={reasons} sources={sources} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
