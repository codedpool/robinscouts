# RobinScouts

A hiring-change intelligence feed. RobinScouts watches public job sources and
tells you what's new or changed since you last checked — not just "here are
some jobs." Built for the **Into the Scrape-Verse** hackathon (WeMakeDevs ×
Bright Data).

This is a work in progress and will keep evolving as the hackathon
progresses. This README covers what's built so far.

## What's built so far

- A custom **Bright Data Scraper Studio** scraper for [Onehouse's careers
  page](https://jobs.lever.co/Onehouse) (a Lever-hosted job board, not
  covered by Bright Data's pre-built library).
- A Next.js app that runs that scraper on demand, normalizes the results
  into a common job schema, and stores them in SQLite.
- A feed page showing the live, real jobs pulled from that scraper.
- Source health tracking: if a scrape run comes back with 0 valid jobs, the
  feed shows a visible "source unhealthy" warning instead of silently going
  empty, and keeps showing the last known-good data.

Not built yet: a second (library) source, deduplication, change detection
(new/updated/possibly-closed), and rule-based match scoring. These are next.

## Tech stack

- **Next.js** (App Router, JavaScript) — single codebase for UI + API routes,
  no separate backend service.
- **SQLite via Prisma** for storage.
- **Bright Data CLI** (`bdata`), invoked via Node's `child_process`, to run
  the Scraper Studio collector.
- **Tailwind** for styling.

## How the custom Scraper Studio scraper is used

The collector (`c_msz1d5ly1aja1gxcbg`) targets `https://jobs.lever.co/Onehouse`,
Onehouse's public careers listing page. Its parser reads every job card on
that page (title, location, employment type/commitment, and the application
link) and returns them as a list. It also has a fallback branch that can
parse a single Lever job *detail* page if given one instead of a listing
page.

The app calls it with:

```bash
bdata scraper run c_msz1d5ly1aja1gxcbg https://jobs.lever.co/Onehouse --json
```

via `src/lib/scraper.js`, and normalizes each returned record into the
shared job schema in `src/lib/normalize.js` before saving it.

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
