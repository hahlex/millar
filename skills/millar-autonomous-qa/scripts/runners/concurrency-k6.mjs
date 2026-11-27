#!/usr/bin/env node
import { execFileSync, spawn, spawnSync } from "node:child_process";
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

function makeUniqueTag() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = crypto.randomBytes(3).toString("hex");
  return `${ts}-${process.pid}-${rand}`;
}

function buildOutput(fields) {
  return sanitizeForOutput({
    tool: "k6",
    mode: "concurrency",
    status: fields.status,
    startedAt: fields.startedAt,
    durationMs: Math.max(0, Date.now() - fields.startedMs),
    budgetConsumed: {
      requests: Math.max(0, Math.floor(fields.requests || 0)),
      aiCalls: 0,
    },
    coverage: {
      routes: [],
      endpoints: uniqueStrings(fields.endpoints || []),
      roles: uniqueStrings(fields.roles || ["anonymous"]),
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

function toDockerHostUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  const originalHost = parsed.host;
  const h = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "127.0.0.1" || h === "localhost" || h === "::1") {
    parsed.hostname = "host.docker.internal";
  }
  return { dockerUrl: parsed.toString(), originalHost, origin: new URL(rawUrl).origin };
}

function killChildTree(child) {
  if (!child || !child.pid) return;
  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore", windowsHide: true });
    } else {
      child.kill("SIGKILL");
    }
  } catch {
    // ignore
  }
}

function runDockerK6(scriptSource, vus, iterations, timeoutMs = 19000) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const child = spawn(
      "docker",
      [
        "run",
        "--rm",
        "-i",
        "--add-host=host.docker.internal:host-gateway",
        "grafana/k6:latest",
        "run",
        "--quiet",
        "--vus",
        String(vus),
        "--iterations",
        String(iterations),
        "-",
      ],
      { cwd: STAGING_ROOT, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
    );

    const timer = setTimeout(() => {
      timedOut = true;
      killChildTree(child);
    }, timeoutMs);

    child.stdout.on("data", (c) => {
      stdout += c.toString("utf8");
    });
    child.stderr.on("data", (c) => {
      stderr += c.toString("utf8");
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ exitCode: -1, stdout, stderr: err.message, timedOut, error: err.message });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ exitCode: code ?? -1, stdout, stderr, timedOut, error: null });
    });

    child.stdin.write(scriptSource);
    child.stdin.end();
  });
}

function resolveAuthFromConfig(cfg, tokenEnvFlag) {
  if (tokenEnvFlag) {
    const flagTok = String(process.env[tokenEnvFlag] || "").trim();
    if (flagTok) {
      return { token: flagTok, role: "configured", tokenEnv: tokenEnvFlag, missingTokenEnv: false };
    }
    return { token: null, role: "configured", tokenEnv: tokenEnvFlag, missingTokenEnv: true };
  }
  const roles = Array.isArray(cfg.roles) ? cfg.roles : Array.isArray(cfg.accounts) ? cfg.accounts : [];
  for (const r of roles) {
    if (!r || typeof r !== "object") continue;
    const tok = r.token || (r.tokenEnv ? process.env[r.tokenEnv] : null);
    if (tok) {
      return {
        token: String(tok),
        role: String(r.role || r.name || "configured"),
        tokenEnv: r.tokenEnv ? String(r.tokenEnv) : "QA_TOKEN",
        missingTokenEnv: false,
      };
    }
  }
  return { token: null, role: "anonymous", tokenEnv: null, missingTokenEnv: false };
}

function buildRaceReproScript(finding, apiOrigin, method, targetEndpoint, tokenEnv) {
  const safeId = stripEmDash(String(finding.id || "QA-K6-001")).replace(/[\r\n]+/g, " ");
  const safeTitle = stripEmDash(String(finding.title || "Concurrency Race Defect")).replace(/[\r\n]+/g, " ");
  const defaultTokenEnv = String(tokenEnv || "");
  return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}
