export default function CompanySummary({ summaries, matching }) {
  if (summaries.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        This week&apos;s hiring activity
      </p>
      <ul className="mt-2 space-y-1">
        {summaries.map((entry) => (
          <li key={entry.company} className="text-sm text-slate-700">
            <span className="font-medium text-slate-900">{entry.company}</span>{" "}
            posted {entry.postedThisWeek}{" "}
            {entry.postedThisWeek === 1 ? "role" : "roles"} this week
            {matching && entry.matchedThisWeek > 0 && (
              <>
                , <span className="font-medium text-slate-900">{entry.matchedThisWeek}</span>{" "}
                match{entry.matchedThisWeek === 1 ? "es" : ""} your profile
              </>
            )}
            .
          </li>
        ))}
      </ul>
    </div>
  );
}
