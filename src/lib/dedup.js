// Jaccard similarity (shared tokens / union of tokens) — no external
// dependency needed for short job titles. Deliberately NOT shared/min:
// that would score "Backend Engineer" vs "Backend Engineer II" as a
// perfect match (the shorter title's tokens are a full subset), silently
// merging two different levels of the same role. Jaccard penalizes the
// extra "ii" token via the union, which is exactly the distinction that
// matters here.
function titleSimilarity(a, b) {
  const tokensA = new Set(a.split(/\s+/).filter(Boolean));
  const tokensB = new Set(b.split(/\s+/).filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let shared = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) shared++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return shared / union;
}

const TITLE_SIMILARITY_THRESHOLD = 0.8;

// A candidate is a likely duplicate of an existing job if the company
// matches, titles are highly similar (token overlap), and at least one
// location string matches. Deliberately conservative — e.g. "Backend
// Engineer I" vs "Backend Engineer II" should NOT merge, since the
// trailing token differs and pulls similarity below the threshold for
// short titles.
export function findDuplicate(candidate, existingJobs) {
  const candidateLocations = new Set(JSON.parse(candidate.location || "[]"));

  for (const existing of existingJobs) {
    if (existing.company.toLowerCase() !== candidate.company.toLowerCase()) {
      continue;
    }

    const similarity = titleSimilarity(
      candidate.titleNormalized,
      existing.titleNormalized
    );
    if (similarity < TITLE_SIMILARITY_THRESHOLD) continue;

    const existingLocations = JSON.parse(existing.location || "[]");
    const locationMatches = existingLocations.some((loc) =>
      candidateLocations.has(loc)
    );
    if (!locationMatches) continue;

    return existing;
  }

  return null;
}
