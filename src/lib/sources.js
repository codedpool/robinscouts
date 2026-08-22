export const SOURCES = {
  "onehouse-lever-custom": {
    label: "Onehouse (custom Scraper Studio scraper)",
    shortLabel: "Lever",
    kind: "custom",
    collectorId: "c_msz1d5ly1aja1gxcbg",
    url: "https://jobs.lever.co/Onehouse",
    company: "Onehouse",
  },
  "sourcegraph-greenhouse-custom": {
    label: "Sourcegraph (custom Scraper Studio scraper)",
    shortLabel: "Greenhouse",
    kind: "custom",
    collectorId: "c_mt0i5k70qvn77jqk4",
    url: "https://job-boards.greenhouse.io/sourcegraph91",
    company: "Sourcegraph",
  },
  // Self-controlled test fixture (docs/mirror/index.html, hosted on GitHub
  // Pages) — wired in as a real third source specifically so a genuine
  // structural break + Scraper Studio self-heal against it is visible in
  // this feed (SourceStatusBanner, jobs disappearing/reappearing), not
  // just a terminal-only demo.
  "robintest-mirror-fixture": {
    label: "RobinTest (self-heal test fixture)",
    shortLabel: "Fixture",
    kind: "custom",
    collectorId: "c_mt18kiwd1rcsymt0tk",
    url: "https://codedpool.github.io/robinscouts/mirror/",
    company: "RobinTest",
  },
};
