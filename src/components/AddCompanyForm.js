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
      const statusRes = await fetch(`/api/sources/status/${data.jobId}`);
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
    <div className="mt-4 border-b border-stone-200 pb-5">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Your Bright Data API key"
          required
          className="w-48 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 outline-none placeholder:text-stone-400 focus:border-[#ee5a2c] focus:ring-1 focus:ring-[#ee5a2c]/30"
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="A company's careers page URL"
          required
          className="w-64 flex-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 outline-none placeholder:text-stone-400 focus:border-[#ee5a2c] focus:ring-1 focus:ring-[#ee5a2c]/30"
        />
        <button
          type="submit"
          disabled={job?.status === "running"}
          className="rounded-md bg-[#16233f] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#223257] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Track this company
        </button>
      </form>
      <p className="mt-1.5 text-[11px] text-stone-400">
        Your key is used only to build and run this scraper — it's kept in
        this tab's session storage, never sent anywhere else, never saved on
        our server.
      </p>

      {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}

      {job && job.status === "running" && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ee5a2c]" />
          {stepLabel(job.step)}
        </p>
      )}

      {job && job.status === "done" && (
        <p className="mt-2 text-xs text-emerald-700">
          {job.error
            ? job.error
            : `Scraper built — found ${job.jobCount} job${job.jobCount === 1 ? "" : "s"}.`}
        </p>
      )}

      {job && job.status === "error" && (
        <p className="mt-2 text-xs text-red-600">{job.error}</p>
      )}
    </div>
  );
}
