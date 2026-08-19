import crypto from "node:crypto";

function normalizeEmploymentType(raw) {
  const v = (raw || "").toLowerCase();
  if (v.includes("intern")) return "internship";
  if (v.includes("entry")) return "entry-level";
  if (v.includes("full")) return "full-time";
  return "unspecified";
}

// Shared shape across our collectors (Lever and Greenhouse both normalize to this):
// { job_title, location, employment_type?, application_link, product_page_url }
export function normalizeJobPosting(raw, { company, source }) {
  const title = (raw.job_title || "").trim();
  const location = (raw.location || "").trim();
  const employmentType = normalizeEmploymentType(raw.employment_type);
  const applicationUrl = raw.application_link;
  const sourceUrl = raw.product_page_url || raw.application_link;

  const contentHash = crypto
    .createHash("sha256")
    .update(`${title}|${location}|${employmentType}`)
    .digest("hex");

  return {
    company,
    title,
    titleNormalized: title.toLowerCase().replace(/\s+/g, " ").trim(),
    location: JSON.stringify(location ? [location] : []),
    employmentType,
    experience: "unspecified",
    skills: "[]",
    salary: null,
    description: "",
    sourceUrl,
    applicationUrl,
    source,
    contentHash,
    status: "active",
    rawJson: JSON.stringify(raw),
  };
}

// True if a collector output entry is a failed-crawl marker rather than a job.
export function isCrawlError(entry) {
  return Boolean(entry && entry.error);
}

// Greenhouse (and some other ATSs) mix generic CTA links into the listing
// that look like job cards but aren't — filter those out before normalizing.
const NON_JOB_TITLE_PATTERN = /talent community|future (job )?opportunities/i;

export function isRealJobPosting(raw) {
  return Boolean(raw?.job_title) && !NON_JOB_TITLE_PATTERN.test(raw.job_title);
}
