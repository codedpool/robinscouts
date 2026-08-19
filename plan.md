# RobinScouts — Build Plan

**Hackathon:** Into the Scrape-Verse (WeMakeDevs × Bright Data), Aug 17–23, 2026
**One-line pitch:** RobinScouts is a hiring-change intelligence feed — it watches public job sources, tells users what's new or changed since they last checked, and keeps working (self-heals) when a source website's layout changes.

This file is meant to be dropped into a repo and read by Claude Code as the working spec. Follow the stages in order. Do not start a later stage until the previous one is demo-able end to end.

---

## 0. Hard constraints (from the official rules — do not violate)

- Must use **Bright Data Scraper Studio** to create and run a **custom** web scraper. Using only a pre-built library scraper does not qualify — a custom Scraper Studio scraper is mandatory.
- Public data only. No login-walled, paywalled, or personal data.
- Main coding must start after the hackathon begins (Aug 17). Planning/notes beforehand is fine.
- Submission must include: public repo, README, example structured output, demo video, and a clear explanation of how Scraper Studio is used.
- **AI coding assistants (including Claude Code) are allowed but must be disclosed in the README.** Say plainly that Claude Code was used, and that all code was reviewed/understood by the participant. Projects generated entirely by AI without demonstrated understanding may be rejected — so be ready to explain every architectural decision below in your own words.
- You must be able to explain the scraper, architecture, and technical decisions if asked.
- Judging criteria (equal weight): potential impact, creativity/innovation, technical excellence, use of Scraper Studio, reliability/self-healing, presentation.

---

## 1. Product shape

RobinScouts is **not** a job board. It's a change-detection layer on top of hiring data:

> "What's new, what changed, and what deserves attention right now" — not just "here are some jobs."

Two data layers feed one normalized feed:

| Layer                                       | Role                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Bright Data pre-built scrapers              | Broad discovery, realistic job volume                                                                                  |
| Custom Scraper Studio scraper (built by us) | One niche/regional public source **not** already in Bright Data's library — this is the hackathon's core demonstration |

**The custom source must be visibly load-bearing in the main feed at all times** — never isolated into a separate "Bright Data demo" screen. If it only shows up during the break/heal segment, the project risks looking like a wrapper around the pre-built library, which risks disqualification territory on the "custom scraper" requirement.

---

## 2. Tech stack (pick this, don't relitigate mid-build)

To keep everything in one language for speed with Claude Code:

- **Framework:** Next.js (App Router, JavaScript/JSX) — single codebase for UI + API routes.
- **Database:** SQLite via Prisma (or Postgres if you already have one running) — good enough for hackathon scale, zero ops overhead.
- **Scraper invocation:** Bright Data CLI (`@brightdata/cli`) called via Node `child_process`, or the equivalent HTTP API (`/scrape`, `/trigger`) for the pre-built library source.
- **Styling:** Tailwind, keep it plain — polish only matters if the core loop works.
- **No auth needed.** Preferences can be a simple local form/session, not a login system (also keeps you clear of the "no personal data" rule).

Do not introduce a second backend language or a queue/worker system unless Stage 3+ genuinely requires scheduled runs — a manual "Check for new jobs" button that triggers everything synchronously is enough for the hackathon.

---

## 3. Normalized job record (single schema every source maps into)

```json
{
  "id": "uuid",
  "company": "string",
  "title": "string",
  "title_normalized": "string (lowercased, stripped of level suffixes for matching)",
  "location": ["Remote", "India"],
  "employment_type": "internship | entry-level | full-time | unspecified",
  "experience": "string, e.g. 0-2 years | unspecified",
  "skills": ["python", "fastapi"],
  "salary": "string | null",
  "description": "string",
  "source_url": "string",
  "application_url": "string",
  "source": "custom-source-name | bright-data-library",
  "first_seen_at": "timestamp",
  "last_seen_at": "timestamp",
  "content_hash": "string (hash of title+location+experience+description, used to detect changes)",
  "status": "active | possibly_closed | source_unhealthy",
  "duplicate_of": "id | null"
}
```

