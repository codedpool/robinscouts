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
- [x] **Phase 2** — Stage 2: second source + dedup — done 2026-08-20
- [x] **Phase 3** — Stage 3: change detection — done 2026-08-20
- [x] **Phase 4** — Stage 4: rule-based matching — done 2026-08-20
- [x] **Phase 5** — Stage 5: company hiring-activity summaries (optional, cut first) — done 2026-08-20
- [x] **Phase 5.5** — UI redesign + self-service "add a company" (BYOK) — done 2026-08-20, not an original stage, see below
- [x] **Phase 5.6** — Live deployment: Postgres/Neon migration + scheduled sync — done 2026-08-20, see below
- [x] **Phase 5.7** — Cinematic hero + full atmospheric restyle — done 2026-08-22, see below
- [ ] **Phase 6** — Final: demo video + full README + submission — not started

Last updated: 2026-08-22 (Phase 5.7 added).

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
- [x] Example structured output committed to the repo — `example-output.json`, two real records pulled straight from the running app's database.
- [ ] Demo video — **deliberately deferred**, comes once more of the product is built.
- [x] README's plain-language explanations of dedup / change-detection / matching rules.

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

## Phase 2 — Stage 2: Second source + deduplication ✅ done

- [x] Second source added — but as a second **custom** Scraper Studio target
  (Sourcegraph/Greenhouse, done in Phase 1.5) rather than a pre-built
  library source. Satisfies "two sources, same schema"; a pre-built
  library source is still a possible future addition but not required —
  the custom-second-target choice was deliberate, see Phase 1.5's
  reasoning (it's what actually strengthens the Web-Slinger case).
- [x] Source labels on each job card — `JobCard` shows the label from
  `SOURCES` config.
- [x] Dedup logic — `src/lib/dedup.js`, `findDuplicate()`. Likely-duplicate
  rule: same `company` (case-insensitive) + title similarity ≥ 0.8
  (Jaccard token overlap) + at least one matching `location`. On match,
  the new job is stored with `duplicateOfId` pointing at the canonical
  job; `Feed.js` filters duplicates out of the main list and shows "Found
  on N sources" on the canonical card.
- [x] **Verified by hand, and a real bug found and fixed in the
  process**: the first version used `shared / min(sizeA, sizeB)` for
  title similarity, which scored "Backend Engineer" vs "Backend Engineer
  II" as a perfect match (the shorter title's tokens are a full subset of
  the longer one) — exactly the over-merge case this plan warned about.
  Fixed by switching to proper Jaccard similarity (`shared / union`),
  which correctly separates them (0.667, below the 0.8 threshold) while
  still scoring exact duplicates at 1.0. Verified with a standalone script
  covering: exact duplicate (merges), level-suffix variant (does not
  merge), different company (does not merge), different location (does
  not merge).
- **Honest caveat:** Onehouse and Sourcegraph are different companies, so
  this logic has never actually fired against real overlapping data — only
  against synthetic test cases. It's real, tested code, but "verify on the
  actual demo pair" (this section's original instruction) doesn't
  currently apply since there is no real duplicate pair yet. Worth adding
  a source with genuine overlap potential before final submission if time
  allows, purely to show it firing on real data.

**Phase 2 exit criteria:** one combined feed, two real sources, no visible
duplicates in the demo dataset, custom source still contributing real
cards to the feed. **Met.**

---

## Phase 3 — Stage 3: Change detection ✅ done

- [x] `content_hash` (of title + location + employment type) compared
  against the stored value per job, matched by `applicationUrl` (the
  stable identifier). Implemented in `src/app/api/refresh/route.js`.
- [x] Classification, verified live end-to-end for all four states:
  - **New** — not found by `applicationUrl` on this run.
  - **Updated** — hash differs; `describeChange()` in `normalize.js`
    stores *what* changed (e.g. "location changed: Bangalore → Remote"),
    not just that something did, shown on the card as `changeSummary`.
  - **Possibly closed** — a job missing from a *healthy* run gets
    `missingSince` set on the first miss (still `active`, no badge yet);
    only flips to `possibly_closed` if it's still missing on a
    *second* consecutive healthy run. Reappearing at any point clears
    `missingSince` and resets to `active`.
  - **Source unhealthy** — unchanged from Phase 1, and structurally
    guaranteed to never touch job statuses: the missing-job loop only
    runs after the `validEntries.length === 0` unhealthy-path early
    `continue`.
  - Verified live: forced a real "new" (deleted a job, it came back
    classified new), a real "updated" (mutated stored location/hash,
    confirmed correct diff text), and a real "possibly closed" (pointed
    the Onehouse source at a single detail page — legitimately fewer
    results — for two consecutive runs, confirmed all 9 list jobs flipped
    to `possibly_closed`; reverted to the real URL, confirmed all 9
    recovered to `active`/`unchanged`).
