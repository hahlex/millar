#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getLocalCacheTmpDir,
  loadConfigFile,
  MEMORY_DIR,
  parseCliArgs,
  STAGING_ROOT,
  uniqueStrings,
} from "./lib/common.mjs";

function collectFilesInDir(dirPath) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  for (const ent of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, ent.name);
    if (ent.isDirectory()) {
      results.push(...collectFilesInDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function removeTarget(absPath, dryRun, removed, wouldRemove) {
  if (!fs.existsSync(absPath)) return;
  const stat = fs.lstatSync(absPath);
  if (stat.isDirectory()) {
    const files = collectFilesInDir(absPath);
    for (const f of files) {
      wouldRemove.push(f);
      if (!dryRun) {
        fs.rmSync(f, { force: true });
        removed.push(f);
      }
    }
    wouldRemove.push(absPath);
    if (!dryRun) {
      fs.rmSync(absPath, { recursive: true, force: true });
      removed.push(absPath);
    }
  } else {
    wouldRemove.push(absPath);
    if (!dryRun) {
      fs.rmSync(absPath, { force: true });
      removed.push(absPath);
    }
  }
}

function checkGitRepoReadOnly(repoPath) {
  const abs = path.resolve(repoPath);
  if (!fs.existsSync(abs)) {
    return { repoPath: abs, exists: false, isGitRepo: false, clean: false, statusLines: [] };
  }
  try {
    const out = execFileSync("git", ["-C", abs, "status", "--porcelain"], {
      encoding: "utf8",
      windowsHide: true,
      timeout: 5000,
    });
    const statusLines = out.split(/\r?\n/).filter(Boolean);
    return {
      repoPath: abs,
      exists: true,
      isGitRepo: true,
      clean: statusLines.length === 0,
      statusLines,
    };
  } catch (err) {
    return {
      repoPath: abs,
      exists: true,
      isGitRepo: false,
      clean: null,
      error: err instanceof Error ? err.message : String(err),
      statusLines: [],
    };
  }
}

export function runCleanup(opts = {}) {
  const dryRun = Boolean(opts.dryRun);
  const cfg = opts.config ? loadConfigFile(opts.config) : {};
  const removed = [];
  const wouldRemove = [];

  const ephemeralDirs = [
    path.join(STAGING_ROOT, ".tmp"),
    path.join(MEMORY_DIR, "artifacts"),
    path.join(STAGING_ROOT, "test-results"),
    path.join(STAGING_ROOT, ".promptfoo"),
    getLocalCacheTmpDir(),
  ];

  for (const dir of ephemeralDirs) {
    removeTarget(dir, dryRun, removed, wouldRemove);
  }

  for (const scanRoot of [STAGING_ROOT, MEMORY_DIR]) {
    if (!fs.existsSync(scanRoot)) continue;
    for (const ent of fs.readdirSync(scanRoot, { withFileTypes: true })) {
      if (ent.name.startsWith("qa-temp-") || /\.tmp\.\d+/i.test(ent.name)) {
        removeTarget(path.join(scanRoot, ent.name), dryRun, removed, wouldRemove);
      }
    }
  }

  const repoPaths = uniqueStrings([
    ...(Array.isArray(opts.repoPaths) ? opts.repoPaths : []),
    ...(Array.isArray(cfg.repoPaths) ? cfg.repoPaths : []),
  ]);

  const repoChecks =
    opts.verifyCleanRepos || repoPaths.length > 0
      ? repoPaths.map((p) => checkGitRepoReadOnly(p))
      : [{ checked: false, status: "skipped" }];

  return {
    ok: true,
    dryRun,
    stagingRoot: STAGING_ROOT,
    removed,
    wouldRemove,
    preserved: [
      "memory/schema.json",
      "memory/coverage-ledger.json",
      "memory/findings-ledger.json",
      "memory/run-budget.json",
      "memory/evidence/",
      "memory/regressions/",
      "memory/traces/",
      "reports/",
      "SKILL.md",
      "references/",
      "scripts/",
    ],
    repoChecks,
  };
}

function main() {
  const { values } = parseCliArgs(process.argv.slice(2), {
    booleanFlags: ["dry-run", "verify-clean-repos", "help"],
    multiFlags: ["repo-path"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/cleanup.mjs [--dry-run] [--verify-clean-repos] [--config <path>] [--repo-path <path>]",
    );
    process.exit(0);
  }

  const summary = runCleanup({
    dryRun: Boolean(values["dry-run"]),
    verifyCleanRepos: Boolean(values["verify-clean-repos"]),
    config: values.config,
    repoPaths: values["repo-path"],
  });

  console.log(JSON.stringify(summary, null, 2));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
