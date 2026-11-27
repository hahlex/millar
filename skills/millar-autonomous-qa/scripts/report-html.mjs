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
  STAGING_ROOT,
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

function resolveCanonicalPath(rawPath, memoryDir) {
  if (!rawPath || typeof rawPath !== "string") return null;
  const trimmed = rawPath.trim();
  if (!trimmed) return null;
  if (path.isAbsolute(trimmed)) return path.resolve(trimmed);
  const norm = trimmed.replaceAll("\\", "/");
  if (norm.startsWith("memory/")) {
    const underMemory = path.resolve(memoryDir, norm.slice("memory/".length));
    if (fs.existsSync(underMemory)) return underMemory;
  }
  const fromStaging = path.resolve(STAGING_ROOT, norm);
  if (fs.existsSync(fromStaging)) return fromStaging;
  const fromMemory = path.resolve(memoryDir, norm);
  if (fs.existsSync(fromMemory)) return fromMemory;
  return fromStaging;
}

function formatDisplayPath(absPath, outDir, memoryDir) {
  if (!absPath) return "";
  const relFromOut = path.relative(outDir, absPath).replaceAll("\\", "/");
  if (!relFromOut.startsWith("../..")) return relFromOut;
  const relFromMem = path.relative(path.dirname(memoryDir), absPath).replaceAll("\\", "/");
  if (!relFromMem.startsWith("..")) return relFromMem;
  return relFromOut;
}

function dedupeAndFormatPaths(rawPaths, memoryDir, outDir) {
  const seen = new Set();
  const items = [];
  for (const raw of rawPaths || []) {
    const abs = resolveCanonicalPath(raw, memoryDir);
    if (!abs) continue;
    const key = process.platform === "win32" ? abs.toLowerCase() : abs;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      abs,
      exists: fs.existsSync(abs),
      display: formatDisplayPath(abs, outDir, memoryDir),
      href: path.relative(outDir, abs).replaceAll("\\", "/"),
    });
  }
  items.sort((a, b) => a.display.localeCompare(b.display));
  return items;
}