- [x] No fabricated dates — `src/lib/time.js`'s `timeAgo()` was already the
  convention from Phase 1; `changeSummary`/`lastChangedAt` extend it
  without introducing a fake `posted_at`.
- **Real, documented side-finding**: running the Onehouse collector
  against a single job *detail* page produces a different
  `application_link` (ends in `/apply`) than the same job scraped via the
  *list* page (no `/apply` suffix) — an artifact of the collector's
  dual-mode parser. Since `applicationUrl` is the unique key, this would
  create a duplicate row for the same job if the collector were ever run
  in detail-page mode in production. Not a problem today (the app always
  calls it with the list URL), but worth knowing before relying on the
  detail-page fallback for anything real.

**Phase 3 exit criteria:** feed clearly shows New / Updated / Possibly
closed / Source unhealthy states, and the possibly-closed logic never
fires off a failed run. **Met, verified live, not just by code review.**

---

## Phase 4 — Stage 4: Transparent, rule-based matching ✅ done

- [x] Preference form — `src/components/PreferencesForm.js`: role keyword,
  location, employment type, experience level, skills (comma-separated).
  Persisted to `localStorage`, no login/session needed.
- [x] Deterministic scoring, no LLM anywhere in the path —
  `src/lib/matching.js`, `scoreJob()`, exactly the weights below:

```
skill overlap:     up to 50 pts (proportional to matched skills / preferred skills)
location match:    25 pts (remote or specified location matches)
experience fit:    15 pts (job's experience range overlaps preference)
title match:       10 pts (role keyword match in normalized title)
```

- [x] "Shown because" reasons generated directly from which rules fired
  (`reasons` array returned alongside the score) — same job + same
  preferences always produces the same score, verifiable by reading
  `matching.js` directly.
- **Honest limitation, worth stating plainly (in the README too):**
  neither collector extracts full job descriptions (that would need a
  second per-job page visit per posting). `skills` and `experience` are
  therefore inferred from the **title only**, via keyword matching
  (`normalize.js`: a known-skills list, and senior/staff/lead vs.
  junior/entry/graduate patterns). This is genuinely deterministic and
  rule-based — matching the plan's "no LLM in the scoring path"
  requirement — but the underlying signal is shallower than full-text
  extraction would give. Fine for a hackathon demo; worth disclosing to a
  judge who asks, not worth hiding.

**Phase 4 exit criteria:** every job card can show a deterministic match %
and a bullet-point reason list a judge can verify by reading the rule
weights. **Met.**

---

## Phase 5 — Stage 5: Company hiring-activity summaries ✅ done (optional — cut first if short on time)

