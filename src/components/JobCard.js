import { timeAgo } from "@/lib/time";

const STATUS_STYLE = {
  new: { label: "New", dot: "bg-emerald-400", text: "text-emerald-400" },
  updated: { label: "Updated", dot: "bg-amber-400", text: "text-amber-400" },
  possibly_closed: { label: "Possibly closed", dot: "bg-white/20", text: "text-white/40" },
};

export default function JobCard({ job, score, reasons, sources }) {
  const locations = JSON.parse(job.location || "[]");
  const sourceLabel = sources?.[job.source]?.shortLabel || job.source;
  const closed = job.status === "possibly_closed";
  const status = closed ? STATUS_STYLE.possibly_closed : STATUS_STYLE[job.lastRunChangeType];

  return (
    <li
      className={`grid grid-cols-[6px_minmax(0,1fr)_7rem_5.5rem_5.5rem] items-center gap-4 px-4 py-3 transition-colors hover:bg-white/3 ${
        closed ? "opacity-50" : ""
      }`}
    >
      <span
        className={`h-1.5 w-1.5 justify-self-center rounded-full ${status ? status.dot : "bg-transparent"}`}
        aria-hidden="true"
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <h3 className="truncate font-medium text-[#f5f1e8]">{job.title}</h3>
          <span className="shrink-0 text-sm text-[#8891a8]">at {job.company}</span>
          {status && (
            <span className={`shrink-0 text-xs font-medium ${status.text}`}>
              {status.label}
            </span>
          )}
          {job.duplicateCount > 0 && (
            <span className="shrink-0 text-xs text-white/40">
              · on {job.duplicateCount + 1} sources
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-[#8891a8]">
          {locations.join(", ")} · {job.employmentType} · first seen{" "}
          {timeAgo(job.firstSeenAt)}
          {job.changeSummary && (
            <span className="text-amber-400/90"> · changed: {job.changeSummary}</span>
          )}
        </p>
      </div>

      <span className="truncate text-xs text-white/40">{sourceLabel}</span>

      {score !== null && score !== undefined ? (
        <details className="group/score relative justify-self-end">
          <summary className="flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
            <span
              className={`text-sm font-semibold ${score > 0 ? "text-[#ee5a2c]" : "text-white/25"}`}
            >
              {score}%
            </span>
            {reasons.length > 0 && (
              <span className="text-[10px] text-white/40 transition-transform group-open/score:-rotate-180">
                ▾
              </span>
            )}
          </summary>
          {reasons.length > 0 && (
            <ul className="absolute right-0 top-full z-10 mt-2 w-64 space-y-1 rounded-md border border-white/10 bg-[#1a2338] p-2.5 text-left text-xs text-[#c9cedb] shadow-lg">
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
        className="justify-self-end rounded-md bg-[#ee5a2c] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[#ff6b3d]"
      >
        Apply ↗
      </a>
    </li>
  );
}