const baseUrl = getFlag("--api-url", getFlag("--target-url", ${JSON.stringify(apiOrigin)}));
const targetUrl = new URL(${JSON.stringify(targetEndpoint)}, baseUrl).toString();
const method = ${JSON.stringify(method)};
const tokenEnvName = getFlag("--token-env", ${JSON.stringify(defaultTokenEnv)});
const authToken = tokenEnvName ? String(process.env[tokenEnvName] || "").trim() : "";
if (tokenEnvName && !authToken) {
  console.error("AUTH_ENV_REQUIRED", ${JSON.stringify(safeId)}, "mode=race_condition", "tokenEnv=" + tokenEnvName);
  process.exit(2);
}
const idempotencyKey = "qa-race-repro-" + process.pid + "-" + Date.now();
const headers = { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey };
if (authToken) headers.Authorization = authToken.startsWith("Bearer ") ? authToken : "Bearer " + authToken;
const body = JSON.stringify({ idempotencyKey });
try {
  const responses = await Promise.all(
    Array.from({ length: 4 }, () =>
      fetch(targetUrl, {
        method,
        headers,
        body: method === "GET" || method === "HEAD" ? undefined : body,
        signal: AbortSignal.timeout(4000),
      }),
    ),
  );
  const statuses = responses.map((r) => r.status);
  const hits200 = statuses.filter((s) => s === 200).length;
  const hits5xx = statuses.filter((s) => s >= 500).length;
  if (hits200 > 1 || hits5xx > 0) {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "statuses=" + statuses.join(","), "url=" + targetUrl);
    process.exit(1);
  }
  console.log("RESOLVED", ${JSON.stringify(safeId)}, "statuses=" + statuses.join(","), "url=" + targetUrl);
  process.exit(0);
} catch (err) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, err instanceof Error ? err.message : String(err));
  process.exit(1);
}
`;
}

function buildK6Script({ targetDockerUrl, originalHost, method, isRaceEndpoint, idempotencyKey, authToken }) {
  const hasBody = method === "POST" || method === "PUT" || method === "PATCH";
  const payload = isRaceEndpoint ? JSON.stringify({ idempotencyKey }) : hasBody ? JSON.stringify({}) : null;
  const headersObj = {
    Host: originalHost,
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
  };
  if (authToken) {
    headersObj.Authorization = authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`;
  }
  return `
import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const race200 = new Counter("race_200_hits");
const http5xx = new Counter("http_5xx_hits");
const netErrors = new Counter("net_error_hits");

export default function () {
  const params = {
    headers: ${JSON.stringify(headersObj)},
    timeout: "4s"
  };
  const res = http.request(${JSON.stringify(method)}, ${JSON.stringify(targetDockerUrl)}, ${
    payload !== null ? JSON.stringify(payload) : "null"
  }, params);
  if (res.status === 0) netErrors.add(1);
  if (res.status >= 500) http5xx.add(1);
  if (${isRaceEndpoint ? "true" : "false"} && res.status === 200) race200.add(1);
  check(res, {
    "status < 500": (r) => r.status > 0 && r.status < 500
  });
}

export function handleSummary(data) {
  const m = data.metrics || {};
  const summary = {
    http_reqs: m.http_reqs?.values?.count ?? 0,
    http_req_failed_rate: m.http_req_failed?.values?.rate ?? 0,
    p95_ms: m.http_req_duration?.values?.["p(95)"] ?? 0,
    avg_ms: m.http_req_duration?.values?.avg ?? 0,
    race_200_hits: m.race_200_hits?.values?.count ?? 0,
    http_5xx_hits: m.http_5xx_hits?.values?.count ?? 0,
    net_error_hits: m.net_error_hits?.values?.count ?? 0,
    checks_passes: m.checks?.values?.passes ?? 0,
    checks_fails: m.checks?.values?.fails ?? 0
  };
  return {
    stdout: JSON.stringify(summary) + "\\n"
  };
}
`;
}

