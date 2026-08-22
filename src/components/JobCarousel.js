"use client";

import { useEffect, useState } from "react";
import JobCard from "@/components/JobCard";

export default function JobCarousel({ items, sources }) {
  const [index, setIndex] = useState(0);
  const total = items.length;

  useEffect(() => {
    if (index > total - 1) setIndex(Math.max(0, total - 1));
  }, [total, index]);

  function go(delta) {
    setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1));
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  }

  if (total === 0) {
    return (
      <div
        className="flex h-full min-h-[22rem] flex-col items-center justify-center rounded-[28px] border p-8 text-center shadow-[0_20px_50px_-20px_rgba(30,25,15,0.35)]"
        style={{ borderColor: "var(--paper-line)", backgroundColor: "#fbf6ea" }}
      >
        <p className="font-display text-xl text-[var(--foreground)]">
          No jobs match right now
        </p>
        <p className="mt-2 max-w-xs text-sm text-[var(--ink-soft)]">
          Check for new jobs, or loosen your preferences on the right.
        </p>
      </div>
    );
  }

  const current = items[index];

  return (
    <div
      className="flex h-full items-center gap-3 outline-none sm:gap-4"
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label="Job listings"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={index === 0}
        aria-label="Previous job"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-lg text-[var(--foreground)] transition-colors hover:border-[var(--ember)] hover:text-[var(--ember)] disabled:cursor-not-allowed disabled:opacity-30"
        style={{ borderColor: "var(--paper-line)", backgroundColor: "rgba(251,246,234,0.85)" }}
      >
        ←
      </button>

      <div
        key={current.job.id}
        className="relative h-full min-h-[22rem] flex-1 overflow-hidden rounded-[28px] border p-6 shadow-[0_20px_50px_-20px_rgba(30,25,15,0.35)] motion-safe:animate-[fadeIn_0.3s_ease] sm:p-8"
        style={{ borderColor: "var(--paper-line)", backgroundColor: "#fbf6ea" }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 rotate-12 text-[var(--paper-line)] sm:h-56 sm:w-56"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        >
          <circle cx="50" cy="50" r="34" />
          <circle cx="50" cy="50" r="1.5" fill="currentColor" stroke="none" />
          <path d="M50 24 L58 50 L50 76 L42 50 Z" />
        </svg>

        <JobCard
          job={current.job}
          score={current.score}
          reasons={current.reasons}
          sources={sources}
          index={index}
          total={total}
        />
      </div>

      <button
        type="button"
        onClick={() => go(1)}
        disabled={index === total - 1}
        aria-label="Next job"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-lg text-[var(--foreground)] transition-colors hover:border-[var(--ember)] hover:text-[var(--ember)] disabled:cursor-not-allowed disabled:opacity-30"
        style={{ borderColor: "var(--paper-line)", backgroundColor: "rgba(251,246,234,0.85)" }}
      >
        →
      </button>
    </div>
  );
}
