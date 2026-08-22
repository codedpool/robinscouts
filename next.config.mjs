/** @type {import('next').NextConfig} */
const nextConfig = {
  // src/lib/scraper.js spawns @brightdata/cli's dist/index.js directly
  // (node <script>, not the bare `bdata` command) so it doesn't depend on
  // node_modules/.bin being on PATH in the deployed function. But that
  // script eagerly requires every CLI subcommand module at load time
  // (confirmed by reading dist/index.js), including ones this app never
  // calls (`init`, `add-mcp`) that pull in playwright-core, @inquirer/*,
  // @clack/*, etc. Output File Tracing can't see any of this — the CLI
  // script is referenced by path, passed to child_process, never
  // require()'d/import()'d by this code — so without an explicit include
  // it's silently dropped from the deployed function, which is exactly
  // what caused "bdata: command not found" in production.
  //
  // This list is the full transitive dependency closure of
  // @brightdata/cli, computed by walking package.json dependencies from
  // disk (not guessed) — see the verification steps that produced it.
  outputFileTracingIncludes: {
    "/api/*": [
      "node_modules/@brightdata/cli/**/*",
      "node_modules/@clack/core/**/*",
      "node_modules/@clack/prompts/**/*",
      "node_modules/@inquirer/ansi/**/*",
      "node_modules/@inquirer/checkbox/**/*",
      "node_modules/@inquirer/confirm/**/*",
      "node_modules/@inquirer/core/**/*",
      "node_modules/@inquirer/editor/**/*",
      "node_modules/@inquirer/expand/**/*",
      "node_modules/@inquirer/external-editor/**/*",
      "node_modules/@inquirer/figures/**/*",
      "node_modules/@inquirer/input/**/*",
      "node_modules/@inquirer/number/**/*",
      "node_modules/@inquirer/password/**/*",
      "node_modules/@inquirer/prompts/**/*",
      "node_modules/@inquirer/rawlist/**/*",
      "node_modules/@inquirer/search/**/*",
      "node_modules/@inquirer/select/**/*",
      "node_modules/@inquirer/type/**/*",
      "node_modules/bundle-name/**/*",
      "node_modules/chardet/**/*",
      "node_modules/cli-width/**/*",
      "node_modules/commander/**/*",
      "node_modules/default-browser/**/*",
      "node_modules/default-browser-id/**/*",
      "node_modules/define-lazy-prop/**/*",
      "node_modules/fast-string-truncated-width/**/*",
      "node_modules/fast-string-width/**/*",
      "node_modules/fast-wrap-ansi/**/*",
      "node_modules/iconv-lite/**/*",
      "node_modules/is-docker/**/*",
      "node_modules/is-in-ssh/**/*",
      "node_modules/is-inside-container/**/*",
      "node_modules/is-wsl/**/*",
      "node_modules/mute-stream/**/*",
      "node_modules/open/**/*",
      "node_modules/picocolors/**/*",
      "node_modules/playwright-core/**/*",
      "node_modules/powershell-utils/**/*",
      "node_modules/run-applescript/**/*",
      "node_modules/safer-buffer/**/*",
      "node_modules/signal-exit/**/*",
      "node_modules/sisteransi/**/*",
      "node_modules/wsl-utils/**/*",
      "node_modules/xdg-basedir/**/*",
    ],
  },
};

export default nextConfig;
