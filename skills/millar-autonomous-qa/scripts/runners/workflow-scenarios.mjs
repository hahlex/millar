#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ensureDir,
  fetchWithTimeout,
  loadConfigFile,
  MEMORY_DIR,
  parseCliArgs,
  parseNonNegativeNumber,
  sanitizeForOutput,
  sanitizeText,
  slugify,
  STAGING_ROOT,
  stripEmDash,
  TEST_RESULTS_DIR,
  toStagingRelPath,
  uniqueStrings,
  writeJsonAtomic,
  writeTextAtomic,
} from "../lib/common.mjs";
import { evaluateSafetyAndBudget } from "../safety-guard.mjs";
import { runVerifyOutcomes } from "../verify-outcomes.mjs";

function makeUniqueTag() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = crypto.randomBytes(3).toString("hex");
  return `${ts}-${process.pid}-${rand}`;
}

function buildOutput(fields) {
  return sanitizeForOutput({
    tool: "node",
    mode: "stateful",
    status: fields.status,
    startedAt: fields.startedAt,
    durationMs: Math.max(0, Date.now() - fields.startedMs),
    budgetConsumed: {
      requests: Math.max(0, Math.floor(fields.requests || 0)),
      aiCalls: 0,
    },
    coverage: {
      routes: uniqueStrings(fields.routes || []),
      endpoints: uniqueStrings(fields.endpoints || []),
      roles: uniqueStrings(fields.roles || []),
      assertions: Math.max(0, Math.floor(fields.assertions || 0)),
    },
    findings: fields.findings || [],
    artifacts: {
      traces: uniqueStrings(fields.traces || []),
      screenshots: [],
      regressionTests: uniqueStrings(fields.regressionTests || []),
    },
    notes: String(fields.notes || ""),
  });
}

function emitAndExit(output, outPath, exitCode = 0) {
  const clean = sanitizeForOutput(output);
  if (outPath) {
    writeJsonAtomic(path.resolve(process.cwd(), outPath), clean);
  }
  console.log(JSON.stringify(clean, null, 2));
  process.exit(exitCode);
}

function resolvePathCandidates(rawPath, searchDirs) {
  if (!rawPath || typeof rawPath !== "string") return "";
  const trimmed = rawPath.trim();
  if (!trimmed) return "";
  if (path.isAbsolute(trimmed)) return trimmed;
  for (const dir of searchDirs) {
    if (!dir) continue;
    const cand = path.resolve(dir, trimmed);
    if (fs.existsSync(cand)) return cand;
  }
  return path.resolve(searchDirs.find(Boolean) || process.cwd(), trimmed);
}

function interpolateValue(val, vars) {
  if (typeof val === "string") {
    return val.replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (_, key) =>
      vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : "",
    );
  }
  if (Array.isArray(val)) return val.map((item) => interpolateValue(item, vars));
  if (val && typeof val === "object") {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = interpolateValue(v, vars);
    }
    return out;
  }
  return val;
}

function getByPath(obj, dotPath) {
  if (!obj || typeof obj !== "object" || !dotPath) return undefined;
  const parts = String(dotPath).split(".");
  let cur = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (Array.isArray(cur) && /^\d+$/.test(part)) {
      cur = cur[Number.parseInt(part, 10)];
    } else if (typeof cur === "object") {
      cur = cur[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

function resolveRoleHeaders(rc) {
  const headers = {};
  if (!rc || typeof rc !== "object") return { headers, tokenEnv: "", headersEnv: "" };
  if (rc.headers && typeof rc.headers === "object" && !Array.isArray(rc.headers)) {
    for (const [k, v] of Object.entries(rc.headers)) {
      if (v !== undefined && v !== null) headers[String(k)] = String(v);
    }
  }
  const headersEnv = rc.headersEnv ? String(rc.headersEnv) : "";
  if (headersEnv && process.env[headersEnv]) {
    try {
      const parsed = JSON.parse(String(process.env[headersEnv]));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== undefined && v !== null) headers[String(k)] = String(v);
        }
      }
    } catch {
      // ignore
    }
  }
  const tokenEnv = rc.tokenEnv ? String(rc.tokenEnv) : "";
  const rawToken = rc.token || (tokenEnv ? process.env[tokenEnv] : null);
  if (rawToken && !Object.keys(headers).some((k) => k.toLowerCase() === "authorization")) {
    const tok = String(rawToken).trim();
    if (tok) headers.Authorization = tok.startsWith("Bearer ") ? tok : `Bearer ${tok}`;
  }
  return { headers, tokenEnv, headersEnv };
}

