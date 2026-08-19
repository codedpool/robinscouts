import { timeAgo } from "@/lib/time";
import { SOURCES } from "@/lib/sources";

export default function JobCard({ job }) {
  const locations = JSON.parse(job.location || "[]");
  const sourceLabel = SOURCES[job.source]?.label || job.source;

  return (
    <li className="rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{job.title}</h3>
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
