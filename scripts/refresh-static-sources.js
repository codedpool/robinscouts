// Scheduled maintenance script (run via GitHub Actions, see
// .github/workflows/refresh-static-sources.yml) that re-syncs the two
// built-in sources against the shared production database, using this
// project's own Bright Data key from BRIGHTDATA_API_KEY — never a
// visitor's. This exists because the deployed app itself can't do this:
// Vercel's serverless functions can't run the bdata CLI or hold a logged-in
// CLI session, so "Check for new jobs" only works locally. Reuses the exact
// same refreshOneSource logic the app uses for everything else — no
// separate/duplicated scraping or normalization code.
import { config as loadEnv } from "dotenv";
// Loads .env for local runs; silently does nothing in CI, where
// DATABASE_URL / BRIGHTDATA_API_KEY are already real env vars from
// GitHub Actions secrets rather than a checked-in file.
loadEnv({ quiet: true });

// Dynamic imports, not static ones: db.js reads process.env.DATABASE_URL at
// module-evaluation time, and ES modules evaluate all static imports before
// the importing module's own top-level code runs — so a static import here
// would read DATABASE_URL before loadEnv() above ever had a chance to set it.
const { prisma } = await import("../src/lib/db.js");
const { refreshOneSource } = await import("../src/lib/refreshSource.js");
const { SOURCES } = await import("../src/lib/sources.js");

const apiKey = process.env.BRIGHTDATA_API_KEY;

if (!apiKey) {
  console.error("BRIGHTDATA_API_KEY is not set — refusing to run.");
  process.exit(1);
}

let hadFailure = false;

for (const [sourceKey, sourceConfig] of Object.entries(SOURCES)) {
  try {
    const result = await refreshOneSource(sourceKey, sourceConfig, { sessionId: null, apiKey });
    console.log(sourceKey, JSON.stringify(result));
    if (!result.ok) hadFailure = true;
  } catch (err) {
    hadFailure = true;
    console.error(sourceKey, "threw:", err.message);
  }
}

await prisma.$disconnect();
process.exit(hadFailure ? 1 : 0);
