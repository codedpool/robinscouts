"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { API_KEY_STORAGE } from "@/lib/clientKey";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  async function handleClick() {
    setError(null);
    try {
      let apiKey = null;
      try {
        apiKey = sessionStorage.getItem(API_KEY_STORAGE);
      } catch {
        // ignore unavailable storage
      }
      const res = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiKey ? { apiKey } : {}),
      });
      const data = await res.json();
      const failed = Object.entries(data.results || {}).filter(
        ([, r]) => !r.ok
      );
      if (failed.length > 0) {
        setError(failed.map(([source, r]) => `${source}: ${r.error}`).join("; "));
      }
    } catch (err) {
      setError(String(err.message || err));
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2">
      {error && <p className="max-w-[16rem] truncate text-xs text-red-600">{error}</p>}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-md bg-[#ee5a2c] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#d94a1e] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {isPending ? "Checking…" : "Check for new jobs"}
      </button>
    </div>
  );
}
