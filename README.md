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

Not built yet: deduplication across sources, change detection
(new/updated/possibly-closed), and rule-based match scoring. These are next.

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
