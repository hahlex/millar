#!/usr/bin/env node
/**
 * Topological npm publisher for all 7 @hahlex/millar-* packages.
 * Uses `pnpm publish` so `workspace:*` protocols resolve cleanly to exact versions.
 *
 * Usage:
 *   node scripts/publish-npm.mjs --tag=draft --dry-run
 *   node scripts/publish-npm.mjs --tag=draft
 */
import { execSync } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const tagArg = args.find((a) => a.startsWith("--tag="));
const distTag = tagArg ? tagArg.slice("--tag=".length) : "draft";
if (!/^[a-z0-9][a-z0-9.-]*$/i.test(distTag)) {
  console.error(`Invalid dist-tag: ${distTag}`);
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
];

const rootDir = process.cwd();

console.log(`Millar npm publish pipeline | tag=${distTag} | dryRun=${dryRun}`);

for (const rel of PACKAGES_IN_ORDER) {
  const pkgDir = path.join(rootDir, rel);
  const cmd = `pnpm publish --access public --tag ${distTag} --no-git-checks${dryRun ? " --dry-run" : ""}`;
  console.log(`\n---> ${dryRun ? "[DRY-RUN] " : ""}Publishing ${rel}...`);
  execSync(cmd, { cwd: pkgDir, stdio: "inherit" });
}

console.log(`\nPASS: ${dryRun ? "Dry-run verified" : "Published"} all ${PACKAGES_IN_ORDER.length} @hahlex/millar-* packages (tag: ${distTag}).`);
