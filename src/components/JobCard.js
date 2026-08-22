import { timeAgo } from "@/lib/time";

const STATUS_STYLE = {
  new: { label: "New", color: "var(--ember)" },
  updated: { label: "Updated", color: "var(--gold)" },
  possibly_closed: { label: "Possibly closed", color: "var(--ink-soft)" },
};

export default function JobCard({ job, score, reasons, sources }) {
  const locations = JSON.parse(job.location || "[]");
  const sourceLabel = sources?.[job.source]?.shortLabel || job.source;
  const closed = job.status === "possibly_closed";
  const status = closed ? STATUS_STYLE.possibly_closed : STATUS_STYLE[job.lastRunChangeType];

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_7rem_5.5rem_5.5rem] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-black/[0.02] ${
        closed ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="truncate font-display text-base font-medium text-[var(--foreground)]">
            {job.title}
          </h3>
          <span className="shrink-0 text-sm text-[var(--ink-soft)]">at {job.company}</span>
          {status && (
            <span
              className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-wide"
              style={{ color: status.color }}
            >
              {status.label}
            </span>
          )}
          {job.duplicateCount > 0 && (
            <span className="shrink-0 text-xs text-[var(--ink-soft)]">
              · on {job.duplicateCount + 1} sources
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--ink-soft)]">
          {locations.join(", ")} · {job.employmentType} · first seen{" "}
          {timeAgo(job.firstSeenAt)}
          {job.changeSummary && (
            <span style={{ color: "var(--gold)" }}> · changed: {job.changeSummary}</span>
          )}
        </p>
      </div>

      <span className="truncate font-mono text-[11px] text-[var(--ink-soft)]">{sourceLabel}</span>

      {score !== null && score !== undefined ? (
        <details className="group/score relative justify-self-end">
          <summary className="flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
            <span
              className="text-sm font-semibold"
              style={{ color: score > 0 ? "var(--ember)" : "var(--paper-line)" }}
            >
              {score}%
            </span>
            {reasons.length > 0 && (
              <span className="text-[10px] text-[var(--ink-soft)] transition-transform group-open/score:-rotate-180">
                ▾
              </span>
            )}
          </summary>
          {reasons.length > 0 && (
            <ul
              className="absolute right-0 top-full z-10 mt-2 w-64 space-y-1 rounded-md border p-2.5 text-left text-xs shadow-lg"
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
        className="justify-self-end rounded-md bg-[var(--ember)] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[#ff6b3d]"
      >
        Apply ↗
      </a>
    </li>
  );
}
