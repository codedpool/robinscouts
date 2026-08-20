import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// child_process's shell:true (required on Windows to run the bdata.cmd
// shim at all) is documented to escape array args for the shell, but that
// escaping is unreliable in practice for multi-word arguments on Windows —
// confirmed by direct repro: a plain multi-word string passed as one array
// element arrived at the child process split into one argv entry per word.
// Manually quoting every argument ourselves fixes it (verified the same
// way), and is a no-op for simple single-token args like a collector id.
function quoteArg(value) {
  const str = String(value);
  return process.platform === "win32" ? `"${str.replace(/"/g, '\\"')}"` : str;
}

// Node's child_process error messages for a non-zero exit or timeout are
// prefixed with "Command failed: <full command line>" — which would
// include a raw -k <apiKey> verbatim if left unredacted. Every error path
// below routes through this before it can reach a thrown Error, an
// in-memory job record, or SourceStatus.lastError in the database.
function redact(message, apiKey) {
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
    const { stdout } = await execFileAsync("bdata", args.map(quoteArg), {
      shell: true,
      timeout: 180_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    throw new Error(redact(String(err?.message || err), apiKey));
  }
}

const STEP_LINE = /^Step: (\S+)/;

// Builds a brand-new Scraper Studio collector from a natural-language prompt
// against a live URL, using the caller's own Bright Data API key. Unlike
// runCollector, this can take several minutes (AI codegen + preview), so it
// uses spawn instead of execFile to stream stdout line-by-line and report
// progress via onStep as named pipeline stages complete (e.g.
// "code_generator", "preview_runner") rather than leaving the caller with a
// blank wait.
export function createCollector(url, prompt, { apiKey, name, onStep } = {}) {
  return new Promise((resolve, reject) => {
    const args = apiKey ? ["-k", apiKey] : [];
    args.push("scraper", "create", url, prompt, "--json");
    if (name) args.push("--name", name);

    const child = spawn("bdata", args.map(quoteArg), { shell: true });

    let stdout = "";
    let stderrBuffer = "";
    let lastStderrLine = "";

    // The final --json envelope is the only thing bdata ever writes to
    // stdout; all human-readable progress ("Step: code_generator — polling
    // ...") goes to stderr instead, specifically so stdout stays pure JSON.
    // Confirmed by reading @brightdata/cli's own source rather than
    // assuming — it uses console.error for every "Step:" line and
    // process.stdout.write only for the final print().
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderrBuffer += chunk;
      const lines = stderrBuffer.split("\n");
      stderrBuffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        lastStderrLine = trimmed;
        const match = STEP_LINE.exec(trimmed);
        if (match && onStep) onStep(match[1]);
      }
    });

    child.on("error", (err) => reject(new Error(redact(String(err?.message || err), apiKey))));

    child.on("close", (code) => {
      if (code !== 0) {
        // The final stderr line is the real failure summary (e.g. "Timeout
        // after 600 seconds..." or "Failed to trigger scraper..."); the
        // hundreds of "Step: X — polling" lines before it aren't useful in
        // a UI error message.
        const message = lastStderrLine || `bdata scraper create exited with code ${code}`;
        reject(new Error(redact(message, apiKey)));
        return;
      }
      try {
        const lastLine = stdout.trim().split("\n").pop();
        resolve(JSON.parse(lastLine));
      } catch {
        reject(new Error("Could not parse bdata scraper create output"));
      }
    });
  });
}
