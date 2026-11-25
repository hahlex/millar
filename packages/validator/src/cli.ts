#!/usr/bin/env node
/**
 * Millar Design Validator CLI adapter (`millar check`).
 * Runs the same deterministic validator engine used by MCP `validate_design`.
 *
 * Usage:
 *   tsx packages/validator/src/cli.ts --register=product path/to/file.tsx
 *   tsx packages/validator/src/cli.ts --register=marketing --source=hahlex-ui path/to/file.tsx
 */
import fs from "node:fs";
import path from "node:path";
import { validateDesign, type ContentSourceKind, type ValidationRegister } from "./index.js";

const args = process.argv.slice(2);
let register: ValidationRegister = "product";
let sourceKind: ContentSourceKind = "hahlex-ui";
const files: string[] = [];

for (const arg of args) {
  if (arg.startsWith("--register=")) {
    const val = arg.slice("--register=".length);
    if (val === "shared" || val === "marketing" || val === "product") register = val;
  } else if (arg.startsWith("--source=")) {
    const val = arg.slice("--source=".length);
    if (val === "hahlex-ui" || val === "user-data" || val === "quoted-content" || val === "third-party") sourceKind = val;
  } else if (!arg.startsWith("-")) {
    files.push(arg);
  }
}

if (files.length === 0) {
  console.error("Usage: millar-check [--register=product|marketing|shared] [--source=hahlex-ui|user-data|quoted-content|third-party] <file...>");
  process.exit(2);
}

let totalErrors = 0;
let totalWarnings = 0;

for (const file of files) {
  const abs = path.resolve(process.cwd(), file);
  const code = fs.readFileSync(abs, "utf8");
  const ext = path.extname(abs).toLowerCase();
  const language = ext === ".css" ? "css" : ext === ".html" ? "html" : ext === ".jsx" ? "jsx" : "tsx";
  const report = validateDesign({ code, register, sourceKind, language });
  totalErrors += report.automatedChecks.errorCount;
  totalWarnings += report.automatedChecks.warningCount;
  if (report.automatedChecks.violations.length === 0) {
    console.log(`PASS ${file} (${register}, 0 automated violations)`);
  } else {
    console.log(`${report.automatedChecks.passed ? "WARN" : "FAIL"} ${file} (${register}: ${report.automatedChecks.errorCount} error(s), ${report.automatedChecks.warningCount} warning(s))`);
    for (const v of report.automatedChecks.violations) {
      console.log(`  [${v.severity}] ${v.ruleId}${v.line ? `:${v.line}` : ""}: ${v.message}`);
    }
  }
}

console.log(`Human review reminder: Automated checks do NOT replace human aesthetic & craft judgment.`);
process.exit(totalErrors > 0 ? 1 : 0);
