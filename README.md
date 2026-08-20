# RobinScouts

A hiring-change intelligence feed. RobinScouts watches public job sources and
tells you what's new or changed since you last checked — not just "here are
some jobs." Built for the **Into the Scrape-Verse** hackathon (WeMakeDevs ×
Bright Data).

This is a work in progress and will keep evolving as the hackathon
progresses. This README covers what's built so far.

## What's built so far

- Two custom **Bright Data Scraper Studio** scrapers, on two different ATS
  platforms, both normalized into the same schema:
  - [Onehouse's careers page](https://jobs.lever.co/Onehouse) (Lever-hosted)
  - [Sourcegraph's careers page](https://job-boards.greenhouse.io/sourcegraph91) (Greenhouse-hosted)

  Neither is covered by Bright Data's pre-built scraper library — that only
  covers the big aggregator boards (LinkedIn, Indeed, Glassdoor), not
  individual company career pages.
- A Next.js app that runs both scrapers on demand, normalizes the results
  into a common job schema, and stores them in SQLite.
- A feed page showing the live, real jobs pulled from both scrapers,
  labeled by source.
- Source health tracking: if a scrape run comes back with 0 valid jobs, the
  feed shows a visible "source unhealthy" warning instead of silently going
  empty, and keeps showing the last known-good data.
- A [self-controlled test fixture](docs/mirror/) hosted on GitHub Pages at
  https://codedpool.github.io/robinscouts/mirror/, used to demonstrate a
  genuine — not staged — self-heal: we can actually edit that page's HTML
  structure and watch Scraper Studio heal against a real change, rather
  than just telling the AI to pretend something broke.
- Deduplication across sources, full new/updated/possibly-closed change
  detection, and deterministic rule-based match scoring with a "Shown
  because" explanation — see below for how each works.
- Per-company hiring-activity summaries ("Onehouse posted 9 roles this
  week, 7 match your profile"), based on our own `firstSeenAt` tracking
  rather than a fabricated real posting date.

Not built yet: the on-camera self-heal recording and the example
structured output file — these are next.

## Tech stack

- **Next.js** (App Router, JavaScript) — single codebase for UI + API routes,
  no separate backend service.
- **SQLite via Prisma** for storage.
- **Bright Data CLI** (`bdata`), invoked via Node's `child_process`, to run
  the Scraper Studio collector.
- **Tailwind** for styling.

## How the custom Scraper Studio scrapers are used

Two collectors, same normalized schema, two different ATS structures:

- **Onehouse** (`c_msz1d5ly1aja1gxcbg`) — targets
  `https://jobs.lever.co/Onehouse`. Its parser reads every job card on the
  listing page (title, location, employment type, application link), with a
  fallback branch that can also parse a single Lever job *detail* page if
  given one instead.
- **Sourcegraph** (`c_mt0i5k70qvn77jqk4`) — targets
  `https://job-boards.greenhouse.io/sourcegraph91`, a Greenhouse-hosted page
  with a completely different DOM structure than Lever's. Its parser also
  filters out a generic "Join our Talent Community" CTA that Greenhouse
  mixes into listings — it looks like a job card in the DOM, but isn't one.

The app calls each with:

```bash
bdata scraper run <collector_id> <url> --json
```

via `src/lib/scraper.js` (`runCollector`), and normalizes each returned
record into the shared job schema in `src/lib/normalize.js`
(`normalizeJobPosting`) before saving it. Both sources are configured in
`src/lib/sources.js`.

When a source's target changes shape, we heal the collector in place —
same Collector ID, updated parser — entirely from the CLI:

```bash
bdata scraper heal <collector_id> "<what changed>" --url <verify-url> --auto-approve --auto-save
```

`--auto-approve --auto-save` publishes the fix straight to production, no
manual step. We also keep a
[self-controlled test page](docs/mirror/index.html) (served via GitHub
Pages) specifically so this can be demonstrated against a real structural
change we make ourselves, not a simulated one — since the real target
sites won't conveniently redesign themselves on demand.

## How deduplication, change detection, and matching work

**Deduplication** (`src/lib/dedup.js`): two jobs are treated as the same
posting if they have the same `company` (case-insensitive), a similar
title, and at least one matching location. "Similar" is Jaccard token
overlap (shared words ÷ total unique words across both titles) at a 0.8
threshold — deliberately *not* "shorter title's words are a subset of the
longer one", because that scores "Backend Engineer" and "Backend Engineer
II" as a perfect match. Jaccard correctly keeps those separate (0.667,
below threshold) while still catching exact duplicates (1.0). When a match
is found, the newer job is linked to the older one via `duplicateOfId` and
hidden from the main feed; the canonical card shows "Found on N sources."
Note: our current two sources (Onehouse, Sourcegraph) are different
companies, so this logic is real and tested but hasn't fired on live
overlapping data yet — only on synthetic test cases.

**Change detection** (`src/app/api/refresh/route.js`): every job is
matched across runs by its `applicationUrl`. A content hash (title +
location + employment type) determines **New** (no prior match) vs.
**Updated** (hash differs — the specific field that changed is stored and
shown, not just "something changed") vs. **unchanged**. A job missing from
a *healthy* run is flagged internally on the first miss but stays visible;
it only becomes **Possibly closed** after a second consecutive healthy run
still doesn't see it — and this logic never runs at all off the back of a
failed/unhealthy scrape, so a broken source can't falsely mark jobs closed.

**Matching** (`src/lib/matching.js`): fully deterministic, no LLM call in
the scoring path — same job and same preferences always produce the same
score and the same explanation.

```
skill overlap:     up to 50 pts (proportional to matched skills / preferred skills)
location match:    25 pts (remote or specified location matches)
experience fit:    15 pts (job's experience range overlaps preference)
title match:       10 pts (role keyword match in normalized title)
```

The "Shown because" bullets on each card are generated directly from which
rules fired. One honest limitation: neither collector extracts full job
descriptions, so `skills` and `experience` are inferred from the job
**title only** (a known-skills keyword list, and senior/staff/lead vs.
junior/entry/graduate patterns) — deterministic, but shallower than
full-text extraction would be.

## Setup

Requires Node.js and the [Bright Data CLI](https://github.com/brightdata/cli)
(`npm i -g @brightdata/cli`, then `bdata login`) authenticated with access to
the collector above.

```bash
git clone https://github.com/codedpool/robinscouts.git
cd robinscouts
npm install

# create .env with:
# DATABASE_URL="file:./dev.db"

npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click "Check for
new jobs" to run the scraper and populate the feed.

## Example structured output

Coming soon, once the normalized schema settles further.

## Demo video

Coming soon, once more of the product is built.

## AI-assistant disclosure

This project was built with the help of [Claude
Code](https://claude.com/claude-code). All code and architectural decisions
were reviewed and are understood by the author.
