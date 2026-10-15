#!/usr/bin/env node
// Safe OTA publish: refuses to run `eas update` unless the code being published
// is committed, pushed to GitHub, and newer than what is already live.
//
// Usage: npm run ota -- "Short description of the change"

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BRANCH = "production";
const ROOT = path.join(__dirname, "..");

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fail(msg) {
  console.error(`\n✖ OTA publish blocked: ${msg}\n`);
  process.exit(1);
}

const description = process.argv.slice(2).join(" ").trim();
if (!description) fail('missing message. Usage: npm run ota -- "What changed"');

// 1. No uncommitted or untracked changes
const dirty = sh("git status --porcelain");
if (dirty) fail(`uncommitted changes — commit them first:\n${dirty}`);

// 2. HEAD is pushed to its upstream
sh("git fetch --quiet");
let upstream;
try {
  upstream = sh("git rev-parse --abbrev-ref --symbolic-full-name @{u}");
} catch {
  fail("current branch has no upstream — push it with `git push -u origin <branch>`");
}
const unpushed = sh(`git rev-list ${upstream}..HEAD`);
if (unpushed) fail(`${unpushed.split("\n").length} commit(s) not pushed to ${upstream} — run \`git push\``);

// 3. OTA_VERSION is newer than the latest published update on this runtime
const otaFile = fs.readFileSync(path.join(ROOT, "constants/otaVersion.js"), "utf8");
const local = (otaFile.match(/OTA_VERSION\s*=\s*'([^']+)'/) || [])[1];
if (!local) fail("could not read OTA_VERSION from constants/otaVersion.js");

const appVersion = require(path.join(ROOT, "app.json")).expo.version;
const list = JSON.parse(
  sh(`npx eas-cli update:list --branch ${BRANCH} --json --non-interactive --limit 50`)
);
const live = (list.currentPage || [])
  .filter((u) => u.runtimeVersion === appVersion)
  .map((u) => (u.message.match(/\(v(\d{4}-\d{2}-\d{2}\.\d+)/) || [])[1])
  .find(Boolean);

const toKey = (v) => v.split(/[-.]/).map(Number);
const newer = (a, b) => {
  const [x, y] = [toKey(a), toKey(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return false;
};
if (live && !newer(local, live)) {
  fail(
    `OTA_VERSION ${local} is not newer than live ${live} on runtime ${appVersion}.\n` +
      "  Publishing would roll users back. Bump constants/otaVersion.js (and commit + push)."
  );
}

const message = `${description} (v${local})`;
console.log(`✔ Checks passed — publishing "${message}" to ${BRANCH} (runtime ${appVersion})\n`);
const res = spawnSync("npx", ["eas-cli", "update", "--branch", BRANCH, "--message", message], {
  cwd: ROOT,
  stdio: "inherit",
});
process.exit(res.status ?? 1);
