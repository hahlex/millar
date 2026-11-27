#!/usr/bin/env node
/**
 * millar CLI: Zero-GitHub installer for Millar Agent Skills + standalone audit runner.
 *
 * Commands:
 *   npx millar install [--target=<dir>] [--dry-run]   Install or update all 8 Millar Skills locally
 *   npx millar update  [--target=<dir>] [--dry-run]   Alias for install (overwrites with latest bundled skills)
 *   npx millar audit <path> [audit-flags]             Run bundled Zero-MCP millar-audit.mjs
 *   npx millar mcp                                    Print MCP config / launch stdio server
 *   npx millar --version                              Print bundled CLI version
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const cmd = args[0] ?? "install";

function readCliVersion() {
  const pkgCandidates = [
    path.resolve(import.meta.dirname, "../package.json"),
    path.resolve(import.meta.dirname, "../../package.json"),
  ];
  for (const p of pkgCandidates) {
    if (fs.existsSync(p)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
        if (parsed?.name === "millar" && parsed?.version) return parsed.version;
      } catch {
        // ignore
      }
    }
  }
  return "0.6.0-draft.1";
}

function resolveSkillsDir() {
  const candidates = [
    path.resolve(import.meta.dirname, "skills"),
    path.resolve(import.meta.dirname, "../../skills"),
    path.resolve(import.meta.dirname, "../../../skills"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir;
  }
  throw new Error("Bundled Millar skills directory not found.");
}

function detectTargetRoots() {
  const home = os.homedir();
  const candidates = [
    path.join(home, ".gemini", "config", "skills"),
    path.join(home, ".agents", "skills"),
    path.join(home, ".claude", "skills"),
    path.join(home, ".codex", "skills"),
    path.join(home, ".cursor", "skills"),
  ];
  const existing = candidates.filter((dir) => fs.existsSync(path.dirname(dir)));
  return existing.length > 0 ? existing : [path.join(home, ".agents", "skills")];
}

function runInstall(flags) {
  const dryRun = flags.includes("--dry-run");
  const targetFlag = flags.find((a) => a.startsWith("--target="));
  const targetRoots = targetFlag ? [path.resolve(targetFlag.slice("--target=".length))] : detectTargetRoots();
  const skillsSrc = resolveSkillsDir();
  const skillNames = fs
    .readdirSync(skillsSrc, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(skillsSrc, d.name, "SKILL.md")))
    .map((d) => d.name)
    .sort();

  for (const root of targetRoots) {
    if (!dryRun) fs.mkdirSync(root, { recursive: true });
    for (const name of skillNames) {
      const from = path.join(skillsSrc, name);
      const to = path.join(root, name);
      if (!dryRun) {
        fs.rmSync(to, { recursive: true, force: true });
        fs.cpSync(from, to, { recursive: true });
      }
    }
    console.log(`${dryRun ? "[DRY-RUN] " : ""}Installed ${skillNames.length} Millar skills (v${readCliVersion()}) -> ${root}`);
  }
  console.log(`Skills: ${skillNames.join(", ")}`);
}

function runAudit(auditArgs) {
  const skillsSrc = resolveSkillsDir();
  const auditScript = path.join(skillsSrc, "millar-verify-web", "scripts", "millar-audit.mjs");
  const res = spawnSync(process.execPath, [auditScript, ...auditArgs], { stdio: "inherit" });
  process.exit(res.status ?? 0);
}

if (cmd === "install" || cmd === "update" || cmd === "upgrade" || cmd === "install-skills" || cmd === "skills") {
  runInstall(args.slice(1));
} else if (cmd === "audit") {
  runAudit(args.slice(1));
} else if (cmd === "mcp") {
  console.log(
    JSON.stringify(
      {
        mcpServers: {
          millar: {
            command: "npx",
            args: ["-y", "@hahlex/millar-mcp@draft"],
          },
        },
      },
      null,
      2,
    ),
  );
} else if (cmd === "--version" || cmd === "-v" || cmd === "version") {
  console.log(`millar v${readCliVersion()}`);
} else if (cmd === "--help" || cmd === "-h" || cmd === "help") {
  console.log(
    `millar v${readCliVersion()}\nUsage:\n  npx millar install [--target=<dir>] [--dry-run]\n  npx millar update  [--target=<dir>] [--dry-run]\n  npx millar audit <path> [flags]\n  npx millar mcp\n  npx millar --version`,
  );
} else {
  console.error(`Unknown command: ${cmd}. Try: npx millar install`);
  process.exit(1);
}