Every scraper output (custom or library) maps into this shape before it touches the database. Keep raw source-specific fields around too (a `raw_json` column) for debugging, but the product only ever speaks this schema.

---

## 4. Build stages — follow in order, each is independently demo-able

### Stage 1 — Custom source + recovery loop (the defensible MVP)

**Goal:** by the end of this stage you already have a submittable project.

1. Pick a custom source (see checklist in §6) and validate it works **before** writing product code:
   - Run `bdata scraper create <url> "<data description>"` manually against your real target.
   - Confirm it returns usable structured JSON. If it doesn't within ~30 minutes of trying, pick a different source. Don't sink a day into fighting one target.
2. Build the minimal feed: a page that lists jobs from this one source, pulled via the Collector ID (`bdata scraper run <collector_id> <url> --pretty`), normalized into the schema above, and saved to the DB.
3. Build the intentional-break demo:
   - Save the original page HTML/structure (or use a local copy you control) so you can deterministically change it rather than hoping the live site redesigns on cue.
   - After the change, re-run the collector and confirm it returns 0 valid jobs / missing fields.
4. Build failure detection: if a run returns 0 jobs where the last successful run had jobs, or expected fields (title/location/application link) are empty, mark the source `source_unhealthy` and show that state in the UI instead of silently showing an empty feed.
5. Run `bdata scraper heal <collector_id> "<plain-language description of what changed>"`, then re-run. Confirm the same Collector ID now returns the original job(s) again, and the feed updates in place — not a separate screen.

**Stage 1 exit criteria:** one feed, real data, a documented break→detect→heal→recover cycle, same Collector ID throughout.

### Stage 2 — Second source + deduplication

1. Add one Bright Data pre-built/library source (via `/scrape` or `/trigger`) for a broader job source, normalized into the same schema.
2. Add source labels visible on each job card (e.g. "Startup Careers" vs "Bright Data source") — this keeps the custom source visibly attributed, not hidden.
3. Add lightweight dedup: a job is a likely duplicate if `company` matches AND `title_normalized` is similar (simple string similarity, e.g. token overlap or Levenshtein above a threshold) AND `location` matches. On a match, keep one canonical card, store the other under `duplicate_of`, and show a small "Found on 2 sources" label.
4. **Verify dedup by hand on your actual demo pair before recording anything.** Confirm it doesn't over-merge two genuinely different roles at the same company (e.g. "Backend Engineer I" vs "Backend Engineer II") — check this specific pair manually, don't trust the threshold blindly.

**Stage 2 exit criteria:** one combined feed, two real sources, no visible duplicates in your demo dataset, custom source still contributing real cards to the feed.

### Stage 3 — Change detection

1. On every scrape run, compare `content_hash` against the previous stored value per job (matched by company + application_url or a stable identifier).
2. Classify:
   - New → not seen in previous run.
   - Updated → hash changed (location, experience, description, etc.) — store what changed, not just that something changed, so the UI can say what.
   - Possibly closed → job missing from the current run, but only after the **source health check passed** (a successful run that returned other jobs normally) and the job was missing across more than one check. Never mark closed off the back of a failed/unhealthy run.
3. Never claim an exact posting date. Use "first seen X ago" / "updated since yesterday" language throughout the UI and data model — don't fabricate a `posted_at` unless the source explicitly provides one.

**Stage 3 exit criteria:** feed clearly shows New / Updated / Possibly closed / Source unhealthy states, and the possibly-closed logic never fires off a failed run.

### Stage 4 — Transparent, rule-based matching

1. Build a simple preference form: role, location, employment type, skills.
2. Score every job deterministically — no LLM call in the scoring path:

```
skill overlap:     up to 50 pts (proportional to matched skills / preferred skills)
location match:    25 pts (remote or specified location matches)
experience fit:    15 pts (job's experience range overlaps preference)
title match:       10 pts (role keyword match in normalized title)
```

3. Generate the "Shown because" explanation directly from which rules fired — not from a generative summary of the score. Same job + same preferences must always produce the same score and explanation, every time, with no exceptions. This determinism is your defense if a judge asks how matching works.

