import { timeAgo } from "@/lib/time";
import { SOURCES } from "@/lib/sources";

const CHANGE_BADGES = {
  new: { label: "New", className: "bg-emerald-100 text-emerald-700" },
  updated: { label: "Updated", className: "bg-amber-100 text-amber-700" },
  possibly_closed: {
    label: "Possibly closed",
    className: "bg-slate-200 text-slate-600",
  },
};

export default function JobCard({ job, score, reasons }) {
  const locations = JSON.parse(job.location || "[]");
  const sourceLabel = SOURCES[job.source]?.label || job.source;
  const changeBadge =
    job.status === "possibly_closed"
      ? CHANGE_BADGES.possibly_closed
      : CHANGE_BADGES[job.lastRunChangeType];

  return (
    <li
      className={`rounded-lg border p-4 shadow-sm ${
        job.status === "possibly_closed"
          ? "border-slate-200 bg-slate-50 opacity-70"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{job.title}</h3>
            {changeBadge && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${changeBadge.className}`}>
                {changeBadge.label}
              </span>
            )}
            {job.duplicateCount > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                Found on {job.duplicateCount + 1} sources
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600">{job.company}</p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          {sourceLabel}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
        {locations.map((loc) => (
          <span key={loc} className="rounded bg-slate-50 px-2 py-1">
            {loc}
          </span>
        ))}
        <span className="rounded bg-slate-50 px-2 py-1">{job.employmentType}</span>
      </div>

      {job.changeSummary && (
        <p className="mt-2 text-xs text-amber-700">Changed: {job.changeSummary}</p>
      )}

      {score !== null && score !== undefined && (
        <div className="mt-2 rounded-md bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold text-slate-700">
            {score}% match
          </p>
          {reasons.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-xs text-slate-600">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>first seen {timeAgo(job.firstSeenAt)}</span>
        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-600"
        >
          Apply →
        </a>
      </div>
    </li>
  );
}
