import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

// Resolve the CLI's actual script rather than shelling out to the bare
// `bdata` command. The bare command relies on `node_modules/.bin/bdata`
// (a shim) being resolvable on PATH, which holds locally (npm puts
// node_modules/.bin on PATH for npm scripts) but does NOT hold on Vercel's
// serverless functions — confirmed empirically in production ("bdata:
// command not found") even though the exact same code works in dev.
// Invoking `node <resolved bin script>` directly sidesteps PATH/shim
// resolution entirely, so it works the same way in both environments.
//
// A plain, static relative path (not require.resolve) on purpose: Next.js's
// Turbopack build hands module code a `require` whose `.resolve()` returns
// an internal numeric module id during page-data collection, not a real
// file path — confirmed by a real build failure ("path argument must be of
// type string, received type number") before switching to this.
const CLI_BIN = path.join(process.cwd(), "node_modules/@brightdata/cli/dist/index.js");

// Node's child_process error messages for a non-zero exit or timeout are
// prefixed with "Command failed: <full command line>" — which would
// include a raw -k <apiKey> verbatim if left unredacted. Every error path
// below routes through this before it can reach a thrown Error, an
// in-memory job record, or SourceStatus.lastError in the database.
export function redact(message, apiKey) {
  if (!apiKey) return message;
  return message.split(apiKey).join("[REDACTED]");
}

// Runs a Bright Data Scraper Studio collector via the `bdata` CLI and returns
// the parsed result array. Entries can either be job records or
// { error, error_code } objects when a crawl failed for that input URL.
//
// apiKey is optional: when passed, it's given via `-k` which overrides auth
// for this single invocation only (confirmed empirically — a bogus key
// still fails with a clean 401, it never silently falls back to whatever
// account `bdata login` is authenticated as). Omitting it keeps the exact
// prior behavior for the two built-in sources, which rely on that logged-in
// session.
export async function runCollector(collectorId, url, apiKey) {
  const args = apiKey ? ["-k", apiKey] : [];
  args.push("scraper", "run", collectorId, url, "--json");
  try {
    const { stdout } = await execFileAsync(process.execPath, [CLI_BIN, ...args], {
      timeout: 180_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    throw new Error(redact(String(err?.message || err), apiKey));
  }
}

const BRIGHTDATA_API_URL = "https://api.brightdata.com";

async function brightDataRequest(apiKey, method, endpoint, body) {
  const res = await fetch(`${BRIGHTDATA_API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Bright Data API error (${res.status}): ${detail || res.statusText}`);
  }
  return res.json();
}

// Builds a brand-new Scraper Studio collector from a natural-language
// prompt against a live URL, using the caller's own Bright Data API key.
//
// This used to shell out to `bdata scraper create`, which blocks
// internally for up to 10 minutes polling Bright Data's own AI-generation
// pipeline to finish — fine for a CLI, fatal for a single serverless
// function invocation. Confirmed empirically: deployed as-was, the job
// silently never progressed past "running" at all, for over 3 minutes,
// with zero step updates (locally the first step appears within seconds).
//
// The fix is to decompose what the CLI does internally (read from its own
// source, not guessed) into two pieces that fit serverless naturally:
//   1. triggerScraperCreation — two quick REST calls (create a collector
//      template, then trigger AI generation against it). Both return
//      almost immediately; the actual multi-minute codegen happens
//      entirely on Bright Data's side afterward.
//   2. checkScraperCreationProgress — one quick REST call that checks
//      how far that generation has gotten. The caller re-invokes this
//      once per status poll instead of blocking in a loop, so progress
//      persists on Bright Data's own servers rather than needing this
//      process to stay alive between checks.
export async function triggerScraperCreation(url, description, apiKey, name) {
  const template = await brightDataRequest(apiKey, "POST", "/dca/collector", {
    name,
    deliver: {
      type: "webhook",
      endpoint: "https://example.com/webhook",
      filename: { template: "data", extension: "json" },
    },
  });
  if (!template.id) {
    throw new Error("Bright Data did not return a collector id.");
  }

  await brightDataRequest(apiKey, "POST", `/dca/collectors/${template.id}/automate_template`, {
    description,
    urls: [url],
  });

  return { collectorId: template.id };
}

const TERMINAL_FAIL_STATUSES = ["failed", "error", "cancelled"];

export async function checkScraperCreationProgress(collectorId, apiKey) {
  const progress = await brightDataRequest(
    apiKey,
    "GET",
    `/dca/collectors/${collectorId}/automate_template/progress`
  );
  if (progress.status === "done") {
    return { done: true, step: progress.step || null };
  }
  if (TERMINAL_FAIL_STATUSES.includes(progress.status)) {
    throw new Error(`AI generation finished with status "${progress.status}".`);
  }
  return { done: false, step: progress.step || null };
}
