export default function SourceStatusBanner({ statuses }) {
  const unhealthy = statuses.filter((s) => s.status === "unhealthy");
  if (unhealthy.length === 0) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-5xl space-y-1 px-6 py-2">
        {unhealthy.map((s) => (
          <p key={s.source} className="text-xs text-amber-800">
            <strong className="font-medium text-amber-900">{s.label}</strong> is
            unhealthy — last check returned 0 valid jobs
            {s.lastError ? `: ${s.lastError}` : "."} Showing the last known-good
            data below, not a silent empty feed.
          </p>
        ))}
      </div>
    </div>
  );
}
