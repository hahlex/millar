#!/usr/bin/env node
/**
 * Enforces Zero Em-Dash (U+2014) across Hahlex-controlled UI, docs, and token files.
 * Per ADR-0002 / Q4: NEVER scans third-party skills (.agents/), external vendor code,
 * or test fixtures explicitly tagged with `em-dash-fixture-ok` (user-data / quote tests).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  ".git",
  ".agents",
  "agent",
  ".claude",
  ".cursor",
  ".windsurf",
  "node_modules",
  ".next",
  "dist",
  "out",
  "coverage",
  "playwright-report",
  "test-results",
]);
const ALLOWED_EXTS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".css", ".json", ".md", ".mdx", ".html", ".svg"]);
const EM_DASH = "\u2014";

/** @type {Array<{ file: string; line: number; preview: string }>} */
const violations = [];
let scanned = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!ALLOWED_EXTS.has(path.extname(entry.name).toLowerCase())) continue;
    const rel = path.relative(ROOT, full).replaceAll("\\", "/");
    // Historical audit docs may quote literal source text containing em-dashes from audited repos.
    if (rel.startsWith("docs/research/")) continue;

    scanned += 1;
    const content = fs.readFileSync(full, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (!line.includes(EM_DASH)) return;
      if (line.includes("em-dash-fixture-ok")) return;
      violations.push({
        file: rel,
        line: idx + 1,
        preview: line.trim().slice(0, 110),
      });
    });
  }
}

walk(ROOT);

if (violations.length > 0) {
  console.error(`FAIL: Found ${violations.length} forbidden U+2014 em-dash character(s) across ${scanned} Hahlex-controlled files:`);
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line} -> ${v.preview}`);
  }
  process.exit(1);
}

console.log(`PASS: Zero U+2014 em-dash across ${scanned} Hahlex-controlled files.`);
