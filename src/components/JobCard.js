import { timeAgo } from "@/lib/time";

const STATUS_STYLE = {
  new: { label: "New", color: "var(--ember)" },
  updated: { label: "Updated", color: "var(--gold)" },
  possibly_closed: { label: "Possibly closed", color: "var(--ink-soft)" },
};

export default function JobCard({ job, score, reasons, sources, index, total }) {
  const locations = JSON.parse(job.location || "[]");
  const sourceLabel = sources?.[job.source]?.shortLabel || job.source;
  const closed = job.status === "possibly_closed";
  const status = closed ? STATUS_STYLE.possibly_closed : STATUS_STYLE[job.lastRunChangeType];
  const tag = `№ ${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return (
    <article className={`relative z-10 flex h-full flex-col ${closed ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          {tag}
        </p>
        {status && (
          <span
            className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-wide"
            style={{ color: status.color }}
          >
            {status.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center py-6">
        <h3 className="line-clamp-2 font-display text-2xl font-medium leading-tight text-[var(--foreground)] sm:text-4xl">
          {job.title}
        </h3>
        <p className="mt-2 text-base text-[var(--ink-soft)]">
          at <span className="font-medium text-[var(--foreground)]">{job.company}</span>
          {sourceLabel && <span> · via {sourceLabel}</span>}
        </p>

        <div className="mt-6 h-px w-12" style={{ backgroundColor: "var(--paper-line)" }} />

        <p className="mt-6 font-mono text-[11px] leading-relaxed text-[var(--ink-soft)]">
          {locations.join(", ") || "Location unlisted"} · {job.employmentType} · first
          seen {timeAgo(job.firstSeenAt)}
          {job.changeSummary && (
            <span style={{ color: "var(--gold)" }}> · changed: {job.changeSummary}</span>
          )}
          {job.duplicateCount > 0 && <span> · on {job.duplicateCount + 1} sources</span>}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        {score !== null && score !== undefined ? (
          <details className="group/score relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
              <span
                className="text-sm font-semibold"
                style={{ color: score > 0 ? "var(--ember)" : "var(--paper-line)" }}
              >
                {score}% match
              </span>
              {reasons.length > 0 && (
                <span className="text-[10px] text-[var(--ink-soft)] transition-transform group-open/score:-rotate-180">
                  ▾
                </span>
              )}
            </summary>
            {reasons.length > 0 && (
              <ul
                className="absolute bottom-full left-0 z-10 mb-2 w-64 space-y-1 rounded-md border p-2.5 text-left text-xs shadow-lg"
                style={{
                  borderColor: "var(--paper-line)",
                  backgroundColor: "#fffdf7",
                  color: "var(--ink-soft)",
                }}
              >
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </details>
        ) : (
          <span />
        )}

        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ember)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#ff6b3d]"
        >
          Apply ↗
        </a>
      </div>
    </article>
  );
}
