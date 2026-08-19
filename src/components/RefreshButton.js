"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  async function handleClick() {
    setError(null);
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
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
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Checking…" : "Check for new jobs"}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