async function main() {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();

  const { values } = parseCliArgs(process.argv.slice(2), {
    booleanFlags: ["dry-run", "allow-private-ip", "help"],
    multiFlags: ["repo-path"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/runners/concurrency-k6.mjs [--config <path>] --api-url <url> [--endpoint <path>] [--race-endpoint <path>] [--method <GET|POST|PUT|PATCH|DELETE>] [--vus N] [--iterations N] [--max-requests N] [--memory-dir <dir>] [--trace-dir <dir>] [--out <file>] [--dry-run]",
    );
    process.exit(0);
  }

  const cfg = values.config ? loadConfigFile(values.config) : {};
  const apiUrl = values["api-url"] ?? cfg.apiUrl ?? values["target-url"] ?? cfg.targetUrl;
  const memoryDir = path.resolve(values["memory-dir"] || MEMORY_DIR);
  const traceDir = path.resolve(values["trace-dir"] || path.join(memoryDir, "traces"));
  let vus = Math.max(1, Math.min(10, parseNonNegativeNumber(values.vus, 2, "--vus")));
  const maxRequests = Math.max(1, parseNonNegativeNumber(values["max-requests"], 40, "--max-requests"));
  const requestedIters = Math.max(vus, parseNonNegativeNumber(values.iterations, 4, "--iterations"));
  const iterations = Math.max(1, Math.min(requestedIters, maxRequests));
  vus = Math.max(1, Math.min(vus, iterations));
  const dryRun = Boolean(values["dry-run"]);
  const allowPrivateIp = Boolean(values["allow-private-ip"] || cfg.allowPrivateIp);
  const privIpFlag = allowPrivateIp ? " --allow-private-ip" : "";

  if (!apiUrl) {
    emitAndExit(
      buildOutput({
        status: "skipped_non_applicable",
        startedAt,
        startedMs,
        notes: "No --api-url or --target-url provided; skipping k6 concurrency runner.",
      }),
      values.out,
      0,
    );
  }

  const safetyCheck = evaluateSafetyAndBudget({
    config: values.config,
    apiUrl,
    allowPrivateIp,
    budgetFile: path.join(TEST_RESULTS_DIR, `.guard-k6-${process.pid}-${Date.now()}.json`),
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
            id: "QA-K6-SAFETY-001",
            classification: "runtime_degraded",
            severity: "critical",
            title: "Safety guard rejected target URL",
            reproCommand: `node scripts/safety-guard.mjs --api-url ${apiUrl}`,
            evidencePaths: [],
            verifiedOutcome: (safetyCheck.payload?.reasons || []).join("; ") || "Safety violation",
          },
        ],
        notes: "Safety guard blocked target URL.",
      }),
      values.out,
      2,
    );
  }

  if (dryRun) {
    emitAndExit(
      buildOutput({
        status: "skipped_non_applicable",
        startedAt,
        startedMs,
        notes: "Dry run enabled; skipped Docker k6 burst.",
      }),
      values.out,
      0,
    );
  }

  ensureDir(traceDir);
  const uniqueTag = makeUniqueTag();
  const tracePath = path.join(traceDir, `concurrency-k6-${uniqueTag}.json`);
  const relTracePath = toStagingRelPath(tracePath);

  const apiOrigin = new URL(apiUrl).origin;
  const authInfo = resolveAuthFromConfig(cfg, values["token-env"]);
  if (authInfo.missingTokenEnv) {
    console.error(`AUTH_ENV_REQUIRED QA-K6-AUTH tokenEnv=${authInfo.tokenEnv}`);
    emitAndExit(
      buildOutput({
        status: "failed",
        startedAt,
        startedMs,
        findings: [
          {
            id: "QA-K6-AUTH-001",
            classification: "runtime_degraded",
            severity: "high",
            title: `Required runtime auth environment variable ${authInfo.tokenEnv} is unset`,
            ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
            reproCommand: `node scripts/runners/concurrency-k6.mjs --api-url ${apiUrl} --token-env ${authInfo.tokenEnv}${privIpFlag}`,
            evidencePaths: [],
            verifiedOutcome: `AUTH_ENV_REQUIRED tokenEnv=${authInfo.tokenEnv}`,
          },
        ],
        notes: `Missing required runtime auth env ${authInfo.tokenEnv}.`,
      }),
      values.out,
      2,
    );
  }
  const cliEndpoint = values.endpoint ? String(values.endpoint).trim() : "";
  const cliRaceEndpoint = values["race-endpoint"] ? String(values["race-endpoint"]).trim() : "";
  const cfgRaceEndpoint = cfg.raceEndpoint ? String(cfg.raceEndpoint).trim() : "";
  let targetEndpoint = cliEndpoint || cliRaceEndpoint || cfgRaceEndpoint || cfg.concurrencyEndpoint || null;
  const allowedMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
  const rawExplicitMethod = values.method ? String(values.method).trim().toUpperCase() : "";
  const explicitMethod = allowedMethods.has(rawExplicitMethod) ? rawExplicitMethod : null;
  const rawCfgRaceMethod = cfg.raceMethod ? String(cfg.raceMethod).trim().toUpperCase() : "";
  const cfgRaceMethod = allowedMethods.has(rawCfgRaceMethod) ? rawCfgRaceMethod : null;
  let method = explicitMethod || "GET";
  let isRaceEndpoint = false;
  let probeRequests = 0;
  const explicitRaceConfigured =
    Boolean(cliRaceEndpoint) ||
    Boolean(!cliEndpoint && cfgRaceEndpoint) ||
    Boolean(cliEndpoint && cfgRaceEndpoint && cliEndpoint === cfgRaceEndpoint);

  if (!targetEndpoint) {
    // Probe /openapi.json to see if a race/idempotency endpoint exists; fallback to authenticated endpoint or /healthz
    probeRequests += 1;
    const specRes = await fetchWithTimeout(`${apiOrigin}/openapi.json`, { method: "GET" }, 2000);
    if (specRes.ok && specRes.json?.paths?.["/api/race"]?.post) {
      targetEndpoint = "/api/race";
      method = explicitMethod || "POST";
      isRaceEndpoint = true;
    } else if (authInfo.token) {
      probeRequests += 1;
      const authProbe = await fetchWithTimeout(
        `${apiOrigin}/v1/education/courses`,
        { method: "GET", headers: { Authorization: `Bearer ${authInfo.token}` } },
        2000,
      );
      if (authProbe.ok) {
        targetEndpoint = "/v1/education/courses";
        method = explicitMethod || "GET";
      } else {
        targetEndpoint = "/healthz";
        method = explicitMethod || "GET";
      }
    } else {
      targetEndpoint = "/healthz";
      method = explicitMethod || "GET";
    }
  } else if (explicitRaceConfigured || targetEndpoint.includes("race")) {
    method = explicitMethod || cfgRaceMethod || "POST";
    isRaceEndpoint = true;
  } else {
    method = explicitMethod || "GET";
  }

  const fullTargetUrl = new URL(targetEndpoint, apiOrigin).toString();
  const { dockerUrl, originalHost } = toDockerHostUrl(fullTargetUrl);
  const idempotencyKey = `qa-race-${process.pid}-${Date.now()}`;
  const k6Source = buildK6Script({
    targetDockerUrl: dockerUrl,
    originalHost,
    method,
    isRaceEndpoint,
    idempotencyKey,
    authToken: authInfo.token,
  });

  const dockerRes = await runDockerK6(k6Source, vus, iterations, 19000);
  const findings = [];
  const regressionTests = [];
  const regDir = path.join(memoryDir, "regressions");
  let summary = null;
  for (const line of dockerRes.stdout.split(/\r?\n/).reverse()) {
    const trimmed = line.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        summary = JSON.parse(trimmed);
        break;
      } catch {
        // continue
      }
    }
  }

  let status = "passed";
  let assertions = 0;
  let k6Requests = 0;

  if (!summary || dockerRes.timedOut || summary.http_reqs === 0 || summary.net_error_hits >= summary.http_reqs) {
    status = "degraded";
    findings.push({
      id: "QA-K6-DEGRADED-001",
      fingerprint: `runtime_degraded|k6:${targetEndpoint}`,
      classification: "runtime_degraded",
      severity: "medium",
      title: "k6 Docker concurrency burst failed or target unreachable",
      endpointOrRoute: `${method} ${targetEndpoint}`,
      checkMode: "unreachable",
      ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
      reproCommand: `node scripts/runners/concurrency-k6.mjs --api-url ${apiUrl} --vus ${vus} --iterations ${iterations}${privIpFlag}`,
      evidencePaths: [relTracePath],
      verifiedOutcome: sanitizeText(
        dockerRes.timedOut
          ? "k6 Docker execution timed out"
          : dockerRes.stderr || dockerRes.error || "Zero HTTP responses recorded by k6",
      ).slice(0, 300),
    });
  } else {
    k6Requests = summary.http_reqs || iterations;
    assertions = (summary.checks_passes || 0) + (summary.checks_fails || 0) + 1;

    if (isRaceEndpoint && summary.race_200_hits > 1) {
      status = "failed";
      const raceFinding = {
        id: "QA-K6-001",
        fingerprint: `confirmed_bug|race:${method} ${targetEndpoint}`,
        classification: "confirmed_bug",
        severity: "high",
        title: `Concurrent idempotency race allowed ${summary.race_200_hits} duplicate HTTP 200 responses`,
        endpointOrRoute: `${method} ${targetEndpoint}`,
        checkMode: "race_condition",
        method,
        ...(authInfo.tokenEnv ? { tokenEnv: authInfo.tokenEnv } : {}),
        ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
        reproCommand: `node scripts/runners/concurrency-k6.mjs --api-url ${apiUrl} ${isRaceEndpoint ? "--race-endpoint" : "--endpoint"} ${targetEndpoint} --method ${method} --vus ${vus} --iterations ${iterations}${authInfo.tokenEnv ? ` --token-env ${authInfo.tokenEnv}` : ""}${privIpFlag}`,
        evidencePaths: [relTracePath],
        verifiedOutcome: `Sent ${iterations} concurrent requests with shared Idempotency-Key; expected at most 1 HTTP 200, observed ${summary.race_200_hits}`,
      };
      ensureDir(regDir);
      const regAbs = path.join(regDir, `k6-${slugify(raceFinding.id, 14)}-${uniqueTag}.mjs`);
      writeTextAtomic(regAbs, buildRaceReproScript(raceFinding, apiOrigin, method, targetEndpoint, authInfo.tokenEnv));
      try {
        execFileSync(process.execPath, ["--check", regAbs], { windowsHide: true, timeout: 4000 });
        const relReg = toStagingRelPath(regAbs);
        raceFinding.reproScript = relReg;
        regressionTests.push(relReg);
      } catch {
        fs.rmSync(regAbs, { force: true });
      }
      findings.push(raceFinding);
    }
    if ((summary.net_error_hits || 0) > 0) {
      status = "failed";
      findings.push({
        id: `QA-K6-${String(findings.length + 1).padStart(3, "0")}`,
        fingerprint: `confirmed_bug|k6_net_err:${method} ${targetEndpoint}`,
        classification: "confirmed_bug",
        severity: "high",
        title: `Concurrent load triggered ${summary.net_error_hits} network/connection error(s) on ${targetEndpoint}`,
        endpointOrRoute: `${method} ${targetEndpoint}`,
        checkMode: "k6_net_error",
        method,
        ...(authInfo.tokenEnv ? { tokenEnv: authInfo.tokenEnv } : {}),
        ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
        reproCommand: `node scripts/runners/concurrency-k6.mjs --api-url ${apiUrl} ${isRaceEndpoint ? "--race-endpoint" : "--endpoint"} ${targetEndpoint} --method ${method} --vus ${vus} --iterations ${iterations}${authInfo.tokenEnv ? ` --token-env ${authInfo.tokenEnv}` : ""}${privIpFlag}`,
        evidencePaths: [relTracePath],
        verifiedOutcome: `k6 observed net_error_hits=${summary.net_error_hits} out of ${k6Requests} request(s) under ${vus} VUs`,
      });
    }
    if ((summary.http_5xx_hits || 0) > 0) {
      status = "failed";
      findings.push({
        id: `QA-K6-${String(findings.length + 1).padStart(3, "0")}`,
        fingerprint: `confirmed_bug|k6_5xx:${method} ${targetEndpoint}`,
        classification: "confirmed_bug",
        severity: "high",
        title: `Concurrent load triggered ${summary.http_5xx_hits} HTTP 5xx response(s) on ${targetEndpoint}`,
        endpointOrRoute: `${method} ${targetEndpoint}`,
        checkMode: "k6_http_5xx",
        method,
        ...(authInfo.tokenEnv ? { tokenEnv: authInfo.tokenEnv } : {}),
        ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
        reproCommand: `node scripts/runners/concurrency-k6.mjs --api-url ${apiUrl} ${isRaceEndpoint ? "--race-endpoint" : "--endpoint"} ${targetEndpoint} --method ${method} --vus ${vus} --iterations ${iterations}${authInfo.tokenEnv ? ` --token-env ${authInfo.tokenEnv}` : ""}${privIpFlag}`,
        evidencePaths: [relTracePath],
        verifiedOutcome: `k6 observed ${summary.http_5xx_hits} HTTP >= 500 responses under ${vus} VUs`,
      });
    }
    if ((summary.p95_ms || 0) > 2500) {
      status = "failed";
      findings.push({
        id: `QA-K6-${String(findings.length + 1).padStart(3, "0")}`,
        fingerprint: `confirmed_bug|k6_p95:${targetEndpoint}`,
        classification: "confirmed_bug",
        severity: "medium",
        title: `Concurrency p95 latency exceeded 2500ms (${Math.round(summary.p95_ms)}ms)`,
        endpointOrRoute: `${method} ${targetEndpoint}`,
        checkMode: "k6_p95",
        method,
        ...(authInfo.tokenEnv ? { tokenEnv: authInfo.tokenEnv } : {}),
        ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
        reproCommand: `node scripts/runners/concurrency-k6.mjs --api-url ${apiUrl} ${isRaceEndpoint ? "--race-endpoint" : "--endpoint"} ${targetEndpoint} --method ${method} --vus ${vus} --iterations ${iterations}${authInfo.tokenEnv ? ` --token-env ${authInfo.tokenEnv}` : ""}${privIpFlag}`,
        evidencePaths: [relTracePath],
        verifiedOutcome: `k6 p95_ms=${summary.p95_ms}ms exceeded threshold 2500ms`,
      });
    }
  }

  const output = buildOutput({
    status,
    startedAt,
    startedMs,
    requests: probeRequests + k6Requests,
    endpoints: [`${method} ${targetEndpoint}`],
    roles: [authInfo.token ? authInfo.role : "anonymous"],
    assertions,
    findings,
    traces: [relTracePath],
    regressionTests,
    notes: summary
      ? `k6 executed ${k6Requests} request(s) (vus=${vus}, iterations=${iterations}, p95=${Math.round(summary.p95_ms || 0)}ms, race200=${summary.race_200_hits || 0}, netErr=${summary.net_error_hits || 0}) on ${method} ${targetEndpoint}.`
      : `k6 concurrency run degraded on ${method} ${targetEndpoint}.`,
  });

  writeJsonAtomic(tracePath, {
    ...output,
    targetEndpoint,
    dockerUrl,
    originalHost,
    summary,
    dockerExitCode: dockerRes.exitCode,
    dockerStderr: dockerRes.stderr.slice(-800),
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
