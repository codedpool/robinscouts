"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_KEY_STORAGE } from "@/lib/clientKey";

const STEP_LABELS = {
  prepare_intent_analyzer: "Reading the page…",
  user_intent_analyzer: "Reading the page…",
  planner: "Planning the scraper…",
  discovery: "Discovering the page structure…",
  collector_mainatiner: "Setting up the collector…",
  output_schema_generator: "Designing the data schema…",
  code_generator: "Writing the scraper…",
  input_schema_generator: "Wiring up the input…",
  preview_runner: "Testing it against the real page…",
  preview_picker: "Checking the results…",
  running_first_scrape: "Running your first scrape…",
};

function stepLabel(step) {
  if (!step) return "Starting…";
  return STEP_LABELS[step] || `${step.replace(/_/g, " ")}…`;
}

export default function AddCompanyForm() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [url, setUrl] = useState("");
  const [job, setJob] = useState(null); // { status, step, error, jobCount }
  const [formError, setFormError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(API_KEY_STORAGE);
      if (saved) setApiKey(saved);
    } catch {
      // ignore unavailable storage
    }
    return () => clearInterval(pollRef.current);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    try {
      sessionStorage.setItem(API_KEY_STORAGE, apiKey);
    } catch {
      // ignore
    }

    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, apiKey }),
    });
    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error || "Could not start building that scraper.");
      return;
    }

    setJob({ status: "running", step: null, error: null, jobCount: null });

    pollRef.current = setInterval(async () => {
      const statusRes = await fetch(`/api/sources/status/${data.jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const statusData = await statusRes.json();
      setJob(statusData);

      if (statusData.status === "done" || statusData.status === "error") {
        clearInterval(pollRef.current);
        if (statusData.status === "done") {
          setUrl("");
          router.refresh();
        }
      }
    }, 2000);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Your Bright Data API key"
          required
          className="w-full rounded-md border border-[var(--paper-line)] bg-[#fffdf7] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--ink-soft)] focus:border-[var(--ember)] focus:ring-1 focus:ring-[var(--ember)]/30"
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="A company's careers page URL"
          required
          className="w-full rounded-md border border-[var(--paper-line)] bg-[#fffdf7] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--ink-soft)] focus:border-[var(--ember)] focus:ring-1 focus:ring-[var(--ember)]/30"
        />
        <button
          type="submit"
          disabled={job?.status === "running"}
          className="self-start rounded-md bg-[var(--ember)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#ff6b3d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Track this company
        </button>
      </form>
      <p className="mt-2 text-[11px] text-[var(--ink-soft)]">
        Your key is used only to build and run this scraper — it's kept in
        this tab's session storage, never sent anywhere else, never saved on
        our server.
      </p>

      {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}

      {job && job.status === "running" && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ember)]" />
          {stepLabel(job.step)}
        </p>
      )}

      {job && job.status === "done" && (
        <p className="mt-2 text-xs text-emerald-400">
          {job.error
            ? job.error
            : `Scraper built — found ${job.jobCount} job${job.jobCount === 1 ? "" : "s"}.`}
        </p>
      )}

      {job && job.status === "error" && (
        <p className="mt-2 text-xs text-red-400">{job.error}</p>
      )}
    </div>
  );
}