function extractSpecWorkflowInsights(specFiles) {
  const insights = [];
  for (const fp of specFiles) {
    if (!fp || !fs.existsSync(fp)) continue;
    try {
      const stat = fs.statSync(fp);
      if (!stat.isFile() || stat.size > 512000) continue;
      const content = fs.readFileSync(fp, "utf8");
      const headings = [];
      const criteria = [];
      for (const line of content.split(/\r?\n/)) {
        const hm = line.match(/^#{1,3}\s+(.+)$/);
        if (hm && headings.length < 15) {
          headings.push(sanitizeText(hm[1].trim()));
        }
        const bm = line.match(/^\s*[-*]\s+(.+)$/);
        if (
          bm &&
          criteria.length < 25 &&
          /(?:role|owner|admin|teacher|student|guardian|invite|enroll|invoice|email|mail|revoke|approve|publish|submit|grade|campus|tenant)/i.test(
            bm[1],
          )
        ) {
          criteria.push(sanitizeText(bm[1].trim()).slice(0, 180));
        }
      }
      insights.push({ file: path.basename(fp), headings, criteria });
    } catch {
      // ignore unreadable spec file
    }
  }
  return insights;
}

function generateWorkflowPlanMarkdown({ specInsights, workflows, roles }) {
  const lines = [
    "# Autonomous QA Spec-Driven Persona Workflow Plan",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "## 1. Configured Personas",
    "",
  ];
  if (roles.length === 0) {
    lines.push("- No authenticated personas configured.");
  } else {
    for (const r of roles) {
      lines.push(
        `- **${r.role || r.name || "role"}** (tenant=${r.tenantId || "default"}${r.campusId ? `, campus=${r.campusId}` : ""}${r.isCustomRole ? ", customRole=true" : ""})`,
      );
    }
  }

  lines.push("", "## 2. Spec-Derived Business Journeys (Read-Only Input)", "");
  if (specInsights.length === 0) {
    lines.push("- No `--spec-paths` files supplied; plan relies on declarative `workflows[]` in target config.");
  } else {
    for (const ins of specInsights) {
      lines.push(`### Source: ${ins.file}`);
      if (ins.headings.length > 0) {
        lines.push(`- Sections: ${ins.headings.slice(0, 8).join("; ")}`);
      }
      for (const c of ins.criteria.slice(0, 10)) {
        lines.push(`  - Candidate invariant: ${c}`);
      }
      lines.push("");
    }
  }

  lines.push("## 3. Executable Multi-Step Persona Workflows", "");
  if (workflows.length === 0) {
    lines.push("- No declarative `workflows[]` configured yet. Add `workflows` in target config to execute causal API/DB/Mailpit/Lifecycle scenarios automatically in `--depth=deep-business`.");
  } else {
    for (const wf of workflows) {
      lines.push(`### Workflow: ${wf.id || wf.name || "unnamed"}`);
      lines.push(`- Persona: \`${wf.persona || "default"}\``);
      const steps = Array.isArray(wf.steps) ? wf.steps : [];
      steps.forEach((st, i) => {
        const checks = [];
        if (st.expectStatus) checks.push(`status=${JSON.stringify(st.expectStatus)}`);
        if (st.expectMailpitMarker) checks.push(`mailpit=${st.expectMailpitMarker}`);
        if (st.expectPgQuery) checks.push(`pgMinRows=${st.expectPgMinRows ?? 1}`);
        if (st.cleanup) checks.push("cleanup=always");
        lines.push(
          `  ${i + 1}. \`${String(st.method || "GET").toUpperCase()} ${st.path || "/"}\` as \`${st.role || wf.persona || "default"}\` (${checks.join(", ") || "check status"})`,
        );
      });
      lines.push("");
    }
  }

  return stripEmDash(lines.join("\n") + "\n");
}

function buildWorkflowReproScript(finding, { apiOrigin, step, renderedPath, renderedBody, roleAuth }) {
  const safeId = stripEmDash(String(finding.id || "QA-WF-001")).replace(/[\r\n]+/g, " ");
  const safeTitle = stripEmDash(String(finding.title || "Workflow Step Defect")).replace(/[\r\n]+/g, " ");
  const safeHeaders = {};
  for (const [k, v] of Object.entries(roleAuth.headers || {})) {
    if (/^(?:authorization|cookie|x-api-key|x-auth-token)$/i.test(k)) continue;
    safeHeaders[k] = sanitizeText(v);
  }
  const expectedStatuses = Array.isArray(step.expectStatus)
    ? step.expectStatus.map(Number)
    : step.expectStatus !== undefined
      ? [Number(step.expectStatus)]
      : [200];

  return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}
const baseUrl = getFlag("--api-url", getFlag("--target-url", ${JSON.stringify(apiOrigin)}));
const url = new URL(${JSON.stringify(renderedPath)}, baseUrl).toString();
const method = ${JSON.stringify(String(step.method || "GET").toUpperCase())};
const expectedStatuses = ${JSON.stringify(expectedStatuses)};
const tokenEnv = getFlag("--token-env", ${JSON.stringify(roleAuth.tokenEnv || "")});
const headersEnv = getFlag("--headers-env", ${JSON.stringify(roleAuth.headersEnv || "")});
const headers = ${JSON.stringify(safeHeaders)};
if (headersEnv && process.env[headersEnv]) {
  try { Object.assign(headers, JSON.parse(process.env[headersEnv])); } catch {}
}
const tok = tokenEnv ? String(process.env[tokenEnv] || "").trim() : "";
if (tokenEnv && !tok) {
  console.error("AUTH_ENV_REQUIRED", ${JSON.stringify(safeId)}, "tokenEnv=" + tokenEnv);
  process.exit(2);
}
if (tok && !Object.keys(headers).some((k) => k.toLowerCase() === "authorization")) {
  headers.Authorization = tok.startsWith("Bearer ") ? tok : "Bearer " + tok;
}
const bodyStr = ${renderedBody !== undefined ? JSON.stringify(JSON.stringify(renderedBody)) : "undefined"};
if (bodyStr !== undefined) headers["Content-Type"] = "application/json";
try {
  const res = await fetch(url, { method, headers, body: bodyStr, signal: AbortSignal.timeout(5000) });
  if (!expectedStatuses.includes(res.status)) {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "status=" + res.status, "expected=" + expectedStatuses.join(","));
    process.exit(1);
  }
  console.log("RESOLVED", ${JSON.stringify(safeId)}, "status=" + res.status);
  process.exit(0);
} catch (err) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, err instanceof Error ? err.message : String(err));
  process.exit(1);
}
`;
}

async function main() {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();

  const { values } = parseCliArgs(process.argv.slice(2), {
    booleanFlags: ["dry-run", "allow-private-ip", "help"],
    multiFlags: ["spec-path", "repo-path"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/runners/workflow-scenarios.mjs [--config <path>] --api-url <url> [--mailpit-url <url>] [--spec-path <md>] [--max-requests N] [--memory-dir <dir>] [--trace-dir <dir>] [--out <file>] [--dry-run]",
    );
    process.exit(0);
  }

  const resolvedConfig = values.config ? resolvePathCandidates(values.config, [process.cwd(), STAGING_ROOT]) : undefined;
  const cfg = resolvedConfig && fs.existsSync(resolvedConfig) ? loadConfigFile(resolvedConfig) : {};
  const configDir = resolvedConfig ? path.dirname(resolvedConfig) : null;
  const apiUrl = values["api-url"] ?? cfg.apiUrl ?? values["target-url"] ?? cfg.targetUrl;
  const mailpitUrl = values["mailpit-url"] ?? cfg.mailpitUrl;
  const memoryDir = path.resolve(values["memory-dir"] || MEMORY_DIR);
  const traceDir = path.resolve(values["trace-dir"] || path.join(memoryDir, "traces"));
  const regDir = path.join(memoryDir, "regressions");
  const maxRequests = Math.max(1, parseNonNegativeNumber(values["max-requests"], 40, "--max-requests"));
  const dryRun = Boolean(values["dry-run"]);
  const allowPrivateIp = Boolean(values["allow-private-ip"] || cfg.allowPrivateIp);

  if (!apiUrl) {
    emitAndExit(
      buildOutput({
        status: "skipped_non_applicable",
        startedAt,
        startedMs,
        notes: "No --api-url provided; skipping persona workflow scenarios.",
      }),
      values.out,
      0,
    );
  }

  const safetyCheck = evaluateSafetyAndBudget({
    config: resolvedConfig,
    apiUrl,
    mailpitUrl,
    allowPrivateIp,
    budgetFile: path.join(TEST_RESULTS_DIR, `.guard-wf-${process.pid}-${Date.now()}.json`),
    ignoreAiCap: true,
    dryRun: true,
  });
  if (safetyCheck.exitCode === 2) {
    emitAndExit(
      buildOutput({
        status: "failed",
        startedAt,
        startedMs,
        findings: [
          {
            id: "QA-WF-SAFETY-001",
            classification: "runtime_degraded",
            severity: "critical",
            title: "Safety guard rejected workflow target URL",
            reproCommand: `node scripts/safety-guard.mjs --api-url ${apiUrl}`,
            evidencePaths: [],
            verifiedOutcome: (safetyCheck.payload?.reasons || []).join("; ") || "Safety violation",
          },
        ],
        notes: "Safety guard blocked workflow scenario runner.",
      }),
      values.out,
      2,
    );
  }

  const specPathsRaw = uniqueStrings([
    ...(Array.isArray(values["spec-path"]) ? values["spec-path"] : []),
    ...(Array.isArray(cfg.specPaths) ? cfg.specPaths : []),
  ]);
  const specFiles = specPathsRaw
    .map((p) => resolvePathCandidates(p, [process.cwd(), configDir, STAGING_ROOT]))
    .filter((p) => p && fs.existsSync(p));
  const workflows = Array.isArray(cfg.workflows) ? cfg.workflows.filter((w) => w && typeof w === "object") : [];
  const roles = Array.isArray(cfg.roles) ? cfg.roles : Array.isArray(cfg.accounts) ? cfg.accounts : [];

  if (dryRun) {
    emitAndExit(
      buildOutput({
        status: "skipped_non_applicable",
        startedAt,
        startedMs,
        notes: `Dry run enabled; planned ${workflows.length} workflow(s) and ${specFiles.length} spec file(s).`,
      }),
      values.out,
      0,
    );
  }

  ensureDir(memoryDir);
  ensureDir(traceDir);
  ensureDir(regDir);

  const specInsights = extractSpecWorkflowInsights(specFiles);
  const planPath = path.join(memoryDir, "workflow-plan.md");
  writeTextAtomic(planPath, generateWorkflowPlanMarkdown({ specInsights, workflows, roles }));

  const uniqueTag = makeUniqueTag();
  const tracePath = path.join(traceDir, `workflow-scenarios-${uniqueTag}.json`);
  const relTracePath = toStagingRelPath(tracePath);
  const apiOrigin = new URL(apiUrl).origin;

  if (workflows.length === 0) {
    const out = buildOutput({
      status: specInsights.length > 0 ? "passed" : "skipped_non_applicable",
      startedAt,
      startedMs,
      assertions: specInsights.length > 0 ? 1 : 0,
      traces: [relTracePath],
      notes:
        specInsights.length > 0
          ? `Generated spec-driven workflow plan (${toStagingRelPath(planPath)}) from ${specInsights.length} spec file(s); no declarative workflows[] configured to execute.`
          : "No declarative workflows[] or --spec-path files configured; skipped workflow execution.",
    });
    writeJsonAtomic(tracePath, { ...out, planPath: toStagingRelPath(planPath), specInsights });
    emitAndExit(out, values.out, 0);
  }

  const findings = [];
  const regressionTests = [];
  const endpointsCovered = [];
  const rolesCovered = [];
  const workflowLogs = [];
  let requestsUsed = 0;
  let assertions = 0;
  const softDeadlineMs = startedMs + 45000;

  for (const wf of workflows) {
    if (requestsUsed >= maxRequests || Date.now() >= softDeadlineMs) break;
    const wfId = String(wf.id || wf.name || `wf-${workflowLogs.length + 1}`);
    const vars = {
      runTag: `${process.pid}-${crypto.randomBytes(3).toString("hex")}`,
      timestamp: new Date().toISOString(),
      ...(wf.vars && typeof wf.vars === "object" ? wf.vars : {}),
    };
    const steps = Array.isArray(wf.steps) ? wf.steps : [];
    const mainSteps = steps.filter((s) => !s?.cleanup);
    const cleanupSteps = steps.filter((s) => Boolean(s?.cleanup));
    const stepRecords = [];
    let wfAborted = false;

    const executeStep = async (step, isCleanup = false) => {
      const roleName = String(step.role || wf.persona || "anonymous");
      const roleCfg = roles.find((r) => String(r.role || r.name) === roleName) || null;
      const roleAuth = resolveRoleHeaders(roleCfg);
      const method = String(step.method || "GET").toUpperCase();
      const renderedPath = interpolateValue(String(step.path || "/"), vars);
      const renderedBody = step.body !== undefined ? interpolateValue(step.body, vars) : undefined;
      const url = new URL(renderedPath, apiOrigin).toString();
      const hdrs = { ...roleAuth.headers };
      if (renderedBody !== undefined) hdrs["Content-Type"] = "application/json";

      requestsUsed += 1;
      assertions += 1;
      rolesCovered.push(roleName);
      endpointsCovered.push(`${method} ${renderedPath.split("?")[0]}`);

      const res = await fetchWithTimeout(
        url,
        {
          method,
          headers: hdrs,
          body: renderedBody !== undefined ? JSON.stringify(renderedBody) : undefined,
        },
        6000,
      );

      // Extract saved vars for downstream workflow steps
      if (step.saveVars && typeof step.saveVars === "object" && res.json && typeof res.json === "object") {
        for (const [varName, jsonPath] of Object.entries(step.saveVars)) {
          const extracted = getByPath(res.json, jsonPath);
          if (extracted !== undefined && extracted !== null) {
            vars[varName] = extracted;
          }
        }
      }

      const expectedStatuses = Array.isArray(step.expectStatus)
        ? step.expectStatus.map(Number)
        : step.expectStatus !== undefined
          ? [Number(step.expectStatus)]
          : null;

      let stepFailedReason = null;
      if (res.status === 0 || res.timedOut) {
        stepFailedReason = `Request unreachable or timed out: ${res.error || "timeout"}`;
      } else if (expectedStatuses && !expectedStatuses.includes(res.status)) {
        stepFailedReason = `Expected HTTP ${expectedStatuses.join("/")}, got HTTP ${res.status}: ${sanitizeText((res.text || "").slice(0, 200))}`;
      } else if (!expectedStatuses && res.status >= 500) {
        stepFailedReason = `Unexpected server error HTTP ${res.status}`;
      }

      if (!stepFailedReason && Array.isArray(step.forbidResponsePatterns)) {
        const lowerBody = String(res.text || "").toLowerCase();
        for (const pat of step.forbidResponsePatterns) {
          if (lowerBody.includes(String(pat).toLowerCase())) {
            stepFailedReason = `Response leaked forbidden pattern "${pat}"`;
            break;
          }
        }
      }

      if (!stepFailedReason && step.expectJsonContains && typeof step.expectJsonContains === "object") {
        for (const [dotKey, expectedVal] of Object.entries(step.expectJsonContains)) {
          const actualVal = getByPath(res.json, dotKey);
          if (String(actualVal) !== String(interpolateValue(expectedVal, vars))) {
            stepFailedReason = `Expected JSON "${dotKey}" == "${expectedVal}", got "${actualVal}"`;
            break;
          }
        }
      }

      // Causal Mailpit outbox verification right after step
      let mailpitOutcome = null;
      if (!stepFailedReason && step.expectMailpitMarker && mailpitUrl) {
        const marker = interpolateValue(String(step.expectMailpitMarker), vars);
        const waitMs = parseNonNegativeNumber(step.expectMailpitWithinMs, 3500, "expectMailpitWithinMs");
        const verOut = await runVerifyOutcomes({
          mailpitUrl,
          expectMailpitMarker: marker,
          expectMailpitWithinMs: waitMs,
          memoryDir,
          timeoutMs: 3000,
        });
        requestsUsed += verOut.budgetConsumed?.requests || 1;
        assertions += 1;
        mailpitOutcome = verOut.status;
        if (verOut.status === "failed") {
          stepFailedReason = `Causal email outbox failed: Mailpit missing expected marker "${marker}" within ${waitMs}ms`;
        }
      }

      // Causal Postgres row check right after step
      let pgOutcome = null;
      if (!stepFailedReason && step.expectPgQuery) {
        const renderedSql = interpolateValue(String(step.expectPgQuery), vars);
        const minRows = step.expectPgMinRows !== undefined ? Number(step.expectPgMinRows) : 1;
        const verOut = await runVerifyOutcomes({
          config: resolvedConfig,
          pgQuery: renderedSql,
          expectPgMinRows: minRows,
          memoryDir,
          timeoutMs: 3000,
        });
        assertions += 1;
        pgOutcome = verOut.status;
        if (verOut.status === "failed") {
          stepFailedReason = `Causal Postgres check failed: query returned fewer than ${minRows} row(s)`;
        }
      }

      stepRecords.push({
        name: step.name || `${method} ${renderedPath}`,
        isCleanup,
        role: roleName,
        method,
        path: renderedPath,
        status: res.status,
        mailpitOutcome,
        pgOutcome,
        failedReason: stepFailedReason,
      });

      if (stepFailedReason && !isCleanup) {
        const finding = {
          id: `QA-WF-${String(findings.length + 1).padStart(3, "0")}`,
          fingerprint: `confirmed_bug|workflow:${wfId}:${step.name || method + " " + renderedPath}`,
          classification: res.status === 0 ? "runtime_degraded" : "confirmed_bug",
          severity: step.severity || "high",
          title: `Workflow "${wfId}" step "${step.name || renderedPath}" failed (${roleName})`,
          endpointOrRoute: `${method} ${renderedPath.split("?")[0]}`,
          checkMode: "workflow_step",
          role: roleName,
          ...(roleAuth.tokenEnv ? { authRequired: true, tokenEnv: roleAuth.tokenEnv } : {}),
          ...(roleAuth.headersEnv ? { headersEnv: roleAuth.headersEnv } : {}),
          reproCommand: `curl -i -X ${method} ${url}`,
          evidencePaths: [relTracePath],
          verifiedOutcome: sanitizeText(stepFailedReason),
        };
        if (finding.classification === "confirmed_bug") {
          const regAbs = path.join(regDir, `wf-${slugify(wfId, 14)}-${slugify(finding.id, 10)}-${uniqueTag}.mjs`);
          writeTextAtomic(
            regAbs,
            buildWorkflowReproScript(finding, {
              apiOrigin,
              step,
              renderedPath,
              renderedBody,
              roleAuth,
            }),
          );
          try {
            execFileSync(process.execPath, ["--check", regAbs], { windowsHide: true, timeout: 4000 });
            const relReg = toStagingRelPath(regAbs);
            finding.reproScript = relReg;
            regressionTests.push(relReg);
          } catch {
            fs.rmSync(regAbs, { force: true });
          }
        }
        findings.push(finding);
        if (step.stopOnFailure !== false) {
          wfAborted = true;
        }
      }
    };

    try {
      for (const st of mainSteps) {
        if (wfAborted || requestsUsed >= maxRequests || Date.now() >= softDeadlineMs) break;
        await executeStep(st, false);
      }
    } finally {
      for (const cst of cleanupSteps) {
        await executeStep(cst, true).catch(() => {});
      }
    }

    workflowLogs.push({ id: wfId, name: wf.name || wfId, persona: wf.persona || "default", steps: stepRecords });
  }

  let status = "passed";
  if (findings.some((f) => f.classification === "confirmed_bug")) {
    status = "failed";
  } else if (findings.some((f) => f.classification === "runtime_degraded")) {
    status = "degraded";
  }

  const output = buildOutput({
    status,
    startedAt,
    startedMs,
    requests: requestsUsed,
    endpoints: endpointsCovered,
    roles: rolesCovered,
    assertions,
    findings,
    traces: [relTracePath],
    regressionTests,
    notes: `Executed ${workflowLogs.length} persona workflow(s) (${requestsUsed} step request(s), ${assertions} assertion(s), ${findings.length} finding(s)); plan written to ${toStagingRelPath(planPath)}.`,
  });

  writeJsonAtomic(tracePath, {
    ...output,
    planPath: toStagingRelPath(planPath),
    specInsights,
    workflows: workflowLogs,
  });

  emitAndExit(output, values.out, 0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
