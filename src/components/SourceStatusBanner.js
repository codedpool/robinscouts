export default function SourceStatusBanner({ statuses }) {
  const unhealthy = statuses.filter((s) => s.status === "unhealthy");
  if (unhealthy.length === 0) return null;

  return (
    <div className="space-y-1.5 rounded-2xl border border-amber-200 bg-amber-50/95 px-5 py-3 shadow-[0_10px_30px_-15px_rgba(120,80,10,0.4)]">
      {unhealthy.map((s) => (
        <p key={s.source} className="text-xs text-amber-800">
          <strong className="font-medium text-amber-900">{s.label}</strong> is
          unhealthy — last check returned 0 valid jobs
          {s.lastError ? `: ${s.lastError}` : "."} Showing the last known-good
          data below, not a silent empty feed.
        </p>
      ))}
    </div>
  );
}
