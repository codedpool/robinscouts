# RobinScouts — Build Plan

**Hackathon:** Into the Scrape-Verse (WeMakeDevs × Bright Data), Aug 17–23, 2026
**One-line pitch:** RobinScouts is a hiring-change intelligence feed — it watches public job sources, tells users what's new or changed since they last checked, and keeps working (self-heals) when a source website's layout changes.

This file is the working spec. It's organized into **phases** — each phase
has a checklist at the top (tick items off as they're done) followed by the
detailed rationale for that phase. Read the checklist first; read the prose
underneath when you need the "why" behind an item. Do not start a later
phase until the previous one is demo-able end to end.

---

## Progress at a glance

- [x] **Phase 0** — Hard constraints & submission basics (repo, README) — mostly done, 2 items deliberately deferred
- [x] **Phase 1** — Stage 1: custom source + recovery loop — done, fully verified end to end
- [x] **Phase 1.5** — Strengthening for Web-Slinger (grand prize track) — done 2026-08-20
- [ ] **Phase 2** — Stage 2: second source + dedup — not started
- [ ] **Phase 3** — Stage 3: change detection — not started
- [ ] **Phase 4** — Stage 4: rule-based matching — not started
- [ ] **Phase 5** — Stage 5: company hiring-activity summaries (optional, cut first) — not started
- [ ] **Phase 6** — Final: demo video + full README + submission — not started

Last updated: 2026-08-20.

---

## Foundations (read once, applies throughout)

### Product shape

RobinScouts is **not** a job board. It's a change-detection layer on top of hiring data:

> "What's new, what changed, and what deserves attention right now" — not just "here are some jobs."

Two data layers feed one normalized feed:

| Layer                                       | Role                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Bright Data pre-built scrapers              | Broad discovery, realistic job volume                                                                                  |
| Custom Scraper Studio scraper (built by us) | One niche/regional public source **not** already in Bright Data's library — this is the hackathon's core demonstration |

**The custom source must be visibly load-bearing in the main feed at all times** — never isolated into a separate "Bright Data demo" screen. If it only shows up during the break/heal segment, the project risks looking like a wrapper around the pre-built library, which risks disqualification territory on the "custom scraper" requirement.

### Tech stack (locked, don't relitigate mid-build)

- **Framework:** Next.js (App Router, JavaScript/JSX) — single codebase for UI + API routes.
- **Database:** SQLite via Prisma — good enough for hackathon scale, zero ops overhead. (Prisma 7: uses the `prisma-client-js` generator, not the newer TS-native one, and needs the `@prisma/adapter-better-sqlite3` driver adapter — see memory notes if this trips up again.)
- **Scraper invocation:** Bright Data CLI (`bdata`), called via Node `child_process`.
- **Styling:** Tailwind, keep it plain — polish only matters if the core loop works.
- **No auth needed.** Preferences can be a simple local form/session, not a login system.

No second backend language or queue/worker system unless Stage 3+ genuinely requires scheduled runs — a manual "Check for new jobs" button that triggers everything synchronously is enough for the hackathon.

### Normalized job record (single schema every source maps into)

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

Implemented in `prisma/schema.prisma` (Job + SourceStatus models) and `src/lib/normalize.js`.

### What to cut, in order, if time runs short

1. Company hiring-activity summaries (Phase 5)
2. Advanced ranking beyond the basic rule weights
3. Additional source breadth beyond the two sources in Phase 2
4. Polished preferences UI (a plain form is fine)
5. Any notification/email feature (don't build this at all unless everything else is done early)

**Never cut:** custom scraper, failure detection, healing, recovery visible in the main feed, basic dedup (once 2 sources exist), basic change detection, README, demo video.

---

## Phase 0 — Hard constraints & submission basics

From the official rules — do not violate.

- [x] Must use **Bright Data Scraper Studio** to create and run a **custom** web scraper (not just a pre-built library scraper). — `c_msz1d5ly1aja1gxcbg`, targets `jobs.lever.co/Onehouse`.
- [x] Public data only. No login-walled, paywalled, or personal data. — Onehouse's public careers page.
- [x] Main coding started after the hackathon began (Aug 17). — all build work done 2026-08-19.
- [x] Public repo — https://github.com/codedpool/robinscouts
- [x] README present, with Scraper Studio explanation and AI-assistant disclosure — basic version done, will evolve.
- [ ] Example structured output committed to the repo — **deliberately deferred**, not forgotten.
- [ ] Demo video — **deliberately deferred**, comes once more of the product is built.
- [ ] README's plain-language explanations of dedup / change-detection / matching rules — blocked on Phases 2–4 existing.

Also remember (not a checkbox, an ongoing readiness requirement): **you must be able to explain the scraper, architecture, and every decision above in your own words if a judge asks.** Judging criteria are impact, creativity, technical excellence, use of Scraper Studio, reliability/self-healing, and presentation — equal weight.

---

## Phase 1 — Stage 1: Custom source + recovery loop ✅ done

**Goal:** by the end of this phase you already have a submittable project.

- [x] Pick a custom source and validate it works before writing product code (`bdata scraper create`, confirm usable structured JSON).
  - Source: `jobs.lever.co/Onehouse`. **Gotcha:** Lever URLs are case-sensitive — lowercase `onehouse` 404s, `Onehouse` works.
- [x] Build the minimal feed: a page listing jobs from this one source, normalized into the schema, saved to the DB.
  - `src/app/page.js`, `src/lib/scraper.js`, `src/lib/normalize.js`, `src/app/api/refresh/route.js`. Verified live: 9 real jobs render correctly.
- [x] Build the intentional-break demo — `bdata scraper heal <id> "<revert prompt>" --url <detail-page-url> --auto-approve --auto-save`, confirmed via CLI that the real collector now fails on the list page (`Parse error: Invalid URL`). Fully CLI, no browser.
- [x] Build failure detection: 0 jobs or missing required fields → mark `source_unhealthy`, show it in the UI instead of a silently empty feed.
  - `SourceStatus` model + `SourceStatusBanner` component. Verified live against the real broken collector (not a simulated one): banner shows the actual error, existing job cards are preserved (not wiped).
- [x] Heal a real break, re-run, confirm the same Collector ID recovers, feed updates in place.
  - `bdata scraper heal <id> "<fix prompt>" --url https://jobs.lever.co/Onehouse --auto-approve --auto-save`, verified via CLI (9 jobs again) and via the app (`/api/refresh` → healthy, 9 jobs). Fully CLI, no browser.

**Phase 1 exit criteria:** one feed, real data, a documented break→detect→heal→recover cycle, same Collector ID throughout. **Fully met**, verified against the real collector end to end, entirely from the terminal.

**How production publishing actually works — corrected:** `bdata scraper heal ... --auto-approve --auto-save` (or `bdata scraper approve <id> --auto-save`) publishes straight to production with no browser step at all. The `completed_steps` list in the response includes `"save_new_template"` when this worked — that's the tell. Earlier in this project we wrongly concluded a manual "Save to production" browser click was always required; that was because we ran plain `bdata scraper approve` without ever checking `--help` for its full flag set, and missed `--auto-save` entirely. Cross-checked against Bright Data's own [coding-agent-prompts reference repo](https://github.com/anil-bd/scraper-studio-scrape-verse-hackathon-august-2026) for this exact hackathon, which documents this flow verbatim. Lesson: run `--help` on every subcommand before concluding a limitation is real.

### Choosing the custom source — checklist (kept for reference; already satisfied for Onehouse)

- [x] Public, no login required
- [x] Not already covered by Bright Data's pre-built library
- [x] Structurally scrapable by Scraper Studio without a 30+ minute fight (took longer than 30 min in practice due to several real bugs, but resolved same day)
- [x] Has enough live listings to make a demo look real (9 open roles)
- [x] Changes often enough that "freshness" is a believable value prop (startup hiring page)
- [x] Nothing personal/restricted on the page

---

## Phase 1.5 — Strengthening for Web-Slinger (grand prize track)

Not one of the original plan.md stages — added 2026-08-20 after reading Bright
Data's own reference material for this hackathon ([coding-agent-prompts
repo](https://github.com/anil-bd/scraper-studio-scrape-verse-hackathon-august-2026)),
which flags two things that separate a strong "best use of Bright Data"
submission from a weak one: (1) self-healing that reacts to a genuine
structural change, not a scripted regression, and (2) one collector
generalizing across genuinely different page structures, not one static
target. Every submission is automatically eligible for every track — this
phase is about making the strongest possible case for Web-Slinger
specifically, not a requirement to unlock it.

- [x] Host a page we fully control for an undeniable, non-staged self-heal.
  - `docs/mirror/index.html`, served via GitHub Pages at
    https://codedpool.github.io/robinscouts/mirror/. For the actual demo
    recording: genuinely edit this file's HTML (rename `.job-title`, nest a
    field deeper, etc.), push, then heal a collector pointed at it against
    the real change — not a prompt asking the AI to pretend something broke.
- [x] Add a second **custom** Scraper Studio target (not just a pre-built
  library source) on a genuinely different ATS, to demonstrate Scraper
  Studio generalizing across structurally different pages — mirroring the
  "OpenCall" reference idea's pattern (one schema, heterogeneous sources).
  - Target: Sourcegraph's Greenhouse-hosted careers page
    (`https://job-boards.greenhouse.io/sourcegraph91`), public, not in
    Bright Data's pre-built library (only the big aggregator boards —
    LinkedIn/Indeed/Glassdoor — are covered, not individual company career
    pages). Different ATS than Onehouse's Lever page, genuinely different
    DOM structure.
  - Collector `c_mt0i5k70qvn77jqk4`, active by default (unlike the first
    collector, no "Collector disabled" gate hit this time). Wired into
    `src/lib/sources.js`; `normalizeLeverJob` renamed to the source-agnostic
    `normalizeJobPosting` since both Lever's and Greenhouse's AI-generated
    schemas share the same field shape.
  - Real data-quality find along the way: Greenhouse mixes a generic "Join
    our Talent Community" CTA into the listing that looks like a job card
    but isn't — added `isRealJobPosting()` filter in `normalize.js` to drop
    it. Verified live: `/api/refresh` → 9 Onehouse + 7 Sourcegraph (8 raw
    minus the filtered CTA) = 16 job cards, both source labels correct, no
    errors.
  - Not yet done: the AI-generated Greenhouse schema doesn't include
    `employment_type` (degrades to "unspecified" gracefully, doesn't
    crash). A follow-up heal to add it would also double as a genuine
    "extend the schema" self-heal demo beat, matching OpenCall's suggested
    pattern — worth doing before the recording, not required for the app
    to work.

---

## Phase 2 — Stage 2: Second source + deduplication

- [ ] Add one Bright Data pre-built/library source (via `/scrape` or `/trigger`) for a broader job source, normalized into the same schema. **Which library source is still an open decision — needs a pick before this phase can start.**
- [ ] Add source labels visible on each job card (e.g. "Onehouse (custom)" vs. library source name) — keeps the custom source visibly attributed, not hidden. (Partially in place already: `JobCard` shows a source label pulled from `SOURCES` config — just needs a second entry.)
- [ ] Add lightweight dedup: likely duplicate if `company` matches AND `title_normalized` is similar (token overlap or Levenshtein above a threshold) AND `location` matches. On a match, keep one canonical card, store the other under `duplicate_of`, show "Found on 2 sources."
- [ ] **Verify dedup by hand on the actual demo pair before recording anything.** Confirm it doesn't over-merge two genuinely different roles at the same company (e.g. "Backend Engineer I" vs "Backend Engineer II").

**Phase 2 exit criteria:** one combined feed, two real sources, no visible duplicates in the demo dataset, custom source still contributing real cards to the feed.

---

## Phase 3 — Stage 3: Change detection

- [ ] On every scrape run, compare `content_hash` against the previous stored value per job (matched by company + application_url or a stable identifier).
- [ ] Classify:
  - New → not seen in previous run.
  - Updated → hash changed (location, experience, description, etc.) — store *what* changed, not just that something changed.
  - Possibly closed → job missing from the current run, but only after the **source health check passed** (a successful run that returned other jobs normally) and the job was missing across more than one check. Never mark closed off the back of a failed/unhealthy run.
- [ ] Never claim an exact posting date. Use "first seen X ago" / "updated since yesterday" language throughout (already the convention in `src/lib/time.js`) — don't fabricate a `posted_at` unless the source explicitly provides one.

**Phase 3 exit criteria:** feed clearly shows New / Updated / Possibly closed / Source unhealthy states, and the possibly-closed logic never fires off a failed run.

---

## Phase 4 — Stage 4: Transparent, rule-based matching

- [ ] Build a simple preference form: role, location, employment type, skills.
- [ ] Score every job deterministically — no LLM call in the scoring path:

```
skill overlap:     up to 50 pts (proportional to matched skills / preferred skills)
location match:    25 pts (remote or specified location matches)
experience fit:    15 pts (job's experience range overlaps preference)
title match:       10 pts (role keyword match in normalized title)
```

- [ ] Generate the "Shown because" explanation directly from which rules fired — not a generative summary of the score. Same job + same preferences must always produce the same score and explanation, every time.

**Phase 4 exit criteria:** every job card can show a deterministic match % and a bullet-point reason list a judge can verify by reading the rule weights.

---

## Phase 5 — Stage 5: Company hiring-activity summaries (optional — cut first if short on time)

- [ ] Only attempt after Phases 1–4 are solid and there's time left on day 5+. Summarize per-company posting velocity ("Company A posted 4 roles this week, 2 match your profile"). Nice-to-have — do not let it threaten Phase 1–4 stability or eat into demo/README time.

---

## Phase 6 — Final: demo, README, submission

### Day-5 checkpoint (hard rule)

- [ ] By end of day 5, stop building new product features entirely. At minimum have: working custom source + visible break/heal/recover loop, real combined feed, second source integrated (if stable), dedup (if second source is in), basic change detection, a stable rehearsed demo dataset (don't rely on live sites cooperating during recording).
- [ ] From day 5 onward, only: fix demo-breaking bugs, tidy UI just enough for clarity, write the README, record and edit the demo video, test the repo from a clean clone, fill out the submission form.

### Demo script (~4–5 min video, one continuous story — not disconnected feature demos)

- [ ] 1. Enter preferences: entry-level backend roles, India or remote, Python/FastAPI.
- [ ] 2. Show the unified feed — one card from the custom source, one from the library source, clearly labeled.
- [ ] 3. Point out a duplicate collapsed into one card ("Found on 2 sources").
- [ ] 4. Show one **new** job and one **updated** job (with the specific field that changed).
- [ ] 5. Break the custom source's page layout on screen. *(Rehearse this for real first — see Phase 1 caveat about CLI heal reliability.)*
- [ ] 6. Show the source-health warning — "0 valid jobs, required fields missing" — not a silent empty feed.
- [ ] 7. Run `bdata scraper heal <collector_id> "<description>"`.
- [ ] 8. Re-run the collector, show the same Collector ID returning jobs again, recovered **inside the same feed**.
- [ ] 9. Open one job card, show the deterministic "Shown because" match explanation.
- [ ] 10. Close with the product statement below.

### Product statement (for README + video close)

> RobinScouts is a hiring-change intelligence feed. It watches public job sources, tells job seekers what's new or changed since they last checked, explains why a job matches them, and keeps working when a source website changes its layout — using a custom Bright Data Scraper Studio scraper at its core.

### README checklist (final)

- [x] Setup instructions a stranger can follow from a clean clone
- [x] Clear explanation of how Scraper Studio is used (custom scraper role vs. library role — library role still TBD until Phase 2)
- [ ] Example structured output (a sample normalized job JSON)
- [ ] Demo video link
- [x] AI-assistant disclosure (Claude Code used, all code/architecture reviewed and understood)
- [ ] Explain the dedup rule, the change-detection rule, and the matching rule weights in plain language — blocked on Phases 2–4