**Stage 4 exit criteria:** every job card can show a deterministic match % and a bullet-point reason list that a judge can verify by reading the rule weights.

### Stage 5 — Company hiring-activity summaries (cut first if short on time)

Only attempt after Stage 1–4 are solid and you've hit day 5 with time left. Summarize per-company posting velocity ("Company A posted 4 roles this week, 2 match your profile"). This is genuinely nice-to-have — do not let it threaten Stage 1–4 stability or eat into demo/README time.

---

## 5. What to cut, in order, if time runs short

1. Company hiring-activity summaries (Stage 5)
2. Advanced ranking beyond the basic rule weights
3. Additional source breadth beyond the two sources in Stage 2
4. Polished preferences UI (a plain form is fine)
5. Any notification/email feature (don't build this at all unless everything else is done early)

**Never cut:** custom scraper, failure detection, healing, recovery visible in the main feed, basic dedup (once 2 sources exist), basic change detection, README, demo video.

---

## 6. Choosing the custom source — checklist

Before committing, the source must be:

- [ ] Public, no login required
- [ ] Not already covered by Bright Data's pre-built library (check first — if a judge could ask "why not just use the existing scraper," pick something else)
- [ ] Structurally scrapable by Scraper Studio without a 30+ minute fight (validate manually, day 1)
- [ ] Has enough live listings to make a demo look real (not 1–2 jobs total)
- [ ] Changes often enough that "freshness" is a believable value prop
- [ ] Nothing personal/restricted on the page

Good candidates: a regional/startup career page, a niche vertical job board, or a smaller ATS-hosted page not already in the 1,000+ library.

---

## 7. Day-5 checkpoint (hard rule)

By end of day 5, stop building new product features entirely. You should have, at minimum:

- Working custom source + visible break/heal/recover loop
- Real, combined job feed
- Second source integrated, if stable
- Dedup, if second source is in
- Basic change detection
- A stable, rehearsed demo dataset (don't rely on live sites cooperating during recording)

From day 5 onward, only: fix demo-breaking bugs, tidy UI just enough for clarity, write the README, record and edit the demo video, test the repo from a clean clone, fill out the submission form. This is real product work, not slack — the submission requires a repo, README, example output, and video, not just working code.

---

## 8. The one-story demo script (~4–5 min video)

Do not record disconnected feature demos. One continuous user story:

1. Enter preferences: entry-level backend roles, India or remote, Python/FastAPI.
2. Show the unified feed — one card from the custom source, one from the library source, clearly labeled.
3. Point out a duplicate collapsed into one card ("Found on 2 sources").
4. Show one **new** job and one **updated** job (with the specific field that changed, e.g. location or experience range).
5. Break the custom source's page layout on screen.
6. Show the source-health warning — "0 valid jobs, required fields missing" — not a silent empty feed.
7. Run `bdata scraper heal <collector_id> "<description>"`.
8. Re-run the collector, show the same Collector ID returning jobs again, recovered **inside the same feed**.
9. Open one job card, show the deterministic "Shown because" match explanation.
10. Close with the product statement (see §9).

---

## 9. Product statement (for README + video close)

> RobinScouts is a hiring-change intelligence feed. It watches public job sources, tells job seekers what's new or changed since they last checked, explains why a job matches them, and keeps working when a source website changes its layout — using a custom Bright Data Scraper Studio scraper at its core.

---

## 10. README checklist (Stage 5 / final)

- [ ] Setup instructions a stranger can follow from a clean clone
- [ ] Clear explanation of how Scraper Studio is used (custom scraper role vs. library role)
- [ ] Example structured output (a sample normalized job JSON)
- [ ] Demo video link
- [ ] **AI-assistant disclosure**: state Claude Code was used, and that all code/architecture was reviewed and understood by the participant(s)
- [ ] Explain the dedup rule, the change-detection rule, and the matching rule weights in plain language — these are the parts most likely to get a follow-up question from a judge
