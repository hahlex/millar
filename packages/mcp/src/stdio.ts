#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMillarMcpServer } from "./server.js";

const subCmd = process.argv[2];

if (subCmd === "install" || subCmd === "install-skills") {
  const flags = process.argv.slice(3);
  const dryRun = flags.includes("--dry-run");
  const targetFlag = flags.find((a) => a.startsWith("--target="));
  const home = os.homedir();
  const defaults = [
    path.join(home, ".gemini", "config", "skills"),
    path.join(home, ".agents", "skills"),
    path.join(home, ".claude", "skills"),
    path.join(home, ".codex", "skills"),
    path.join(home, ".cursor", "skills"),
  ].filter((d) => fs.existsSync(path.dirname(d)));
  const targets = targetFlag ? [path.resolve(targetFlag.slice("--target=".length))] : defaults.length > 0 ? defaults : [path.join(home, ".agents", "skills")];

  const skillsDir = [path.resolve(import.meta.dirname, "skills"), path.resolve(import.meta.dirname, "../../../skills")].find((d) =>
    fs.existsSync(d),
  );
  if (!skillsDir) {
    console.error("Bundled Millar skills directory not found.");
    process.exit(1);
  }
  const skillNames = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(skillsDir, d.name, "SKILL.md")))
    .map((d) => d.name)
    .sort();

  for (const root of targets) {
    if (!dryRun) fs.mkdirSync(root, { recursive: true });
    for (const name of skillNames) {
      const to = path.join(root, name);
      if (!dryRun) {
        fs.rmSync(to, { recursive: true, force: true });
        fs.cpSync(path.join(skillsDir, name), to, { recursive: true });
      }
    }
    console.log(`${dryRun ? "[DRY-RUN] " : ""}Installed ${skillNames.length} Millar skills -> ${root}`);
  }
  process.exit(0);
}

const server = createMillarMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
