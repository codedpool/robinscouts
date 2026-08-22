"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import PreferencesForm from "@/components/PreferencesForm";
import RefreshButton from "@/components/RefreshButton";
import SourceStatusBanner from "@/components/SourceStatusBanner";
import JobCarousel from "@/components/JobCarousel";
import AddCompanyForm from "@/components/AddCompanyForm";
import { EMPTY_PREFERENCES, hasAnyPreference, scoreJob } from "@/lib/matching";
import { summarizeByCompany } from "@/lib/companySummary";

const STORAGE_KEY = "robinscouts-preferences";

export default function Feed({ jobs, statuses, sources }) {
  const [preferences, setPreferences] = useState(EMPTY_PREFERENCES);
  const [showAddCompany, setShowAddCompany] = useState(false);

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

  const cardClass =
    "rounded-[28px] border shadow-[0_20px_50px_-20px_rgba(30,25,15,0.35)]";
  const cardStyle = { borderColor: "var(--paper-line)", backgroundColor: "#fbf6ea" };

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "rgb(10,8,5)" }}>
      <Image
        src="/section1.png"
        alt=""
        fill
        aria-hidden="true"
        className="object-cover"
        sizes="100vw"
      />

      {/* Continues the hero's own bottom-edge color (rgb(10,8,5)) so the
          mountain photo dissolves into this section's sky rather than
          cutting hard at the seam. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-1 h-28 sm:h-40"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,8,5,1) 0%, rgba(10,8,5,0.55) 45%, rgba(10,8,5,0) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-32 sm:pb-20 sm:pt-44">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
              Scouting report
            </p>
            <h2 className="mt-2 max-w-lg font-display text-3xl font-medium leading-tight text-[var(--foreground)] sm:text-4xl">
              What the robin found while you were gone
            </h2>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm text-[var(--ink-soft)]">
              <span>
                <span className="font-semibold text-[var(--foreground)]">{activeCount}</span> open
                roles across <span className="font-semibold text-[var(--foreground)]">{companyCount}</span>{" "}
                {companyCount === 1 ? "company" : "companies"}
              </span>
              {companySummaries.map((entry) => (
                <span key={entry.company}>
                  <span className="mx-1.5 text-[var(--paper-line)]">·</span>
                  {entry.company}{" "}
                  <span className="font-medium text-[var(--foreground)]">+{entry.postedThisWeek}</span> this
                  week
                  {matching && entry.matchedThisWeek > 0 && (
                    <>
                      {" "}
                      (<span className="font-medium text-[var(--ember)]">{entry.matchedThisWeek} match</span>)
                    </>
                  )}
                </span>
              ))}
            </div>
          </div>

          <RefreshButton />
        </div>

        {statuses.some((s) => s.status === "unhealthy") && (
          <div className="mt-6">
            <SourceStatusBanner statuses={statuses} />
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-stretch">
          <JobCarousel items={visibleJobs} sources={sources} />

          <div className={`flex flex-col gap-5 p-6 sm:p-7 ${cardClass}`} style={cardStyle}>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                Brief the scout
              </p>
              <h3 className="mt-1 font-display text-xl font-medium text-[var(--foreground)]">
                What should it look for?
              </h3>
              <div className="mt-4">
                <PreferencesForm preferences={preferences} onChange={updatePreferences} />
              </div>
            </div>

            <div className="border-t pt-5" style={{ borderColor: "var(--paper-line)" }}>
              {showAddCompany ? (
                <>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                    New territory
                  </p>
                  <h3 className="mt-1 font-display text-xl font-medium text-[var(--foreground)]">
                    Track another company
                  </h3>
                  <div className="mt-4">
                    <AddCompanyForm />
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddCompany(true)}
                  className="group flex w-full items-center justify-between gap-3 text-left"
                >
                  <span>
                    <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                      New territory
                    </span>
                    <span className="mt-1 block font-display text-xl font-medium text-[var(--foreground)]">
                      Track another company
                    </span>
                  </span>
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border text-lg text-[var(--foreground)] transition-colors group-hover:border-[var(--ember)]"
                    style={{ borderColor: "var(--paper-line)" }}
                  >
                    +
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