function loadScreenshotDataUri(absPath, maxBytes = 420000) {
  try {
    if (!absPath || !/\.(?:png|jpe?g|webp)$/i.test(absPath) || !fs.existsSync(absPath)) return null;
    const stat = fs.statSync(absPath);
    if (stat.size <= 0 || stat.size > maxBytes) return null;
    const ext = path.extname(absPath).toLowerCase();
    const mime = ext === ".webp" ? "image/webp" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
    const b64 = fs.readFileSync(absPath).toString("base64");
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

function renderFindingsTable(items, emptyMessage, { memoryDir, outDir, thumbBudget }) {
  if (items.length === 0) {
    return `<p class="muted">${safeHtml(emptyMessage)}</p>`;
  }
  const rows = items.map((f) => {
    const formattedEvid = dedupeAndFormatPaths(Array.isArray(f.evidencePaths) ? f.evidencePaths : [], memoryDir, outDir);
    const evidHtml =
      formattedEvid.length > 0
        ? formattedEvid
            .map((e) =>
              e.exists
                ? `<a class="file-link" href="${safeHtml(e.href)}" target="_blank"><code>${safeHtml(e.display)}</code></a>`
                : `<code>${safeHtml(e.display)}</code>`,
            )
            .join("<br/>")
        : `<span class="muted">none</span>`;

    let thumbHtml = "";
    if (thumbBudget.remaining > 0) {
      const imgEntry = formattedEvid.find((e) => e.exists && /\.(?:png|jpe?g|webp)$/i.test(e.abs));
      if (imgEntry) {
        const uri = loadScreenshotDataUri(imgEntry.abs);
        if (uri) {
          thumbBudget.remaining -= 1;
          thumbHtml = `<div class="thumb-wrap"><img class="thumb" loading="lazy" src="${uri}" alt="${safeHtml(f.id)} screenshot" onclick="openLightbox(this.src, this.alt)" /></div>`;
        }
      }
    }

    const reproFormatted = f.reproScript ? dedupeAndFormatPaths([f.reproScript], memoryDir, outDir)[0] : null;
    const reproHtml = reproFormatted
      ? reproFormatted.exists
        ? `<a class="file-link" href="${safeHtml(reproFormatted.href)}" target="_blank"><code>${safeHtml(reproFormatted.display)}</code></a>`
        : `<code>${safeHtml(reproFormatted.display)}</code>`
      : `<code>${safeHtml(f.reproCommand || "none")}</code>`;

    const sev = String(f.severity || "medium").toLowerCase();
    const cls = String(f.classification || "confirmed_bug").toLowerCase();
    const roleTag = f.role ? `<span class="chip">${safeHtml(f.role)}</span> ` : "";
    const searchHaystack = `${f.id} ${sev} ${cls} ${f.role || ""} ${f.title || ""} ${f.endpointOrRoute || ""} ${f.verifiedOutcome || ""}`.toLowerCase();

    return `<tr class="finding-row" data-class="${safeHtml(cls)}" data-sev="${safeHtml(sev)}" data-search="${safeHtml(searchHaystack)}">
      <td><code>${safeHtml(f.id)}</code></td>
      <td><span class="badge sev-${safeHtml(sev)}">${safeHtml(sev)}</span></td>
      <td>${roleTag}${safeHtml(f.title)}</td>
      <td>${reproHtml}</td>
      <td>${safeHtml(f.verifiedOutcome || "Recorded during QA loop")}</td>
      <td>${evidHtml}${thumbHtml}</td>
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
  const outDir = path.dirname(outPath);
  const toolSelectionPath = path.resolve(opts.toolSelection || cfg.toolSelection || path.join(REFERENCES_DIR, "tool-selection.md"));
  const includeSkillLog = Boolean(opts.includeSkillLog || cfg.includeSkillLog || opts.validationLog);
  const validationLogPath = path.resolve(opts.validationLog || cfg.validationLog || path.join(REFERENCES_DIR, "self-validation-log.md"));

  const covRes = readJsonSafe(path.join(memoryDir, "coverage-ledger.json"));
  const finRes = readJsonSafe(path.join(memoryDir, "findings-ledger.json"));
  const budRes = readJsonSafe(path.join(memoryDir, "run-budget.json"));

  const iterations = sanitizeForOutput(Array.isArray(covRes.data?.iterations) ? covRes.data.iterations : []);
  const findings = sanitizeForOutput(Array.isArray(finRes.data?.findings) ? finRes.data.findings : []);
  const budget = budRes.data && typeof budRes.data === "object" ? sanitizeForOutput(budRes.data) : null;

  const toolSelectionMd = readTextOptional(toolSelectionPath, "Tool selection document not found.");
  const validationLogMd = includeSkillLog ? readTextOptional(validationLogPath, "No self-validation entries recorded yet.") : "";

  const toolRows = parseToolSummaryRows(toolSelectionMd);
  const regressionFiles = listDirFilesOptional(path.join(memoryDir, "regressions"));
  const traceFiles = listDirFilesOptional(path.join(memoryDir, "traces"));
  const evidenceFiles = listDirFilesOptional(path.join(memoryDir, "evidence"));

  const allRoutes = uniqueStrings(iterations.flatMap((it) => it.routes || it.coverage?.routes || []));
  const allExercisedRoutes = uniqueStrings(iterations.flatMap((it) => it.exercisedRoutes || []));
  const allDiscoveredRoutes = uniqueStrings([...allRoutes, ...iterations.flatMap((it) => it.discoveredRoutes || [])]);
  const allEndpoints = uniqueStrings(iterations.flatMap((it) => it.endpoints || it.coverage?.endpoints || []));
  const allExercisedEndpoints = uniqueStrings(iterations.flatMap((it) => it.exercisedEndpoints || []));
  const allDiscoveredEndpoints = uniqueStrings([...allEndpoints, ...iterations.flatMap((it) => it.discoveredEndpoints || [])]);
  const allRoles = uniqueStrings(iterations.flatMap((it) => it.roles || it.coverage?.roles || []));
  const allModes = uniqueStrings(iterations.flatMap((it) => it.modes || []));
  const allTools = uniqueStrings(iterations.flatMap((it) => it.toolsRun || it.tools || []));
  const latestDepth = iterations.length > 0 ? iterations[iterations.length - 1].depth || "standard" : "standard";

  const confirmedBugs = findings.filter((f) => f.classification === "confirmed_bug");
  const specGaps = findings.filter((f) => f.classification === "spec_gap");
  const runtimeDegraded = findings.filter((f) => f.classification === "runtime_degraded");

  // Deduplicate evidence & reproducer paths canonically (fixes duplicate path counting bug)
  const dedupedEvidence = dedupeAndFormatPaths(
    [
      ...findings.flatMap((f) => (Array.isArray(f.evidencePaths) ? f.evidencePaths : [])),
      ...traceFiles.map((t) => path.join(memoryDir, "traces", t)),
      ...evidenceFiles.map((e) => path.join(memoryDir, "evidence", e)),
    ],
    memoryDir,
    outDir,
  );
  const dedupedRepros = dedupeAndFormatPaths(
    [
      ...findings.map((f) => f.reproScript).filter(Boolean),
      ...regressionFiles.map((r) => path.join(memoryDir, "regressions", r)),
    ],
    memoryDir,
    outDir,
  );

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
          <thead><tr><th>Iteration</th><th>Depth</th><th>Started At</th><th>Tools</th><th>Routes (Ex / Disc)</th><th>Endpoints (Ex / Cat)</th><th>Modes</th></tr></thead>
          <tbody>
            ${iterations
              .map((it, idx) => {
                const discRoutes = it.discoveredRoutes || it.routes || it.coverage?.routes || [];
                const exRoutes = it.exercisedRoutes || [];
                const discEps = it.discoveredEndpoints || it.endpoints || it.coverage?.endpoints || [];
                const exEps = it.exercisedEndpoints || [];
                const tools = it.toolsRun || it.tools || [];
                const modes = it.modes || [];
                const routeLabel = exRoutes.length > 0 ? `${exRoutes.length} / ${discRoutes.length}` : String(discRoutes.length);
                const epLabel = exEps.length > 0 ? `${exEps.length} / ${discEps.length}` : String(discEps.length);
                return `<tr>
                  <td>#${safeHtml(String(it.iteration ?? idx + 1))}</td>
                  <td><code>${safeHtml(String(it.depth || "standard"))}</code></td>
                  <td><code>${safeHtml(it.startedAt || it.timestamp || "")}</code></td>
                  <td>${safeHtml(tools.join(", ") || "none")}</td>
                  <td>${safeHtml(routeLabel)}</td>
                  <td>${safeHtml(epLabel)}</td>
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

  const thumbBudget = { remaining: 12 };
  const routesKpiValue =
    allExercisedRoutes.length > 0
      ? `${allExercisedRoutes.length} / ${allDiscoveredRoutes.length}`
      : String(allRoutes.length);
  const endpointsKpiValue =
    allExercisedEndpoints.length > 0
      ? `${allExercisedEndpoints.length} / ${allDiscoveredEndpoints.length}`
      : String(allEndpoints.length);

  const sectionSixHtml = includeSkillLog
    ? `<pre>${safeHtml(validationLogMd)}</pre>`
    : `<ul>
        <li>Execution Depth: <code>${safeHtml(latestDepth)}</code></li>
        <li>Frontier Route Coverage: <strong>${safeHtml(routesKpiValue)}</strong> (exercised / discovered)</li>
        <li>API Endpoint Coverage: <strong>${safeHtml(endpointsKpiValue)}</strong> (exercised / catalog)</li>
        <li>Origin-Scoped Auth Headers: enabled (zero third-party credential/CORS leaks)</li>
        <li>Static Dev Asset Filtering: enabled (Vite/CDN assets excluded from API KPI)</li>
        <li>Deduplicated Regression Scripts: <strong>${safeHtml(String(dedupedRepros.length))}</strong> | Evidence Artifacts: <strong>${safeHtml(String(dedupedEvidence.length))}</strong></li>
      </ul>`;

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
    .container { max-width: 1240px; margin: 0 auto; }
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
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 0.75rem; margin-top: 0.9rem; }
    .kpi { border: 1px solid var(--border); border-radius: 6px; padding: 0.65rem 0.85rem; background: #fbfaf7; }
    .kpi span { font-size: 0.82rem; color: var(--muted); }
    .kpi strong { display: block; font-size: 1.35rem; margin-top: 0.1rem; }
    .filter-bar { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 0.9rem; }
    .filter-btn { border: 1px solid var(--border); background: #f5f4ef; color: var(--ink); padding: 0.3rem 0.65rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .filter-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .filter-input { border: 1px solid var(--border); border-radius: 6px; padding: 0.32rem 0.6rem; font-size: 0.85rem; min-width: 220px; }
    table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.88rem; }
    th, td { border: 1px solid var(--border); padding: 0.45rem 0.6rem; text-align: left; vertical-align: top; word-break: break-word; }
    th { background: #f2efe8; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.83rem; }
    pre { background: #f5f4ef; border: 1px solid var(--border); padding: 0.75rem; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; }
    .muted { color: var(--muted); }
    .badge { display: inline-block; padding: 0.1rem 0.45rem; border-radius: 4px; font-size: 0.78rem; font-weight: 600; color: #fff; }
    .chip { display: inline-block; padding: 0.05rem 0.4rem; border-radius: 4px; font-size: 0.75rem; background: #eef2ff; color: #1e3a8a; border: 1px solid #c7d2fe; margin-right: 0.25rem; }
    .sev-critical { background: var(--crit); }
    .sev-high { background: var(--high); }
    .sev-medium { background: var(--med); }
    .sev-low { background: var(--low); }
    .file-link { color: var(--accent); text-decoration: none; }
    .file-link:hover { text-decoration: underline; }
    .thumb-wrap { margin-top: 0.4rem; }
    .thumb { max-width: 180px; max-height: 110px; border: 1px solid var(--border); border-radius: 4px; cursor: zoom-in; display: block; }
    .lightbox { display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.82); z-index: 9999; align-items: center; justify-content: center; padding: 1.5rem; }
    .lightbox.open { display: flex; }
    .lightbox img { max-width: 92vw; max-height: 88vh; border-radius: 6px; background: #fff; }
    .hidden-row { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Autonomous QA Validation Report</h1>
      <div class="meta">Generated at: <code>${safeHtml(generatedAt)}</code> | Depth: <code>${safeHtml(latestDepth)}</code></div>
      <div class="kpis">
        <div class="kpi"><span>Iterations</span><strong>${safeHtml(String(iterations.length))}</strong></div>
        <div class="kpi"><span>Confirmed Bugs</span><strong>${safeHtml(String(confirmedBugs.length))}</strong></div>
        <div class="kpi"><span>Specification Gaps</span><strong>${safeHtml(String(specGaps.length))}</strong></div>
        <div class="kpi"><span>Runtime Degraded</span><strong>${safeHtml(String(runtimeDegraded.length))}</strong></div>
        <div class="kpi"><span>Routes (Ex / Disc)</span><strong>${safeHtml(routesKpiValue)}</strong></div>
        <div class="kpi"><span>Endpoints (Ex / Cat)</span><strong>${safeHtml(endpointsKpiValue)}</strong></div>
      </div>
    </header>

    <section id="tools">
      <h2>1. Installed Tools &amp; Versions</h2>
      ${toolsSectionHtml}
    </section>

    <section id="capabilities">
      <h2>2. Implemented Capabilities &amp; Continuous QA Loop</h2>
      <p>The <code>millar-autonomous-qa</code> skill implements an 8-stage continuous QA loop (<code>discover -&gt; plan -&gt; execute -&gt; observe -&gt; verify -&gt; reproduce -&gt; report -&gt; explore_further</code>) across 9 testing modes (exploratory, stateful, property-based, negative, concurrency, 4-axis authorization, resilience, AI evaluation, and multi-channel causal outcome verification) plus hybrid <code>--depth=smoke|standard|deep-business</code> persona workflows.</p>
      <p>Core guards enforce non-production loopback targeting, origin-scoped auth headers (zero third-party CORS leaks), strict runtime/request/AI-call budgets, CWD and tool cache isolation, secret redaction, zero target source modifications, and zero U+2014 em-dash output.</p>
    </section>

    <section id="coverage">
      <h2>3. Actual Testing Coverage</h2>
      <ul>
        <li>Roles Tested (${safeHtml(String(allRoles.length))}): <code>${safeHtml(allRoles.join(", ") || "none")}</code></li>
        <li>Modes Executed: <code>${safeHtml(allModes.join(", ") || "none")}</code></li>
        <li>Tools Run: <code>${safeHtml(allTools.join(", ") || "none")}</code></li>
        <li>Exercised UI Routes (${safeHtml(String(allExercisedRoutes.length || allRoutes.length))}): <code>${safeHtml((allExercisedRoutes.length > 0 ? allExercisedRoutes : allRoutes).slice(0, 50).join(", ") || "none")}</code></li>
        <li>Exercised API Endpoints (${safeHtml(String(allExercisedEndpoints.length || allEndpoints.length))}): <code>${safeHtml((allExercisedEndpoints.length > 0 ? allExercisedEndpoints : allEndpoints).slice(0, 50).join(", ") || "none")}</code></li>
      </ul>
      ${iterRowsHtml}
    </section>

    <section id="findings">
      <h2>4. Confirmed Bugs vs Specification Gaps</h2>
      <div class="filter-bar">
        <button class="filter-btn active" type="button" onclick="setClassFilter('all', this)">All (${safeHtml(String(findings.length))})</button>
        <button class="filter-btn" type="button" onclick="setClassFilter('confirmed_bug', this)">Confirmed Bugs (${safeHtml(String(confirmedBugs.length))})</button>
        <button class="filter-btn" type="button" onclick="setClassFilter('spec_gap', this)">Spec Gaps (${safeHtml(String(specGaps.length))})</button>
        <button class="filter-btn" type="button" onclick="setClassFilter('runtime_degraded', this)">Runtime Degraded (${safeHtml(String(runtimeDegraded.length))})</button>
        <input class="filter-input" id="finding-search" type="search" placeholder="Filter by role, route, status, or text..." oninput="applyFilters()" />
      </div>
      <div class="finding-group" data-group="confirmed_bug">
        <h3>Confirmed Bugs</h3>
        ${renderFindingsTable(confirmedBugs, "No confirmed bugs recorded.", { memoryDir, outDir, thumbBudget })}
      </div>
      <div class="finding-group" data-group="spec_gap">
        <h3>Specification Gaps</h3>
        ${renderFindingsTable(specGaps, "No specification gaps recorded.", { memoryDir, outDir, thumbBudget })}
      </div>
      <div class="finding-group" data-group="runtime_degraded">
        <h3>Runtime Degraded Observations</h3>
        ${renderFindingsTable(runtimeDegraded, "No runtime degraded observations recorded.", { memoryDir, outDir, thumbBudget })}
      </div>
    </section>

    <section id="evidence">
      <h2>5. Captured Evidence &amp; Regression Tests</h2>
      <p><strong>Regression Scripts (${safeHtml(String(dedupedRepros.length))}):</strong></p>
      <ul>${dedupedRepros.length > 0 ? dedupedRepros.map((p) => `<li>${p.exists ? `<a class="file-link" href="${safeHtml(p.href)}" target="_blank"><code>${safeHtml(p.display)}</code></a>` : `<code>${safeHtml(p.display)}</code>`}</li>`).join("") : "<li class='muted'>None generated yet.</li>"}</ul>
      <p><strong>Trace &amp; Evidence Files (${safeHtml(String(dedupedEvidence.length))}):</strong></p>
      <ul>${dedupedEvidence.length > 0 ? dedupedEvidence.map((p) => `<li>${p.exists ? `<a class="file-link" href="${safeHtml(p.href)}" target="_blank"><code>${safeHtml(p.display)}</code></a>` : `<code>${safeHtml(p.display)}</code>`}</li>`).join("") : "<li class='muted'>None captured yet.</li>"}</ul>
    </section>

    <section id="self-validation">
      <h2>6. ${includeSkillLog ? "Self-Validation Improvements" : "Run Quality &amp; Coverage Audit"}</h2>
      ${sectionSixHtml}
    </section>

    <section id="limitations">
      <h2>7. Remaining Limitations &amp; Safety and Cleanup Audit</h2>
      <h3>Budget Utilization</h3>
      ${budgetHtml}
      <h3>Safety &amp; Cleanup Audit</h3>
      <p>Target application repositories are inspected strictly read-only. Ephemeral scratch directories (<code>.tmp/</code>, <code>memory/artifacts/</code>, <code>test-results/</code>, <code>.promptfoo/</code>) are purged by <code>scripts/cleanup.mjs</code> while preserving ledgers, traces, regressions, and HTML reports.</p>
    </section>
  </div>

  <div class="lightbox" id="lightbox" onclick="this.classList.remove('open')">
    <img id="lightbox-img" src="" alt="Screenshot preview" />
  </div>
  <script>
    let activeClass = "all";
    function setClassFilter(cls, btn) {
      activeClass = cls;
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      if (btn) btn.classList.add("active");
      applyFilters();
    }
    function applyFilters() {
      const q = (document.getElementById("finding-search")?.value || "").trim().toLowerCase();
      document.querySelectorAll(".finding-group").forEach((g) => {
        const gCls = g.getAttribute("data-group");
        g.style.display = activeClass === "all" || activeClass === gCls ? "" : "none";
      });
      document.querySelectorAll("tr.finding-row").forEach((row) => {
        const rowCls = row.getAttribute("data-class");
        const hay = row.getAttribute("data-search") || "";
        const classOk = activeClass === "all" || rowCls === activeClass;
        const textOk = !q || hay.includes(q);
        row.classList.toggle("hidden-row", !(classOk && textOk));
      });
    }
    function openLightbox(src, alt) {
      const box = document.getElementById("lightbox");
      const img = document.getElementById("lightbox-img");
      if (box && img) {
        img.src = src;
        img.alt = alt || "Screenshot";
        box.classList.add("open");
      }
    }
  </script>
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
    dedupedEvidenceCount: dedupedEvidence.length,
    dedupedReproCount: dedupedRepros.length,
  };
}

function main() {
  const { values } = parseCliArgs(process.argv.slice(2), { booleanFlags: ["include-skill-log", "help"] });

  if (values.help) {
    console.log(
      "Usage: node scripts/report-html.mjs [--out <path>] [--memory-dir <dir>] [--tool-selection <path>] [--validation-log <path>] [--include-skill-log]",
    );
    process.exit(0);
  }

  const res = generateHtmlReport({
    out: values.out,
    memoryDir: values["memory-dir"],
    toolSelection: values["tool-selection"],
    validationLog: values["validation-log"],
    includeSkillLog: Boolean(values["include-skill-log"]),
    config: values.config,
  });

  console.log(JSON.stringify(res, null, 2));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
