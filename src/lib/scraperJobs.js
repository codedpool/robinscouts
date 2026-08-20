// In-memory tracker for in-flight "add a company" scraper builds, keyed by
// a locally-generated jobId. A single Map is fine here — this is a
// single-process demo app, not a queue system — and it never stores the
// visitor's API key, only status/progress.
const jobs = new Map();

export function createJob() {
  const id = crypto.randomUUID();
  jobs.set(id, { status: "running", step: null, error: null, collectorId: null, jobCount: null });
  return id;
}

export function updateJob(id, patch) {
  const current = jobs.get(id);
  if (!current) return;
  jobs.set(id, { ...current, ...patch });
}

export function getJob(id) {
  return jobs.get(id) || null;
}
