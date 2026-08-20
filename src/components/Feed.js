"use client";

import { useEffect, useMemo, useState } from "react";
import PreferencesForm from "@/components/PreferencesForm";
import RefreshButton from "@/components/RefreshButton";
import SourceStatusBanner from "@/components/SourceStatusBanner";
import JobCard from "@/components/JobCard";
import { EMPTY_PREFERENCES, hasAnyPreference, scoreJob } from "@/lib/matching";

const STORAGE_KEY = "robinscouts-preferences";

export default function Feed({ jobs, statuses }) {
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

  return (
    <>
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

      <div className="mt-6 space-y-4">
        <PreferencesForm preferences={preferences} onChange={updatePreferences} />
        <SourceStatusBanner statuses={statuses} />
      </div>

      {visibleJobs.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-500">
          No jobs match right now — click &quot;Check for new jobs&quot; or
          loosen your preferences.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {visibleJobs.map(({ job, score, reasons }) => (
            <JobCard key={job.id} job={job} score={score} reasons={reasons} />
          ))}
        </ul>
      )}
    </>
  );
}
