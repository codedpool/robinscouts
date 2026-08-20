import crypto from "node:crypto";

function normalizeEmploymentType(raw) {
  const v = (raw || "").toLowerCase();
  if (v.includes("intern")) return "internship";
  if (v.includes("entry")) return "entry-level";
  if (v.includes("full")) return "full-time";
  return "unspecified";
}

// Neither collector extracts the full job description (that would need a
// second per-job page visit), so skills/experience are inferred from the
// title alone. That's a real limitation, not a hidden one — it's called
// out in the README's matching-rules section.
const KNOWN_SKILLS = [
  "python", "javascript", "typescript", "java", "go", "golang", "rust",
  "react", "node", "kubernetes", "docker", "aws", "gcp", "azure", "sql",
  "fastapi", "django", "flask", "ruby", "rails", "graphql", "c++", "c#",
  "swift", "kotlin", "terraform", "spark", "hadoop", "ml", "ai",
];

function inferSkillsFromTitle(title) {
  const lower = title.toLowerCase();
  return KNOWN_SKILLS.filter((skill) => lower.includes(skill));
}

function inferExperienceFromTitle(title) {
  const lower = title.toLowerCase();
  if (/\b(senior|staff|lead|principal|sr\.?)\b/.test(lower)) return "senior";
  if (/\b(junior|entry|graduate|new grad|jr\.?)\b/.test(lower)) return "entry-level";
  return "unspecified";
}

// Shared shape across our collectors (Lever and Greenhouse both normalize to this):
// { job_title, location, employment_type?, application_link, product_page_url }
//
// Self-service "add a company" sources ask the AI-generated scraper for this
// exact shape too, but codegen for an arbitrary user-supplied site can't be
// guaranteed to match it perfectly every time — so each field falls back to
// a couple of common aliases rather than assuming the canonical name landed.
export function normalizeJobPosting(raw, { company, source }) {
  const title = (raw.job_title || raw.title || "").trim();
  const location = (raw.location || "").trim();
  const employmentType = normalizeEmploymentType(raw.employment_type || raw.type);
  const applicationUrl = raw.application_link || raw.apply_url || raw.url;
  const sourceUrl = raw.product_page_url || applicationUrl;
  const titleNormalized = title.toLowerCase().replace(/\s+/g, " ").trim();

  const contentHash = crypto
    .createHash("sha256")
    .update(`${title}|${location}|${employmentType}`)
    .digest("hex");

  return {
    company,
    title,
    titleNormalized,
    location: JSON.stringify(location ? [location] : []),
    employmentType,
    experience: inferExperienceFromTitle(title),
    skills: JSON.stringify(inferSkillsFromTitle(title)),
    salary: null,
    description: "",
    sourceUrl,
    applicationUrl,
    source,
    contentHash,
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
  const title = raw?.job_title || raw?.title;
  return Boolean(title) && !NON_JOB_TITLE_PATTERN.test(title);
}

// Describes what changed between two normalized versions of the same job,
// for the "Shown because"-style change summary. Returns null if nothing
// user-visible changed.
export function describeChange(previous, next) {
  const changes = [];
  if (previous.title !== next.title) {
    changes.push(`title changed: "${previous.title}" → "${next.title}"`);
  }
  const prevLocation = JSON.parse(previous.location || "[]").join(", ");
  const nextLocation = JSON.parse(next.location || "[]").join(", ");
  if (prevLocation !== nextLocation) {
    changes.push(`location changed: ${prevLocation || "?"} → ${nextLocation || "?"}`);
  }
  if (previous.employmentType !== next.employmentType) {
    changes.push(`employment type changed: ${previous.employmentType} → ${next.employmentType}`);
  }
  return changes.length > 0 ? changes.join("; ") : null;
}
