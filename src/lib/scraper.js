import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Runs a Bright Data Scraper Studio collector via the `bdata` CLI and returns
// the parsed result array. Entries can either be job records or
// { error, error_code } objects when a crawl failed for that input URL.
export async function runCollector(collectorId, url) {
  const { stdout } = await execFileAsync(
    "bdata",
    ["scraper", "run", collectorId, url, "--json"],
    { shell: true, timeout: 180_000, maxBuffer: 10 * 1024 * 1024 }
  );
  const parsed = JSON.parse(stdout);
  return Array.isArray(parsed) ? parsed : [parsed];
}