- [x] Attempted after Phases 1–4 were solid, with time left — `src/lib/companySummary.js` (`summarizeByCompany`) + `src/components/CompanySummary.js`. Groups active, non-duplicate jobs by company; counts how many were `firstSeenAt` within the last 7 days ("posted this week" — using our own observation time, not a fabricated real posting date, consistent with the plan's "never claim an exact posting date" rule); when preferences are set, also counts how many of those score > 0 via the same deterministic `scoreJob()` from Phase 4.
- [x] Verified live: renders "Onehouse posted 9 roles this week." / "Sourcegraph posted 7 roles this week." with no preferences set; with a role preference of "engineer," correctly shows 7/9 and 4/7 matched counts respectively (checked directly against `scoreJob`, matches the title-keyword logic exactly).
- Still optional/cuttable in spirit — this is the first thing to rip out if Phase 6 time gets tight, per the plan's own cut order.

---

## Phase 5.5 — UI redesign + self-service "add a company" (BYOK)

Not one of the original stages — added 2026-08-20 evening after two rounds
of UI feedback and a strategic pivot toward making Bright Data's live
scraper-generation a user-facing feature instead of a backend detail.

- [x] Full redesign: warm light theme built around the mascot logo's
  navy/orange/gold palette, dense single-panel job list instead of a
  stacked card grid. See `git log` for the two redesign commits.
- [x] Self-service "add a company": a visitor pastes their own Bright Data
  API key + a career page URL, watches a real custom collector get built
  live (step-by-step progress), and it joins their session's feed under
  the same dedup/change-detection/matching pipeline as the two built-in
  sources. Session-scoped via `src/proxy.js` (Next 16's renamed
  `middleware.js`); the key is never persisted server-side.
- [x] Verified end-to-end against a real target with a real key — full
  pipeline confirmed working: session cookie, live progress polling,
  collector creation, first scrape, DB writes, key redaction on every
  error path.
- **Honest, undismissed limitation:** AI-generated scraping for an
  arbitrary user-supplied site is less reliable than the two hand-tuned
  static collectors. Live testing hit both a schema-generation mismatch
  (fixed by simplifying the prompt) and a genuine backend-side generation
  timeout (not fixable from our side — Bright Data's own AI-Flow stage
  stalled). **Rehearse against the specific site you plan to demo before
  recording it live** — don't assume any arbitrary URL will work first try.

---

## Phase 5.6 — Live deployment: Postgres/Neon migration + scheduled sync

Not one of the original stages — the user deployed to Vercel and hit
`SQLITE_CANTOPEN`, which surfaced two real architectural facts we hadn't
needed to face on localhost: a file-based SQLite DB doesn't exist in a
serverless environment, and the `bdata` CLI (globally installed, locally
logged in) doesn't either.

- [x] Migrated `prisma/schema.prisma` from `sqlite` to `postgresql`,
  switched `src/lib/db.js` from `@prisma/adapter-better-sqlite3` to
  `@prisma/adapter-neon` (Neon's HTTP-based serverless driver — the right
  fit for functions that can't hold a long-lived TCP pool open). Fresh
  migration baseline against a real Neon database (old SQLite-dialect
  migrations don't apply to Postgres, so the migration history was reset,
  not preserved).
- [x] Decided (after discussion) **not** to expose the operator's Bright
  Data key as a public Vercel env var for on-demand visitor-triggered
  refresh of the two built-in sources — partly a cost/exposure judgment
  call, but also moot: Scraper Studio collectors are account-scoped, so a
  different visitor's key couldn't run *our* collectors even if we wanted
  it to. Instead: the two built-in sources are a **shared snapshot**,
  refreshed on a schedule rather than by visitor clicks; BYOK-added
  sources remain fully visitor-owned and live, exactly as in Phase 5.5.
- [x] `@brightdata/cli` added as a real project dependency (was only a
  global install before) — needed for both the scheduled sync below and
  for the BYOK "add a company" flow to have any chance of working from a
  fresh Vercel serverless function, which won't have anyone's global npm
  installs. **Not yet verified working on an actual Vercel deployment** —
  confirmed locally that the CLI runs correctly via `-k` without relying
  on a logged-in session, but whether Vercel's Node serverless runtime
  can spawn `bdata` as a child process the same way has not been tested
  end-to-end against the live site.
- [x] `scripts/refresh-static-sources.js` + `.github/workflows/refresh-static-sources.yml`:
  a daily-cron (plus manual `workflow_dispatch`) GitHub Action that
  re-syncs Onehouse and Sourcegraph against the shared Neon database,
  reusing `refreshOneSource` verbatim — no separate/duplicated scraping
  logic. Uses `BRIGHTDATA_API_KEY` + `DATABASE_URL` as GitHub Actions
  secrets (this project's own operational credentials, not a visitor's —
  a completely different trust situation from BYOK, see Phase 5.5).
  Verified locally end-to-end (real key via env var, real write to Neon)
  before being wired into the workflow file.
- [x] Root `package.json` gained `"type": "module"` so the standalone
  script could import the app's own `src/lib/*.js` files directly via
  relative paths instead of duplicating logic — verified safe first (no
  plain-CommonJS `.js` config files existed at the project root to
  conflict with it), then confirmed via a full rebuild + dev server
  restart that nothing broke.
- [x] Fixed two real bugs surfaced only by testing this standalone script,
  not by the main app (which never hit them): `src/lib/db.js` and
  `src/lib/refreshSource.js` used the `@/...` path alias internally, which
  only resolves through Next.js's own bundler — a plain `node` invocation
  can't follow it. Switched both to relative imports (zero behavior change
  inside Next.js, now also works standalone). Separately, ES modules
  evaluate all static `import`s before the importing file's own top-level
  code runs, so loading `.env` via `dotenv` had to happen before `db.js`
  was imported at all — fixed by making that particular import dynamic
  (`await import(...)`) instead of static.
- [x] `DATABASE_URL` added to Vercel's project env vars and
  `DATABASE_URL`/`BRIGHTDATA_API_KEY` added as GitHub repository secrets
  (user's own dashboard steps, done 2026-08-22) — live site confirmed
  loading real data (`curl` status 200, 16 "Apply" links matching the
  known 9+7 job count).
- [x] **Manually triggered the scheduled workflow to verify it actually
  works with the real secrets, not just locally** — first run failed with
  `All attempts to open a WebSocket... failed` (Neon's serverless driver
  needs an explicit WebSocket implementation in Node.js; apparently masked
  in local dev by something in this machine's Node install, but a real,
  reproducible failure on GitHub's runner). Fixed by installing `ws` and
  setting `neonConfig.webSocketConstructor = ws` in `src/lib/db.js` —
  re-triggered the workflow via `gh workflow run`, watched it with
  `gh run watch`, confirmed a clean pass end-to-end using only the GitHub
  secrets (no local machine involved at all).

**Ideas raised but not acted on, worth remembering rather than losing —
none of these are hackathon requirements, all are legitimate post-hackathon
directions:**

- Full user accounts (login, persisted profile) so preferences and BYOK
  keys survive across devices/sessions — deliberately deferred, mainly
  because persisting a *visitor's own* Bright Data key server-side is a
  real security responsibility (encryption at rest, key management) that
  deserves more care than a hackathon deadline allows, not because the
  idea is bad.
- A much lighter version of the same idea: a "save for later" list scoped
  to the existing anonymous session (no login needed) — bookmark a job,
  come back and apply later. Proposed, never built or even logged until
  now.
- Extending one collector to visit per-job detail pages for full
  descriptions, so `skills`/`experience` aren't inferred from the title
  alone (Phase 4's honest limitation).
- Adding a source with genuine overlap with an existing one, so dedup
  fires on real data instead of only synthetic test cases (Phase 2's
  honest caveat).
- A pre-built Bright Data library source alongside the two custom ones,
  matching the two-data-layer design in this document's own Foundations
  section, which the actual build ended up not doing.

---

## Phase 5.7 — Cinematic hero + full atmospheric restyle

Not one of the original stages — the user was struck by micro1.ai's hero
(painterly dusk landscape, birds crossing the frame, bold minimal
headline) and wanted that aesthetic applied throughout, with the bird
motif reworked as the brand's own robin delivering opportunities. Chose a
full app restyle over a hero-only treatment; left the asset approach to
my judgment.

- [x] `src/components/Hero.js` — a full-bleed, code-drawn SVG landscape
  (layered mountain silhouettes, dusk gradient sky, horizon glow) with
  three birds drawn as simple stroked paths, animated via CSS keyframes
  (fly in, arc across, fade out, staggered so they pass occasionally
  rather than as a constant flock) — no external image or video asset,
  by design (see rationale in the Phase 5.7 plan this was built from).
  Sits above the existing feed on the same page, not a separate route —
  a judge still reaches real data by scrolling, not an extra click.
- [x] Every component (`Feed.js`, `JobCard.js`, `PreferencesForm.js`,
  `AddCompanyForm.js`, `RefreshButton.js`, `SourceStatusBanner.js`)
  recolored from the cream theme onto a dark atmospheric palette. No
  logic changed anywhere — purely presentational, verified with a live
  `/api/refresh` call afterward to confirm zero functional regression.
- **Real bug caught and fixed during this pass:** the header originally
  tried to reuse `public/robinscoutshorizontal.png` with a
  `brightness-0 invert` filter to turn it white for the dark background —
  this rendered as a solid white rectangle instead of the wordmark. Root
  cause: that PNG has no alpha channel (confirmed earlier this project,
  Phase 5.5's logo work), so `brightness-0` collapses the *entire* opaque
  canvas — logo shape and background alike — to black before `invert`
  flips it all to white; there's no transparency for the filter to
  isolate. Fixed by dropping the raster logo from the header entirely and
  using a plain two-tone text wordmark ("Robin" in off-white, "Scouts" in
  the brand orange) instead — matches the actual logo's own coloring,
  and is immune to this class of bug on any future background.
- [x] Verified with real screenshots at each step (same Playwright
  scratchpad setup used for every redesign this project) — confirmed the
  bird animation genuinely animates (caught two birds mid-flight at
  different positions across two screenshots taken 2.5s apart), and
  checked a mobile viewport (390px) to confirm the hero's headline wraps
  and the CTA stays usable — not previously checked for the light theme
  either, worth having done now.
- **Rejected by the user — corrected in Phase 5.8 below.** Two specific
  complaints: the hero should be the reference's actual layout (image
  forms the whole hero, text overlaid directly on it), not a headline
  block with a separate framed illustration underneath; and splitting the
  page into a light hero + dark app body was wrong — one theme should run
  the whole way down. Left as historical record of what didn't land and
  why, not deleted, since the code-drawn-SVG-vs-real-illustration
  reasoning in this section is still valid background for Phase 5.8.

---

## Phase 5.8 — Real illustrated hero, one theme end to end

Corrects Phase 5.7 per direct user feedback. The user supplied two real
painterly illustrations (`herorobin.png`, `herorobin2.png`) generated
externally and a wide illustrated logo lockup (`robinlogo.png`), all in
`public/`.

- [x] Chose `herorobin2.png` over `herorobin.png`: it has an actual robin
  (orange breast, unmistakably on-brand) perched close to the hiker with a
  path visually connecting them — literally embodies "a robin brings the
  opportunity." The other shows a distant hawk-like bird disconnected from
  the scene — a nice image, but the wrong bird and the wrong story.
- [x] `src/components/Hero.js` rebuilt as a true full-bleed hero:
  `herorobin2.png` fills the entire viewport height via `next/image`
  `fill` + `object-cover`, headline and CTA overlaid directly on top
  (matching the actual reference layout this was modeled on), with a
  radial gradient scrim anchored at the top-left corner — dark enough
  there for white text contrast, fully transparent by the image's
  lower-right — chosen specifically so neither the robin (lower-left) nor
  the hiker (lower-right) is covered by the scrim or the text block.
- [x] One field-journal design system now runs the entire page, not just
  the hero: warm paper background (`#f6efe0`), ink text, Fraunces
  (variable, soft axis) for display headings and job titles, Geist Mono
  for logged/meta details (timestamps, source tags), the brand ember
  orange as the one consistent accent. `Feed.js`, `JobCard.js`,
  `PreferencesForm.js`, `AddCompanyForm.js`, `RefreshButton.js`,
  `SourceStatusBanner.js` all recolored off the dark palette onto this —
  no more theme split partway down the page.
- [x] Job list redesigned, not just recolored: dropped the colored status
  dot, gave each row a Fraunces-set title (job titles are short enough
  that a serif stays scannable at list density), moved status labels and
  meta info to small mono tags consistent with the "field log" framing
  established in the hero and section heading ("Field log — What's new
  since you last looked").
- **Real bug caught and fixed during this pass:** removing the forced
  dark background from `page.js`'s wrapper (needed for the one-theme
  requirement) initially left the stats/filter strip transparent, which
  inherited the new light page background while its text colors were
  still tuned for the old dark section — nearly illegible. Caught via
  screenshot, not assumed away; fixed by giving that strip no reliance on
  inherited background at all now that the whole page shares one theme.
  Separately, the job list's `divide-y` rows rendered with a default
  near-black divider because a color was never explicitly set for it —
  inline styles can't reach the child-combinator selector `divide-y`
  relies on, so this needed an actual `divide-(--paper-line)` utility
  class, not a style prop. Both caught by screenshot before being called
  done, not left for the user to find.
- [x] Verified: full rebuild, live `/api/refresh` regression check,
  desktop and 390px mobile screenshots of the corrected hero.
- **Not yet done:** `robinlogo.png` (the wide illustrated logo lockup) is
  committed to the repo but not yet placed anywhere — a reasonable home
  is a section further down the page rather than the compact nav header,
  where its detail would be lost at that size.

---

## Phase 6 — Final: demo, README, submission

### Day-5 checkpoint (hard rule)

- [ ] By end of day 5, stop building new product features entirely. At minimum have: working custom source + visible break/heal/recover loop, real combined feed, second source integrated (if stable), dedup (if second source is in), basic change detection, a stable rehearsed demo dataset (don't rely on live sites cooperating during recording).
- [ ] From day 5 onward, only: fix demo-breaking bugs, tidy UI just enough for clarity, write the README, record and edit the demo video, test the repo from a clean clone, fill out the submission form.

### Demo script (~5–6 min video, one continuous story — not disconnected feature demos)

Revised 2026-08-20 evening to fold in the BYOK feature — it's now arguably
the headline beat, not an afterthought, so it gets its own step rather than
being tacked on at the end.

- [ ] 1. Enter preferences: entry-level backend roles, India or remote, Python/FastAPI.
- [ ] 2. Show the unified feed — one card from Onehouse (Lever), one from Sourcegraph (Greenhouse), clearly labeled, match % + "Shown because" reasons visible.
- [ ] 3. Point out a duplicate collapsed into one card ("Found on N sources") **if one genuinely exists in the demo dataset at record time** — don't fabricate one. If not, skip this beat rather than fake it; the rule is still explained in the README.
- [ ] 4. Show one **new** job and one **updated** job (with the specific field that changed).
- [ ] 5. **Add a company live**: paste a real Bright Data API key and a chosen career page URL into the toolbar, narrate the live step-by-step progress ("Reading the page…" → "Writing the scraper…" → "Testing it against the real page…"), show the new company land in the feed. *(Rehearse against this exact site beforehand — see Phase 5.5's honest caveat: AI generation can hit a schema mismatch or a backend timeout. Have this pre-tested and working before recording, and know what you'll say if it doesn't cooperate live.)*
- [ ] 6. Break the custom source's page layout on screen (the self-controlled mirror page, collector `c_mt18kiwd1rcsymt0tk`). *(Already rehearsed for real, both directions, 2026-08-20 evening — genuinely restructured the page, confirmed the collector broke, healed it, confirmed recovery, then reverted and healed back to baseline. Safe to do live.)*
- [ ] 7. Show the source-health warning — "0 valid jobs, required fields missing" — not a silent empty feed.
- [ ] 8. Run `bdata scraper heal <collector_id> "<description>" --url <verify-url> --auto-approve --auto-save`.
- [ ] 9. Re-run the collector, show the same Collector ID returning jobs again, recovered **inside the same feed**.
- [ ] 10. Close with the product statement below.

### Product statement (for README + video close)

> RobinScouts is a hiring-change intelligence feed. It watches public job sources, tells job seekers what's new or changed since they last checked, explains why a job matches them, and keeps working when a source website changes its layout — using a custom Bright Data Scraper Studio scraper at its core.

### README checklist (final)

- [x] Setup instructions a stranger can follow from a clean clone — **actually tested 2026-08-20** via a fresh `git clone` into a scratch directory, not just assumed: found and fixed a real bug in the process (`postinstall` script was missing, so `npm install` alone never generated the Prisma client — `npx prisma migrate dev` doesn't reliably do it either on this setup). Added `"postinstall": "prisma generate"` to `package.json`; re-verified the clone builds and serves the homepage correctly afterward.
- [x] Clear explanation of how Scraper Studio is used (custom scraper role vs. library role — library role still TBD until Phase 2)
- [x] Example structured output (a sample normalized job JSON) — `example-output.json`, two real records from the live database.
- [ ] Demo video link
- [x] AI-assistant disclosure (Claude Code used, all code/architecture reviewed and understood)
- [x] Explain the dedup rule, the change-detection rule, and the matching rule weights in plain language — done, see README's "How deduplication, change detection, and matching work" section
- [x] Self-service "add a company" (BYOK) explained in the README, with the honest reliability caveat included, not hidden.
