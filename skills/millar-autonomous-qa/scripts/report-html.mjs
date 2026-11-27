#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  escapeHtml,
  loadConfigFile,
  MEMORY_DIR,
  parseCliArgs,
  readJsonSafe,
  REFERENCES_DIR,
  REPORTS_DIR,
  sanitizeForOutput,
  sanitizeText,
  stripEmDash,
  uniqueStrings,
  writeTextAtomic,
} from "./lib/common.mjs";

const safeHtml = (val) => escapeHtml(sanitizeText(val));

function readTextOptional(filePath, fallback) {
  if (!filePath || !fs.existsSync(filePath)) return fallback;
  return sanitizeText(fs.readFileSync(filePath, "utf8"));
}

function listDirFilesOptional(dirPath, excludeNames = new Set([".gitkeep"])) {
  if (!dirPath || !fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((d) => d.isFile() && !excludeNames.has(d.name))
    .map((d) => d.name)
    .sort();
}

function renderFindingsTable(items, emptyMessage) {
  if (items.length === 0) {
    return `<p class="muted">${safeHtml(emptyMessage)}</p>`;
  }
  const rows = items.map((f) => {
    const evid = Array.isArray(f.evidencePaths) && f.evidencePaths.length > 0 ? f.evidencePaths.join(", ") : "none";
    const repro = f.reproScript || f.reproCommand || "none";
    const sev = String(f.severity || "medium").toLowerCase();
    return `<tr>
      <td><code>${safeHtml(f.id)}</code></td>
      <td><span class="badge sev-${safeHtml(sev)}">${safeHtml(sev)}</span></td>
      <td>${safeHtml(f.title)}</td>
      <td><code>${safeHtml(repro)}</code></td>
      <td>${safeHtml(f.verifiedOutcome || "Recorded during QA loop")}</td>
      <td><code>${safeHtml(evid)}</code></td>
    </tr>`;
  });
  return `<table>
    <thead>
      <tr><th>ID</th><th>Severity</th><th>Title</th><th>Reproducer</th><th>Verified Outcome</th><th>Evidence</th></tr>
    </thead>
    <tbody>${rows.join("\n")}</tbody>
  </table>`;
}

function splitMarkdownTableCells(line) {
  const placeholder = "\u0000PIPE\u0000";
  const normalized = line.replaceAll("\\|", placeholder);
  return normalized
    .split("|")
    .slice(1, -1)
    .map((c) => c.replaceAll(placeholder, "|").trim().replaceAll("`", "").replaceAll("**", ""));
}

function parseToolSummaryRows(toolSelectionMd) {
  const lines = toolSelectionMd.split(/\r?\n/);
  const rows = [];
  const hasSectionOne = lines.some((l) => /^##\s+1\b/.test(l.trim()));
  let inSectionOne = !hasSectionOne;

  for (const line of lines) {
    const trimmed = line.trim();
    if (hasSectionOne) {
      if (/^##\s+1\b/.test(trimmed)) {
        inSectionOne = true;
        continue;
      }
      if (inSectionOne && /^##\s+[2-9]\b/.test(trimmed)) {
        break;
      }
      if (!inSectionOne) continue;
    }

    if (trimmed.startsWith("|")) {
      const cells = splitMarkdownTableCells(trimmed);
      const isSeparator = cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
      const isHeader = cells[0]?.toLowerCase() === "tool";
      if (!isSeparator && !isHeader && cells.length >= 6) {
        rows.push({
          tool: cells[0],
          category: cells[1],
          decision: cells[2],
          version: cells[3],
          isolation: cells[4],
          responsibility: cells[5],
        });
      }
    } else if (/^\d+\.\s+/.test(trimmed)) {
      const body = trimmed.replace(/^\d+\.\s+/, "");
      const parts = body.split(" - ");
      rows.push({
        tool: parts[0] || body,
        category: "Evaluated Tool",
        decision: /skip/i.test(body) ? "Skipped" : "Selected",
        version: (body.match(/v\d+\.\d+(?:\.\d+)?/i) || ["n/a"])[0],
        isolation: "Staged",
        responsibility: parts.slice(1).join(" - ") || body,
      });
    }
  }
  return rows;
}

export function generateHtmlReport(opts = {}) {
  const cfg = opts.config ? loadConfigFile(opts.config) : {};
  const memoryDir = path.resolve(opts.memoryDir || cfg.memoryDir || MEMORY_DIR);
  const outPath = path.resolve(opts.out || cfg.reportOut || path.join(REPORTS_DIR, "autonomous-qa-validation-report.html"));
  const toolSelectionPath = path.resolve(opts.toolSelection || cfg.toolSelection || path.join(REFERENCES_DIR, "tool-selection.md"));
  const validationLogPath = path.resolve(opts.validationLog || cfg.validationLog || path.join(REFERENCES_DIR, "self-validation-log.md"));

  const covRes = readJsonSafe(path.join(memoryDir, "coverage-ledger.json"));
  const finRes = readJsonSafe(path.join(memoryDir, "findings-ledger.json"));
  const budRes = readJsonSafe(path.join(memoryDir, "run-budget.json"));

  const iterations = sanitizeForOutput(Array.isArray(covRes.data?.iterations) ? covRes.data.iterations : []);
  const findings = sanitizeForOutput(Array.isArray(finRes.data?.findings) ? finRes.data.findings : []);
  const budget = budRes.data && typeof budRes.data === "object" ? sanitizeForOutput(budRes.data) : null;

  const toolSelectionMd = readTextOptional(toolSelectionPath, "Tool selection document not found.");
  const validationLogMd = readTextOptional(validationLogPath, "No self-validation entries recorded yet.");

  const toolRows = parseToolSummaryRows(toolSelectionMd);
  const regressionFiles = listDirFilesOptional(path.join(memoryDir, "regressions"));
  const traceFiles = listDirFilesOptional(path.join(memoryDir, "traces"));
  const evidenceFiles = listDirFilesOptional(path.join(memoryDir, "evidence"));

  const allRoutes = uniqueStrings(iterations.flatMap((it) => it.routes || it.coverage?.routes || []));
  const allEndpoints = uniqueStrings(iterations.flatMap((it) => it.endpoints || it.coverage?.endpoints || []));
  const allRoles = uniqueStrings(iterations.flatMap((it) => it.roles || it.coverage?.roles || []));
  const allModes = uniqueStrings(iterations.flatMap((it) => it.modes || []));
  const allTools = uniqueStrings(iterations.flatMap((it) => it.toolsRun || it.tools || []));

  const confirmedBugs = findings.filter((f) => f.classification === "confirmed_bug");
  const specGaps = findings.filter((f) => f.classification === "spec_gap");
  const runtimeDegraded = findings.filter((f) => f.classification === "runtime_degraded");

  const allEvidencePaths = uniqueStrings([
    ...findings.flatMap((f) => (Array.isArray(f.evidencePaths) ? f.evidencePaths : [])),
    ...traceFiles.map((t) => `memory/traces/${t}`),
    ...evidenceFiles.map((e) => `memory/evidence/${e}`),
  ]);
  const allReproScripts = uniqueStrings([
    ...findings.map((f) => f.reproScript).filter(Boolean),
    ...regressionFiles.map((r) => `memory/regressions/${r}`),
  ]);

  const toolsSectionHtml =
    toolRows.length > 0
      ? `<table>
          <thead><tr><th>Tool</th><th>Category</th><th>Decision</th><th>Version</th><th>Isolation</th><th>Role</th></tr></thead>
          <tbody>
            ${toolRows
              .map(
                (r) =>
                  `<tr><td>${safeHtml(r.tool)}</td><td>${safeHtml(r.category)}</td><td>${safeHtml(r.decision)}</td><td><code>${safeHtml(r.version)}</code></td><td>${safeHtml(r.isolation)}</td><td>${safeHtml(r.responsibility)}</td></tr>`,
              )
              .join("\n")}
          </tbody>
        </table>`
      : `<pre>${safeHtml(toolSelectionMd)}</pre>`;

  const iterRowsHtml =
    iterations.length > 0
      ? `<table>
          <thead><tr><th>Iteration</th><th>Started At</th><th>Tools</th><th>Routes</th><th>Endpoints</th><th>Modes</th></tr></thead>
          <tbody>
            ${iterations
              .map((it, idx) => {
                const routes = it.routes || it.coverage?.routes || [];
                const eps = it.endpoints || it.coverage?.endpoints || [];
                const tools = it.toolsRun || it.tools || [];
                const modes = it.modes || [];
                return `<tr>
                  <td>#${safeHtml(String(it.iteration ?? idx + 1))}</td>
                  <td><code>${safeHtml(it.startedAt || it.timestamp || "")}</code></td>
                  <td>${safeHtml(tools.join(", ") || "none")}</td>
                  <td>${safeHtml(String(routes.length))}</td>
                  <td>${safeHtml(String(eps.length))}</td>
                  <td>${safeHtml(modes.join(", ") || "none")}</td>
                </tr>`;
              })
              .join("\n")}
          </tbody>
        </table>`
      : `<p class="muted">No QA loop iterations have been recorded in coverage-ledger.json yet.</p>`;

  const budgetHtml = budget
    ? `<ul>
        <li>Start Time: <code>${safeHtml(budget.startTime)}</code></li>
        <li>Requests Used: <strong>${safeHtml(String(budget.requestsUsed))}</strong> / ${safeHtml(String(budget.maxRequests))}</li>
        <li>AI Calls Used: <strong>${safeHtml(String(budget.aiCallsUsed))}</strong> / ${safeHtml(String(budget.maxAiCalls))}</li>
        <li>Max Runtime: <strong>${safeHtml(String(budget.maxMinutes))}</strong> minutes</li>
        <li>Status: <code>${safeHtml(budget.status || "recorded")}</code></li>
      </ul>`
    : `<p class="muted">Budget ledger (memory/run-budget.json) is not present.</p>`;

  const generatedAt = new Date().toISOString();

  const htmlRaw = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autonomous QA Validation Report</title>
  <style>
    :root {
      --bg: #f7f6f2;
      --surface: #ffffff;
      --ink: #1b1e23;
      --muted: #5a6270;
      --border: #dcd8cf;
      --accent: #1d4ed8;
      --crit: #991b1b;
      --high: #b45309;
      --med: #1e40af;
      --low: #374151;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem;
      background: var(--bg);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.5;
    }
    .container { max-width: 1180px; margin: 0 auto; }
    header, section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.25rem;
    }
    h1 { margin: 0 0 0.4rem 0; font-size: 1.65rem; }
    h2 { margin: 0 0 0.75rem 0; font-size: 1.2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; }
    h3 { margin: 1rem 0 0.5rem 0; font-size: 1.02rem; }
    .meta { color: var(--muted); font-size: 0.9rem; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; margin-top: 0.9rem; }
    .kpi { border: 1px solid var(--border); border-radius: 6px; padding: 0.65rem 0.85rem; background: #fbfaf7; }
    .kpi strong { display: block; font-size: 1.35rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.9rem; }
    th, td { border: 1px solid var(--border); padding: 0.45rem 0.6rem; text-align: left; vertical-align: top; }
    th { background: #f2efe8; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.85rem; }
    pre { background: #f5f4ef; border: 1px solid var(--border); padding: 0.75rem; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; }
    .muted { color: var(--muted); }
    .badge { display: inline-block; padding: 0.1rem 0.45rem; border-radius: 4px; font-size: 0.78rem; font-weight: 600; color: #fff; }
    .sev-critical { background: var(--crit); }
    .sev-high { background: var(--high); }
    .sev-medium { background: var(--med); }
    .sev-low { background: var(--low); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Autonomous QA Validation Report</h1>
      <div class="meta">Generated at: <code>${safeHtml(generatedAt)}</code></div>
      <div class="kpis">
        <div class="kpi"><span>Iterations</span><strong>${safeHtml(String(iterations.length))}</strong></div>
        <div class="kpi"><span>Confirmed Bugs</span><strong>${safeHtml(String(confirmedBugs.length))}</strong></div>
        <div class="kpi"><span>Specification Gaps</span><strong>${safeHtml(String(specGaps.length))}</strong></div>
        <div class="kpi"><span>Runtime Degraded</span><strong>${safeHtml(String(runtimeDegraded.length))}</strong></div>
        <div class="kpi"><span>Routes Covered</span><strong>${safeHtml(String(allRoutes.length))}</strong></div>
        <div class="kpi"><span>Endpoints Covered</span><strong>${safeHtml(String(allEndpoints.length))}</strong></div>
      </div>
    </header>

    <section id="tools">
      <h2>1. Installed Tools &amp; Versions</h2>
      ${toolsSectionHtml}
    </section>

    <section id="capabilities">
      <h2>2. Implemented Capabilities &amp; Continuous QA Loop</h2>
      <p>The <code>millar-autonomous-qa</code> skill implements an 8-stage continuous QA loop (<code>discover -&gt; plan -&gt; execute -&gt; observe -&gt; verify -&gt; reproduce -&gt; report -&gt; explore_further</code>) across 9 testing modes: exploratory, stateful, property-based, negative, concurrency, authorization, resilience, AI feature evaluation, and multi-channel outcome verification.</p>
      <p>Core guards enforce non-production loopback targeting, strict runtime/request/AI-call budgets, CWD and tool cache isolation, secret redaction, zero target source modifications, and zero U+2014 em-dash output.</p>
    </section>

    <section id="coverage">
      <h2>3. Actual Testing Coverage</h2>
      <ul>
        <li>Roles Tested: <code>${safeHtml(allRoles.join(", ") || "none")}</code></li>
        <li>Modes Executed: <code>${safeHtml(allModes.join(", ") || "none")}</code></li>
        <li>Tools Run: <code>${safeHtml(allTools.join(", ") || "none")}</code></li>
        <li>UI Routes (${safeHtml(String(allRoutes.length))}): <code>${safeHtml(allRoutes.slice(0, 40).join(", ") || "none")}</code></li>
        <li>API Endpoints (${safeHtml(String(allEndpoints.length))}): <code>${safeHtml(allEndpoints.slice(0, 40).join(", ") || "none")}</code></li>
      </ul>
      ${iterRowsHtml}
    </section>

    <section id="findings">
      <h2>4. Confirmed Bugs vs Specification Gaps</h2>
      <h3>Confirmed Bugs</h3>
      ${renderFindingsTable(confirmedBugs, "No confirmed bugs recorded.")}
      <h3>Specification Gaps</h3>
      ${renderFindingsTable(specGaps, "No specification gaps recorded.")}
      <h3>Runtime Degraded Observations</h3>
      ${renderFindingsTable(runtimeDegraded, "No runtime degraded observations recorded.")}
    </section>

    <section id="evidence">
      <h2>5. Captured Evidence &amp; Regression Tests</h2>
      <p><strong>Regression Scripts (${safeHtml(String(allReproScripts.length))}):</strong></p>
      <ul>${allReproScripts.length > 0 ? allReproScripts.map((p) => `<li><code>${safeHtml(p)}</code></li>`).join("") : "<li class='muted'>None generated yet.</li>"}</ul>
      <p><strong>Trace &amp; Evidence Files (${safeHtml(String(allEvidencePaths.length))}):</strong></p>
      <ul>${allEvidencePaths.length > 0 ? allEvidencePaths.map((p) => `<li><code>${safeHtml(p)}</code></li>`).join("") : "<li class='muted'>None captured yet.</li>"}</ul>
    </section>

    <section id="self-validation">
      <h2>6. Self-Validation Improvements</h2>
      <pre>${safeHtml(validationLogMd)}</pre>
    </section>

    <section id="limitations">
      <h2>7. Remaining Limitations &amp; Safety and Cleanup Audit</h2>
      <h3>Budget Utilization</h3>
      ${budgetHtml}
      <h3>Safety &amp; Cleanup Audit</h3>
      <p>Target application repositories are inspected strictly read-only. Ephemeral scratch directories (<code>.tmp/</code>, <code>memory/artifacts/</code>, <code>test-results/</code>, <code>.promptfoo/</code>) are purged by <code>scripts/cleanup.mjs</code> while preserving ledgers, traces, regressions, and HTML reports.</p>
    </section>
  </div>
</body>
</html>
`;

  const finalHtml = stripEmDash(htmlRaw);
  writeTextAtomic(outPath, finalHtml, { skipRedact: true });

  return {
    ok: true,
    outPath,
    iterations: iterations.length,
    findings: {
      total: findings.length,
      confirmedBugs: confirmedBugs.length,
      specGaps: specGaps.length,
      runtimeDegraded: runtimeDegraded.length,
    },
  };
}

function main() {
  const { values } = parseCliArgs(process.argv.slice(2), { booleanFlags: ["help"] });

  if (values.help) {
    console.log(
      "Usage: node scripts/report-html.mjs [--out <path>] [--memory-dir <dir>] [--tool-selection <path>] [--validation-log <path>]",
    );
    process.exit(0);
  }

  const res = generateHtmlReport({
    out: values.out,
    memoryDir: values["memory-dir"],
    toolSelection: values["tool-selection"],
    validationLog: values["validation-log"],
    config: values.config,
  });

  console.log(JSON.stringify(res, null, 2));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
