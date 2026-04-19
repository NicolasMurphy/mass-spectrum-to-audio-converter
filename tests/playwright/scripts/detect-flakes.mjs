// Flake detector for the Playwright suite.
//
// Runs the selected tests N times with retries disabled, collects the JSON
// report, and classifies each test as:
//   - Clean:  passed every run
//   - Flaky:  passed sometimes, failed sometimes  (the thing we're hunting)
//   - Broken: failed every run                    (not flaky, just red)
//
// Usage (from tests/playwright/):
//   npm run detect-flakes
//   npm run detect-flakes -- audio-settings.spec.ts
//   npm run detect-flakes -- audio-settings.spec.ts --repeat=50
//   npm run detect-flakes -- -g "duration exactly 0.01" --repeat=100
//   npm run detect-flakes -- --project=chromium --repeat=20
//
// Any args other than --repeat=N are forwarded to `playwright test` verbatim,
// so spec names, -g filters, --project selectors, etc. all work.
//
// Exit codes: 0 = all clean, 1 = flaky or broken tests found, 2 = script error.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const playwrightDir = join(__dirname, "..");
const reportFile = join(playwrightDir, "flake-report.json");

// ---- arg parsing --------------------------------------------------------
// Extract --repeat=N; forward everything else to Playwright verbatim.
const allArgs = process.argv.slice(2);
const repeatArg = allArgs.find((a) => a.startsWith("--repeat="));
const repeat = repeatArg ? Number(repeatArg.split("=")[1]) : 10;
if (!Number.isFinite(repeat) || repeat < 1) {
  console.error(`Invalid --repeat value: ${repeatArg}`);
  process.exit(2);
}
const passthroughArgs = allArgs.filter((a) => a !== repeatArg);

// ---- run playwright -----------------------------------------------------
// Clear any stale report so we can't misread a previous run's output.
if (existsSync(reportFile)) unlinkSync(reportFile);

const target = passthroughArgs.length ? passthroughArgs.join(" ") : "full suite";
console.log(`\nRunning ${target} ${repeat}x with retries=0`);
console.log(`(live progress below; summary at the end)\n`);

const result = spawnSync(
  "npx",
  [
    "playwright",
    "test",
    ...passthroughArgs,
    `--repeat-each=${repeat}`,
    "--retries=0",
    "--reporter=list,json",
  ],
  {
    cwd: playwrightDir,
    stdio: ["inherit", "inherit", "inherit"],
    env: {
      ...process.env,
      PLAYWRIGHT_JSON_OUTPUT_FILE: reportFile,
    },
  }
);

if (result.error) {
  console.error(`\nFailed to invoke playwright: ${result.error.message}`);
  process.exit(2);
}

if (!existsSync(reportFile)) {
  console.error(
    `\nNo JSON report produced at ${reportFile}.` +
      ` Playwright likely failed before any tests ran.`
  );
  process.exit(2);
}

// ---- parse & aggregate --------------------------------------------------
let report;
try {
  report = JSON.parse(readFileSync(reportFile, "utf8"));
} catch (err) {
  console.error(
    `\nReport file exists but is malformed (${err.message}).` +
      ` Playwright may have crashed mid-write.`
  );
  process.exit(2);
}

const results = new Map();

function walk(suite, fileFallback = "unknown") {
  const file = suite.file ?? fileFallback;
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const key = `${file} > ${spec.title} [${t.projectName ?? "?"}]`;
      const r = results.get(key) ?? { pass: 0, fail: 0 };
      for (const res of t.results ?? []) {
        if (res.status === "passed") r.pass++;
        else if (res.status === "skipped" || res.status === "interrupted") continue;
        else r.fail++;
      }
      if (r.pass > 0 || r.fail > 0) results.set(key, r);
    }
  }
  for (const sub of suite.suites ?? []) walk(sub, file);
}

for (const suite of report.suites ?? []) walk(suite, suite.file);

// ---- classify -----------------------------------------------------------
const flakes = [...results.entries()]
  .filter(([, r]) => r.pass > 0 && r.fail > 0)
  .sort(
    ([, a], [, b]) =>
      a.pass / (a.pass + a.fail) - b.pass / (b.pass + b.fail)
  );

const broken = [...results.entries()].filter(
  ([, r]) => r.pass === 0 && r.fail > 0
);

// ---- report -------------------------------------------------------------
const totalRuns = [...results.values()].reduce(
  (sum, r) => sum + r.pass + r.fail,
  0
);
const clean = results.size - flakes.length - broken.length;
const bar = "-".repeat(60);
console.log(`\n${bar}`);
console.log(
  `Ran ${results.size} (test x project) tuples, ${repeat} repeats each -> ${totalRuns} total runs`
);
console.log(`  clean: ${clean}   flaky: ${flakes.length}   broken: ${broken.length}`);
console.log(`${bar}\n`);

if (broken.length) {
  console.log(`Broken -- failed every run (${broken.length}):\n`);
  for (const [t, { fail }] of broken) {
    console.log(`  0/${fail}  ${t}`);
  }
  console.log();
}

if (flakes.length) {
  console.log(`Flaky -- passed sometimes, failed sometimes (${flakes.length}):\n`);
  for (const [t, { pass, fail }] of flakes) {
    const total = pass + fail;
    const rate = ((pass / total) * 100).toFixed(0).padStart(3);
    console.log(`  ${rate}% (${pass}/${total})  ${t}`);
  }
  console.log();
}

const anyIssues = flakes.length > 0 || broken.length > 0;
if (!anyIssues) console.log("No flaky or broken tests detected.\n");
process.exit(anyIssues ? 1 : 0);
