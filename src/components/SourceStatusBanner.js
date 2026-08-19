export default function SourceStatusBanner({ statuses }) {
  const unhealthy = statuses.filter((s) => s.status === "unhealthy");
  if (unhealthy.length === 0) return null;

  return (
    <div className="space-y-2">
      {unhealthy.map((s) => (
        <div
          key={s.source}
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <strong>{s.label}</strong> is unhealthy — last check returned 0 valid
          jobs{s.lastError ? `: ${s.lastError}` : "."} Showing the last
          known-good data below, not a silent empty feed.
        </div>
      ))}
    </div>
  );
}
