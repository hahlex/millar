#!/usr/bin/env node
/**
 * Idempotent topological npm publisher for all 8 Millar packages.
 * Uses `pnpm publish` so `workspace:*` protocols resolve cleanly to exact versions,
 * and automatically skips any package@version already published on npm.
 *
 * Usage:
 *   node scripts/publish-npm.mjs --tag=draft --dry-run
 *   node scripts/publish-npm.mjs --tag=draft
 *   node scripts/publish-npm.mjs --tag=draft --otp=123456
 *   node scripts/publish-npm.mjs --tag=draft --only=validator,mcp,cli
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const tagArg = args.find((a) => a.startsWith("--tag="));
const distTag = tagArg ? tagArg.slice("--tag=".length) : "draft";
const otpArg = args.find((a) => a.startsWith("--otp="));
const otp = otpArg ? otpArg.slice("--otp=".length) : "";
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlySet = onlyArg
  ? new Set(
      onlyArg
        .slice("--only=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
  : null;

if (!/^[a-z0-9][a-z0-9.-]*$/i.test(distTag)) {
  console.error(`Invalid dist-tag: ${distTag}`);
  process.exit(1);
}
if (otp && !/^\d{6,8}$/.test(otp)) {
  console.error("Invalid --otp value (expected 6-8 digits).");
  process.exit(1);
}

const PACKAGES_IN_ORDER = [
  "packages/core",
  "packages/tokens",
  "packages/validator",
  "packages/ui",
  "packages/domain-education",
  "packages/marketing",
  "packages/mcp",
  "packages/cli",
];

function isAlreadyPublished(pkgName, version) {
  const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
  const check = spawnSync(npmBin, ["view", `${pkgName}@${version}`, "version"], {
    encoding: "utf8",
    stdio: "pipe",
    shell: process.platform === "win32",
  });
  return check.status === 0 && check.stdout.trim() === version;
}

const rootDir = process.cwd();
console.log(`Millar npm publish pipeline | tag=${distTag} | dryRun=${dryRun}`);

let publishedCount = 0;
let skippedCount = 0;

for (const rel of PACKAGES_IN_ORDER) {
  const shortKey = path.basename(rel);
  if (onlySet && !onlySet.has(shortKey) && !onlySet.has(rel)) {
    continue;
  }

  const pkgDir = path.join(rootDir, rel);
  const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
  const spec = `${pkgJson.name}@${pkgJson.version}`;

  if (!dryRun && isAlreadyPublished(pkgJson.name, pkgJson.version)) {
    console.log(`\n---> [SKIP] ${spec} is already published on npm.`);
    skippedCount++;
    continue;
  }

  const otpFlag = otp ? ` --otp=${otp}` : "";
  const cmd = `pnpm publish --access public --tag ${distTag} --no-git-checks${otpFlag}${dryRun ? " --dry-run" : ""}`;
  console.log(`\n---> ${dryRun ? "[DRY-RUN] " : ""}Publishing ${spec} (${rel})...`);
  execSync(cmd, { cwd: pkgDir, stdio: "inherit" });
  publishedCount++;
}

console.log(
  `\nPASS: ${dryRun ? "Dry-run verified" : "Published"} ${publishedCount} package(s), skipped ${skippedCount} already-published package(s) (tag: ${distTag}).`,
);
