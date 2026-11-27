#!/usr/bin/env node
import { execFile, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { runDiscovery } from "./discover-surface.mjs";
import {
  ensureDir,
  fetchWithTimeout,
  isolatedChildEnv,
  loadConfigFile,
  MEMORY_DIR,
  parseCliArgs,
  parseNonNegativeNumber,
  readJsonSafe,
  RUNNERS_DIR,
  SCRIPTS_DIR,
  sanitizeForOutput,
  sanitizeText,
  slugify,
  STAGING_ROOT,
  stripEmDash,
  toStagingRelPath,
  uniqueStrings,
  writeJsonAtomic,
  writeTextAtomic,
} from "./lib/common.mjs";
import { getPythonBin } from "./python-env.mjs";
import { generateHtmlReport } from "./report-html.mjs";
import { evaluateSafetyAndBudget } from "./safety-guard.mjs";
import { runVerifyOutcomes } from "./verify-outcomes.mjs";

const execFileAsync = promisify(execFile);

const ALL_MODES = [
  "exploratory",
  "stateful",
  "property",
  "negative",
  "concurrency",
  "authorization",
  "resilience",
  "ai",
  "outcome_verification",
];

function extractLastJson(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    // scan backwards
  }
  const lastBrace = trimmed.lastIndexOf("}");
  if (lastBrace === -1) return null;
  for (let idx = trimmed.lastIndexOf("{"); idx >= 0; idx = trimmed.lastIndexOf("{", idx - 1)) {
    try {
      return JSON.parse(trimmed.slice(idx, lastBrace + 1));
    } catch {
      if (idx === 0) break;
    }
  }
  return null;
}

function loadOrRecoverLedger(filePath, defaultObj) {
  ensureDir(path.dirname(filePath));
  if (!fs.existsSync(filePath)) {
    writeJsonAtomic(filePath, defaultObj);
    return structuredClone(defaultObj);
  }
  const res = readJsonSafe(filePath);
  if (res.error || !res.data || typeof res.data !== "object" || Array.isArray(res.data)) {
    const backupName = `${path.basename(filePath, ".json")}.corrupt-${Date.now()}.json`;
    const backupPath = path.join(path.dirname(filePath), backupName);
    try {
      fs.copyFileSync(filePath, backupPath);
    } catch {
      // ignore backup copy failure
    }
    console.error(
      `WARN: Recovered corrupted ledger ${path.basename(filePath)} (backed up to ${backupName})`,
    );
    writeJsonAtomic(filePath, defaultObj);
    return structuredClone(defaultObj);
  }
  return res.data;
}

function parseModes(rawModes) {
  if (!rawModes || rawModes === true) return [...ALL_MODES];
  const requested = String(rawModes)
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean);
  return requested.length > 0 ? requested : [...ALL_MODES];
}

const VALID_CHECK_MODES = new Set([
  "status_gte_500",
  "status_404_spec_gap",
  "invalid_json_body",
  "unauth_protected_200",
  "unreachable",
  "race_condition",
  "ai_eval",
  "cdp_pageerror",
  "cdp_console_error",
  "resilience_toxiproxy_latency",
  "resilience_toxiproxy_recovery",
  "resilience_browser_fault",
  "k6_net_error",
  "k6_http_5xx",
  "k6_p95",
  "mailpit_marker",
  "docker_logs",
]);

function determineCheckMode(finding) {
  if (VALID_CHECK_MODES.has(finding?.checkMode)) {
    return finding.checkMode;
  }
  const text = `${finding?.title || ""} ${finding?.verifiedOutcome || ""}`;
  const reproCmd = String(finding?.reproCommand || "");
  if (/promptfoo|ai evaluation/i.test(text) || reproCmd.includes("ai-eval-promptfoo.mjs")) {
    return "ai_eval";
  }
  if (finding?.classification === "spec_gap") {
    return "status_404_spec_gap";
  }
  if (finding?.classification === "runtime_degraded") {
    return "unreachable";
  }
  if (/idempotency race|duplicate http 200/i.test(text)) {
    return "race_condition";
  }
  if (/cdp uncaught pageerror/i.test(text)) {
    return "cdp_pageerror";
  }
  if (/cdp browser console\.error/i.test(text)) {
    return "cdp_console_error";
  }
  if (/toxiproxy.*latency/i.test(text)) {
    return "resilience_toxiproxy_latency";
  }
  if (/recover after toxiproxy/i.test(text)) {
    return "resilience_toxiproxy_recovery";
  }
  if (/playwright 503\/abort|browser fault/i.test(text)) {
    return "resilience_browser_fault";
  }
  if (/net_error_hits|network\/connection error/i.test(text)) {
    return "k6_net_error";
  }
  if (/concurrent load triggered .* http 5xx/i.test(text)) {
    return "k6_http_5xx";
  }
  if (/concurrency p95 latency/i.test(text)) {
    return "k6_p95";
  }
  if (/mailpit downstream message missing/i.test(text)) {
    return "mailpit_marker";
  }
  if (/docker container logs/i.test(text) || /^docker\s+logs\b/i.test(reproCmd)) {
    return "docker_logs";
  }
  if (/malformed json|invalid json|json parse/i.test(text)) {
    return "invalid_json_body";
  }
  if (/unauth|security-protected|without authorization|authorization bypass|idor|cross-tenant|forbidden/i.test(text)) {
    return "unauth_protected_200";
  }
  return "status_gte_500";
}

function resolveEmbeddedScriptPath(relFromScripts) {
  const base =
    typeof SCRIPTS_DIR === "string"
      ? SCRIPTS_DIR
      : import.meta.dirname.endsWith("scripts")
        ? import.meta.dirname
        : `${import.meta.dirname}${import.meta.dirname.includes("\\") ? "\\" : "/"}scripts`;
  const sep = base.includes("\\") ? "\\" : "/";
  return [base.replace(/[\\/]+$/, ""), ...relFromScripts.split("/")].join(sep);
}

function isPrivateIpv4Url(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  try {
    const h = new URL(rawUrl).hostname.toLowerCase();
    const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return false;
    const octets = m.slice(1).map(Number);
    if (octets.some((o) => o < 0 || o > 255)) return false;
    const [a, b] = octets;
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  } catch {
    return false;
  }
}

function buildReproScriptSource(
  finding,
  defaultApiOrigin,
  defaultTargetUrl = null,
  defaultConfigPath = null,
  defaultAllowPrivateIp = false,
) {
  const safeId = stripEmDash(String(finding.id || "QA-000"))
    .replace(/[\r\n]+/g, " ")
    .replaceAll("*/", "")
    .trim();
  const safeTitle = stripEmDash(String(finding.title || "Autonomous QA Defect"))
    .replace(/[\r\n]+/g, " ")
    .replaceAll("*/", "")
    .trim();
  const checkMode = determineCheckMode(finding);
  const ep = finding.endpointOrRoute || "";
  const reproCmd = String(finding.reproCommand || "");
  const urlMatch = reproCmd.match(/https?:\/\/[^\s"']+/);
  let targetPath = "/";
  let reproDefaultOrigin = defaultApiOrigin || defaultTargetUrl || "http://127.0.0.1:3200";
  let urlPath = null;
  let method = String(finding.method || "GET").toUpperCase();
  if (urlMatch) {
    try {
      const parsed = new URL(urlMatch[0]);
      reproDefaultOrigin = parsed.origin;
      urlPath = parsed.pathname + parsed.search;
    } catch {
      urlPath = null;
    }
  }
  let epPath = "";
  if (ep.includes(" ")) {
    const parts = ep.split(/\s+/);
    if (/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/i.test(parts[0]) && !finding.method) {
      method = parts[0].toUpperCase();
    }
    epPath = parts.slice(1).join(" ");
  } else if (ep.startsWith("/")) {
    epPath = ep;
  } else if (/^https?:\/\//i.test(ep)) {
    epPath = ep;
  }
  if (epPath && /^https?:\/\//i.test(epPath)) {
    try {
      const parsedEp = new URL(epPath);
      if (!urlMatch) {
        reproDefaultOrigin = parsedEp.origin;
      }
      epPath = `${parsedEp.pathname || "/"}${parsedEp.search || ""}`;
    } catch {
      // keep existing epPath if unparseable
    }
  }
  if (checkMode === "unreachable" && urlPath && urlPath !== "/") {
    targetPath = urlPath;
  } else if (epPath) {
    if (!epPath.includes("?") && urlPath && urlPath.includes("?") && urlPath.split("?")[0] === epPath) {
      targetPath = urlPath;
    } else {
      targetPath = epPath;
    }
  } else if (urlPath) {
    targetPath = urlPath;
  }
  const hasAllowPrivateFlagInCmd = /(?:^|\s)--allow-private-ip(?:\s|$)/.test(reproCmd);
  const embeddedAllowPrivateIp = Boolean(
    defaultAllowPrivateIp ||
      finding?.allowPrivateIp ||
      hasAllowPrivateFlagInCmd ||
      isPrivateIpv4Url(reproDefaultOrigin) ||
      isPrivateIpv4Url(defaultTargetUrl) ||
      isPrivateIpv4Url(defaultApiOrigin),
  );

  if (checkMode === "race_condition") {
    const postMethod = method === "GET" ? "POST" : method;
    const tokenEnvArgMatch = reproCmd.match(/--token-env\s+(\S+)/);
    const defaultTokenEnv = String(finding.tokenEnv || (tokenEnvArgMatch ? tokenEnvArgMatch[1] : "") || "");
    return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}
const baseUrl = getFlag("--api-url", getFlag("--target-url", ${JSON.stringify(reproDefaultOrigin)}));
const url = new URL(${JSON.stringify(targetPath)}, baseUrl).toString();
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
      fetch(url, { method: ${JSON.stringify(postMethod)}, headers, body, signal: AbortSignal.timeout(4000) }),
    ),
  );
  const statuses = responses.map((r) => r.status);
  const hits200 = statuses.filter((s) => s === 200).length;
  const hits5xx = statuses.filter((s) => s >= 500).length;
  if (hits200 > 1 || hits5xx > 0) {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=race_condition", "statuses=" + statuses.join(","), "url=" + url);
    process.exit(1);
  }
  console.log("RESOLVED", ${JSON.stringify(safeId)}, "mode=race_condition", "statuses=" + statuses.join(","), "url=" + url);
  process.exit(0);
} catch (err) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=race_condition", err instanceof Error ? err.message : String(err));
  process.exit(1);
}
`;
  }

  if (checkMode === "ai_eval") {
    const aiUrlMatch = reproCmd.match(/--ai-url\s+(?:"([^"]+)"|(\S+))/);
    const aiProvMatch = reproCmd.match(/--ai-provider\s+(?:"([^"]+)"|(\S+))/);
    const cfgMatch = reproCmd.match(/--config\s+(?:"([^"]+)"|(\S+))/);
    const defaultAiUrl = aiUrlMatch ? (aiUrlMatch[1] || aiUrlMatch[2]) : "";
    const defaultAiProvider = aiProvMatch ? (aiProvMatch[1] || aiProvMatch[2]) : "";
    const defaultConfig = cfgMatch ? (cfgMatch[1] || cfgMatch[2]) : (defaultConfigPath || "");
    const fallbackAiPath = targetPath.startsWith("/") ? targetPath : "/v1/chat/completions";
    const allowPrivAi = Boolean(embeddedAllowPrivateIp || isPrivateIpv4Url(defaultAiUrl));
    return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}
const apiOverride = getFlag("--api-url", getFlag("--target-url", ""));
const aiUrl = getFlag("--ai-url", apiOverride ? new URL(${JSON.stringify(fallbackAiPath)}, apiOverride).toString() : ${JSON.stringify(defaultAiUrl)});
const aiProvider = getFlag("--ai-provider", ${JSON.stringify(defaultAiProvider)});
const explicitConfig = getFlag("--config", "");
const defaultConfig = ${JSON.stringify(defaultConfig)};
const configPath = explicitConfig || (defaultConfig && fs.existsSync(defaultConfig) ? defaultConfig : "");
const allowPrivateIp = args.includes("--allow-private-ip") || ${JSON.stringify(allowPrivAi)};
const localRunnerPath = path.resolve(import.meta.dirname, "..", "..", "scripts", "runners", "ai-eval-promptfoo.mjs");
const fallbackRunnerPath = ${JSON.stringify(resolveEmbeddedScriptPath("runners/ai-eval-promptfoo.mjs"))};
const runnerPath = fs.existsSync(localRunnerPath) ? localRunnerPath : fallbackRunnerPath;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aq-repro-ai-"));
let exitCode = 1;
try {
  const cmdArgs = [runnerPath, "--max-ai-calls", "3", "--memory-dir", tmpDir, "--trace-dir", path.join(tmpDir, "traces")];
  if (allowPrivateIp) cmdArgs.push("--allow-private-ip");
  if (configPath) cmdArgs.push("--config", configPath);
  if (aiUrl) cmdArgs.push("--ai-url", aiUrl);
  if (aiProvider) cmdArgs.push("--ai-provider", aiProvider);
  const raw = execFileSync(process.execPath, cmdArgs, { encoding: "utf8", windowsHide: true, timeout: 45000 });
  const out = JSON.parse(raw.slice(raw.indexOf("{")));
  if (out.status === "failed" || out.status === "degraded") {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=ai_eval", "status=" + out.status);
    exitCode = 1;
  } else {
    console.log("RESOLVED", ${JSON.stringify(safeId)}, "mode=ai_eval", "status=" + out.status);
    exitCode = 0;
  }
} catch (err) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=ai_eval", err instanceof Error ? err.message : String(err));
  exitCode = 1;
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
process.exit(exitCode);
`;
  }

  if (checkMode === "cdp_pageerror" || checkMode === "cdp_console_error") {
    const targetArgMatch = reproCmd.match(/--target-url\s+(\S+)/);
    const defaultCdpTarget = targetArgMatch
      ? targetArgMatch[1]
      : new URL(targetPath, defaultTargetUrl || reproDefaultOrigin).toString();
    const allowPrivCdp = Boolean(embeddedAllowPrivateIp || isPrivateIpv4Url(defaultCdpTarget));
    return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}
const overrideBase = getFlag("--target-url", getFlag("--api-url", ""));
const targetUrl = overrideBase ? new URL(${JSON.stringify(urlPath || targetPath)}, overrideBase).toString() : ${JSON.stringify(defaultCdpTarget)};
const allowPrivateIp = args.includes("--allow-private-ip") || ${JSON.stringify(allowPrivCdp)};
const checkMode = ${JSON.stringify(checkMode)};
const localRunnerPath = path.resolve(import.meta.dirname, "..", "..", "scripts", "runners", "cdp-diagnostics.mjs");
const fallbackRunnerPath = ${JSON.stringify(resolveEmbeddedScriptPath("runners/cdp-diagnostics.mjs"))};
const runnerPath = fs.existsSync(localRunnerPath) ? localRunnerPath : fallbackRunnerPath;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aq-repro-cdp-"));
let exitCode = 1;
try {
  const cmdArgs = [runnerPath, "--target-url", targetUrl, "--memory-dir", tmpDir, "--trace-dir", path.join(tmpDir, "traces")];
  if (allowPrivateIp) cmdArgs.push("--allow-private-ip");
  const raw = execFileSync(process.execPath, cmdArgs, { encoding: "utf8", windowsHide: true, timeout: 45000 });
  const out = JSON.parse(raw.slice(raw.indexOf("{")));
  const matches = Array.isArray(out.findings) && out.findings.some((f) => {
    if (f.classification !== "confirmed_bug") return false;
    if (checkMode === "cdp_pageerror") {
      return f.checkMode === "cdp_pageerror" || /pageerror/i.test(String(f.title || "") + " " + String(f.fingerprint || ""));
    }
    return (
      f.checkMode === "cdp_console_error" ||
      f.checkMode === "cdp_pageerror" ||
      /console|pageerror/i.test(String(f.title || "") + " " + String(f.fingerprint || ""))
    );
  });
  if (out.status === "degraded" || matches) {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=" + checkMode, "status=" + out.status, "url=" + targetUrl);
    exitCode = 1;
  } else {
    console.log("RESOLVED", ${JSON.stringify(safeId)}, "mode=" + checkMode, "status=" + out.status, "url=" + targetUrl);
    exitCode = 0;
  }
} catch (err) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=" + checkMode, err instanceof Error ? err.message : String(err));
  exitCode = 1;
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
process.exit(exitCode);
`;
  }

  if (
    checkMode === "resilience_toxiproxy_latency" ||
    checkMode === "resilience_toxiproxy_recovery" ||
    checkMode === "resilience_browser_fault"
  ) {
    const apiArgMatch = reproCmd.match(/--api-url\s+(\S+)/);
    const targetArgMatch = reproCmd.match(/--target-url\s+(\S+)/);
    const preferredPath = urlPath || targetPath || "/";
    let defaultResApi = new URL(preferredPath, reproDefaultOrigin).toString();
    if (apiArgMatch) {
      try {
        const parsedApiArg = new URL(apiArgMatch[1]);
        if ((!parsedApiArg.pathname || parsedApiArg.pathname === "/") && !parsedApiArg.search && preferredPath !== "/") {
          defaultResApi = new URL(preferredPath, parsedApiArg.origin).toString();
        } else {
          defaultResApi = apiArgMatch[1];
        }
      } catch {
        defaultResApi = apiArgMatch[1];
      }
    }
    let resProbePath = "/";
    try {
      const parsedResApi = new URL(defaultResApi);
      resProbePath = `${parsedResApi.pathname || "/"}${parsedResApi.search || ""}`;
    } catch {
      resProbePath = preferredPath;
    }
    const defaultResTarget = targetArgMatch
      ? targetArgMatch[1]
      : defaultTargetUrl
        ? new URL(preferredPath, defaultTargetUrl).toString()
        : new URL(preferredPath, reproDefaultOrigin).toString();
    let resTargetPath = "/";
    try {
      const parsedResTarget = new URL(defaultResTarget);
      resTargetPath = `${parsedResTarget.pathname || "/"}${parsedResTarget.search || ""}`;
    } catch {
      resTargetPath = preferredPath;
    }
    const isBrowserFault = checkMode === "resilience_browser_fault";
    const allowPrivRes = Boolean(
      embeddedAllowPrivateIp || isPrivateIpv4Url(defaultResApi) || isPrivateIpv4Url(defaultResTarget),
    );
    return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}
const apiOverride = getFlag("--api-url", getFlag("--target-url", ""));
const targetOverride = getFlag("--target-url", "");
const resProbePath = ${JSON.stringify(resProbePath)};
const resTargetPath = ${JSON.stringify(resTargetPath)};
function resolveResUrl(overrideRaw, defaultFull, fallbackPath = resProbePath) {
  if (!overrideRaw) return defaultFull;
  try {
    const parsed = new URL(overrideRaw);
    if ((!parsed.pathname || parsed.pathname === "/") && !parsed.search && fallbackPath && fallbackPath !== "/") {
      return new URL(fallbackPath, parsed.origin).toString();
    }
  } catch {
    // keep raw override
  }
  return overrideRaw;
}
const apiUrl = resolveResUrl(apiOverride, ${JSON.stringify(defaultResApi)}, resProbePath);
const targetUrl = resolveResUrl(targetOverride || apiOverride, ${JSON.stringify(defaultResTarget)}, resTargetPath);
const allowPrivateIp = args.includes("--allow-private-ip") || ${JSON.stringify(allowPrivRes)};
const checkMode = ${JSON.stringify(checkMode)};
const localRunnerPath = path.resolve(import.meta.dirname, "..", "..", "scripts", "runners", "resilience-toxiproxy.mjs");
const fallbackRunnerPath = ${JSON.stringify(resolveEmbeddedScriptPath("runners/resilience-toxiproxy.mjs"))};
const runnerPath = fs.existsSync(localRunnerPath) ? localRunnerPath : fallbackRunnerPath;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aq-repro-toxi-"));
let exitCode = 1;
try {
  const cmdArgs = [
    runnerPath,
    "--api-url",
    apiUrl,
    ${isBrowserFault ? '"--target-url", targetUrl, "--browser-only",' : '"--skip-browser",'}
    "--memory-dir",
    tmpDir,
    "--trace-dir",
    path.join(tmpDir, "traces"),
  ];
  if (allowPrivateIp) cmdArgs.push("--allow-private-ip");
  const raw = execFileSync(process.execPath, cmdArgs, { encoding: "utf8", windowsHide: true, timeout: 45000 });
  const out = JSON.parse(raw.slice(raw.indexOf("{")));
  const matches = Array.isArray(out.findings) && out.findings.some((f) => {
    if (f.classification !== "confirmed_bug") return false;
    if (checkMode === "resilience_browser_fault") {
      return f.checkMode === "resilience_browser_fault" || /503\\/abort|browser fault/i.test(String(f.title || ""));
    }
    if (checkMode === "resilience_toxiproxy_recovery") {
      return f.checkMode === "resilience_toxiproxy_recovery" || /recover/i.test(String(f.title || ""));
    }
    return f.checkMode === "resilience_toxiproxy_latency" || /latency/i.test(String(f.title || ""));
  });
  if (out.status === "degraded" || matches) {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=" + checkMode, "status=" + out.status);
    exitCode = 1;
  } else {
    console.log("RESOLVED", ${JSON.stringify(safeId)}, "mode=" + checkMode, "status=" + out.status);
    exitCode = 0;
  }
} catch (err) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=" + checkMode, err instanceof Error ? err.message : String(err));
  exitCode = 1;
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
process.exit(exitCode);
`;
  }

  if (checkMode === "k6_net_error" || checkMode === "k6_http_5xx" || checkMode === "k6_p95") {
    const apiArgMatch = reproCmd.match(/--api-url\s+(\S+)/);
    const epArgMatch = reproCmd.match(/--(?:race-)?endpoint\s+(\S+)/);
    const methodArgMatch = reproCmd.match(/--method\s+(\S+)/);
    const vusArgMatch = reproCmd.match(/--vus\s+(\d+)/);
    const itersArgMatch = reproCmd.match(/--iterations\s+(\d+)/);
    const defaultK6Api = apiArgMatch ? apiArgMatch[1] : reproDefaultOrigin;
    const defaultK6Ep = epArgMatch ? epArgMatch[1] : targetPath;
    const defaultK6Method = methodArgMatch ? methodArgMatch[1].toUpperCase() : method;
    const defaultVus = vusArgMatch ? vusArgMatch[1] : "2";
    const defaultIters = itersArgMatch ? itersArgMatch[1] : "4";
    const tokenEnvArgMatch = reproCmd.match(/--token-env\s+(\S+)/);
    const defaultTokenEnv = String(finding.tokenEnv || (tokenEnvArgMatch ? tokenEnvArgMatch[1] : "") || "");
    const allowPrivK6 = Boolean(embeddedAllowPrivateIp || isPrivateIpv4Url(defaultK6Api));
    return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}
const apiUrl = getFlag("--api-url", getFlag("--target-url", ${JSON.stringify(defaultK6Api)}));
const endpoint = getFlag("--endpoint", ${JSON.stringify(defaultK6Ep)});
const method = getFlag("--method", ${JSON.stringify(defaultK6Method)});
const tokenEnvName = getFlag("--token-env", ${JSON.stringify(defaultTokenEnv)});
const authToken = tokenEnvName ? String(process.env[tokenEnvName] || "").trim() : "";
const allowPrivateIp = args.includes("--allow-private-ip") || ${JSON.stringify(allowPrivK6)};
const checkMode = ${JSON.stringify(checkMode)};
if (tokenEnvName && !authToken) {
  console.error("AUTH_ENV_REQUIRED", ${JSON.stringify(safeId)}, "mode=" + checkMode, "tokenEnv=" + tokenEnvName);
  process.exit(2);
}
const localRunnerPath = path.resolve(import.meta.dirname, "..", "..", "scripts", "runners", "concurrency-k6.mjs");
const fallbackRunnerPath = ${JSON.stringify(resolveEmbeddedScriptPath("runners/concurrency-k6.mjs"))};
const runnerPath = fs.existsSync(localRunnerPath) ? localRunnerPath : fallbackRunnerPath;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aq-repro-k6-"));
let exitCode = 1;
try {
  const cmdArgs = [
    runnerPath,
    "--api-url",
    apiUrl,
    "--endpoint",
    endpoint,
    "--method",
    method,
    "--vus",
    ${JSON.stringify(defaultVus)},
    "--iterations",
    ${JSON.stringify(defaultIters)},
    "--memory-dir",
    tmpDir,
    "--trace-dir",
    path.join(tmpDir, "traces"),
  ];
  if (tokenEnvName) cmdArgs.push("--token-env", tokenEnvName);
  if (allowPrivateIp) cmdArgs.push("--allow-private-ip");
  const raw = execFileSync(process.execPath, cmdArgs, { encoding: "utf8", windowsHide: true, timeout: 45000 });
  const out = JSON.parse(raw.slice(raw.indexOf("{")));
  const matches = Array.isArray(out.findings) && out.findings.some((f) => {
    if (f.classification !== "confirmed_bug") return false;
    if (f.checkMode === checkMode) return true;
    if (checkMode === "k6_net_error") return /net_error_hits|network\\/connection error/i.test(String(f.title || ""));
    if (checkMode === "k6_http_5xx") return /5xx/i.test(String(f.title || ""));
    if (checkMode === "k6_p95") return /p95/i.test(String(f.title || ""));
    return false;
  });
  if (out.status === "degraded" || matches) {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=" + checkMode, "status=" + out.status);
    exitCode = 1;
  } else {
    console.log("RESOLVED", ${JSON.stringify(safeId)}, "mode=" + checkMode, "status=" + out.status);
    exitCode = 0;
  }
} catch (err) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=" + checkMode, err instanceof Error ? err.message : String(err));
  exitCode = 1;
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
process.exit(exitCode);
`;
  }

  if (checkMode === "mailpit_marker") {
    const mpUrlMatch = reproCmd.match(/--mailpit-url\s+(\S+)/);
    const mpMarkerMatch = reproCmd.match(/--expect-mailpit-marker\s+(?:"([^"]+)"|(\S+))/);
    const titleMarkerMatch = String(finding.title || "").match(/for marker "([^"]+)"/);
    const defaultMpUrl = mpUrlMatch ? mpUrlMatch[1] : (urlMatch ? new URL(urlMatch[0]).origin : reproDefaultOrigin);
    const defaultMarker = (mpMarkerMatch && (mpMarkerMatch[1] || mpMarkerMatch[2])) || (titleMarkerMatch && titleMarkerMatch[1]) || "";
    return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}
const mailpitUrl = getFlag("--mailpit-url", getFlag("--api-url", getFlag("--target-url", ${JSON.stringify(defaultMpUrl)})));
const marker = getFlag("--expect-mailpit-marker", ${JSON.stringify(defaultMarker)});
const localRunnerPath = path.resolve(import.meta.dirname, "..", "..", "scripts", "verify-outcomes.mjs");
const fallbackRunnerPath = ${JSON.stringify(resolveEmbeddedScriptPath("verify-outcomes.mjs"))};
const runnerPath = fs.existsSync(localRunnerPath) ? localRunnerPath : fallbackRunnerPath;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aq-repro-mp-"));
let exitCode = 1;
try {
  const cmdArgs = [
    runnerPath,
    "--mailpit-url",
    mailpitUrl,
    "--memory-dir",
    tmpDir,
    "--trace-dir",
    path.join(tmpDir, "traces"),
  ];
  if (marker) cmdArgs.push("--expect-mailpit-marker", marker);
  const raw = execFileSync(process.execPath, cmdArgs, { encoding: "utf8", windowsHide: true, timeout: 30000 });
  const out = JSON.parse(raw.slice(raw.indexOf("{")));
  if (out.status === "failed" || out.status === "degraded") {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=mailpit_marker", "status=" + out.status);
    exitCode = 1;
  } else {
    console.log("RESOLVED", ${JSON.stringify(safeId)}, "mode=mailpit_marker", "status=" + out.status);
    exitCode = 0;
  }
} catch (err) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=mailpit_marker", err instanceof Error ? err.message : String(err));
  exitCode = 1;
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
process.exit(exitCode);
`;
  }

  if (checkMode === "docker_logs") {
    const epContainer = ep.startsWith("docker:") ? ep.slice("docker:".length).trim() : "";
    const cmdParts = reproCmd.trim().split(/\s+/);
    const defaultContainer = epContainer || cmdParts[cmdParts.length - 1] || "";
    return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}
const containerName = getFlag("--docker-containers", ${JSON.stringify(defaultContainer)});
if (!containerName || !String(containerName).trim()) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=docker_logs", "missing container name");
  process.exit(1);
}
const localRunnerPath = path.resolve(import.meta.dirname, "..", "..", "scripts", "verify-outcomes.mjs");
const fallbackRunnerPath = ${JSON.stringify(resolveEmbeddedScriptPath("verify-outcomes.mjs"))};
const runnerPath = fs.existsSync(localRunnerPath) ? localRunnerPath : fallbackRunnerPath;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aq-repro-dlog-"));
let exitCode = 1;
try {
  const cmdArgs = [
    runnerPath,
    "--docker-containers",
    containerName,
    "--memory-dir",
    tmpDir,
    "--trace-dir",
    path.join(tmpDir, "traces"),
  ];
  const raw = execFileSync(process.execPath, cmdArgs, { encoding: "utf8", windowsHide: true, timeout: 30000 });
  const out = JSON.parse(raw.slice(raw.indexOf("{")));
  if (out.status === "failed" || out.status === "degraded") {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=docker_logs", "container=" + containerName, "status=" + out.status);
    exitCode = 1;
  } else {
    console.log("RESOLVED", ${JSON.stringify(safeId)}, "mode=docker_logs", "container=" + containerName, "status=" + out.status);
    exitCode = 0;
  }
} catch (err) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=docker_logs", err instanceof Error ? err.message : String(err));
  exitCode = 1;
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
process.exit(exitCode);
`;
  }

  return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}
const baseUrl = getFlag("--api-url", getFlag("--target-url", ${JSON.stringify(reproDefaultOrigin)}));
const url = new URL(${JSON.stringify(targetPath)}, baseUrl).toString();
const checkMode = ${JSON.stringify(checkMode)};
const method = ${JSON.stringify(method)};
try {
  const res = await fetch(url, { method, signal: AbortSignal.timeout(4000) });
  const text = await res.text();
  let jsonValid = true;
  if (checkMode === "invalid_json_body") {
    try {
      JSON.parse(text);
    } catch {
      jsonValid = false;
    }
  }
  let reproduced = false;
  if (checkMode === "status_404_spec_gap") {
    reproduced = res.status === 404;
  } else if (checkMode === "unreachable") {
    reproduced = res.status === 0 || res.status >= 500;
  } else if (checkMode === "invalid_json_body") {
    reproduced = res.status >= 500 || !jsonValid;
  } else if (checkMode === "unauth_protected_200") {
    reproduced = res.status >= 500 || (res.status === 200 && text.trim().length > 0);
  } else {
    reproduced = res.status >= 500;
  }
  if (reproduced) {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=" + checkMode, "status=" + res.status, "url=" + url);
    process.exit(1);
  }
  console.log("RESOLVED", ${JSON.stringify(safeId)}, "mode=" + checkMode, "status=" + res.status, "url=" + url);
  process.exit(0);
} catch (err) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "mode=" + checkMode, err instanceof Error ? err.message : String(err));
  process.exit(1);
}
`;
}

function generateRegressionScripts(
  findings,
  defaultApiOrigin,
  memoryDir = MEMORY_DIR,
  defaultTargetUrl = null,
  defaultConfigPath = null,
  defaultAllowPrivateIp = false,
) {
  const regDir = path.join(memoryDir, "regressions");
  ensureDir(regDir);
  const generated = [];
  const warnings = [];

  for (const f of findings) {
    if (f.reproScript) {
      const existingPath = path.isAbsolute(f.reproScript)
        ? f.reproScript
        : path.resolve(STAGING_ROOT, f.reproScript);
      if (fs.existsSync(existingPath)) {
        generated.push(f.reproScript);
        continue;
      }
    }
    const fileName = `${slugify(f.id, 16)}-${slugify(f.title, 36)}.mjs`;
    const absPath = path.join(regDir, fileName);
    const src = buildReproScriptSource(
      f,
      defaultApiOrigin,
      defaultTargetUrl,
      defaultConfigPath,
      defaultAllowPrivateIp,
    );
    writeTextAtomic(absPath, src);
    try {
      execFileSync(process.execPath, ["--check", absPath], { windowsHide: true, timeout: 5000 });
    } catch (err) {
      fs.rmSync(absPath, { force: true });
      const msg = sanitizeText(
        `Generated regression script failed syntax check (${fileName}): ${err instanceof Error ? err.message : String(err)}`,
      ).replace(/[\r\n]+/g, " ");
      console.error(`WARN: ${msg}`);
      warnings.push(msg);
      continue;
    }
    const rel = toStagingRelPath(absPath);
    f.reproScript = rel;
    generated.push(rel);
  }

  return { generated: uniqueStrings(generated), warnings };
}

async function runRegisteredRunner(runnerFile, args, isPython = false, timeoutMs = 25000) {
  const absPath = path.join(RUNNERS_DIR, runnerFile);
  if (!fs.existsSync(absPath)) {
    return { present: false, output: null };
  }
  const cmd = isPython ? getPythonBin() : process.execPath;
  if (!cmd || !fs.existsSync(cmd)) {
    return {
      present: true,
      output: {
        tool: runnerFile.includes("api-fuzz") ? "schemathesis" : "node",
        mode: "stateful",
        status: "degraded",
        startedAt: new Date().toISOString(),
        durationMs: 0,
        budgetConsumed: { requests: 0, aiCalls: 0 },
        coverage: { routes: [], endpoints: [], roles: [], assertions: 0 },
        findings: [],
        artifacts: { traces: [], screenshots: [], regressionTests: [] },
        notes: `Runtime executable missing for ${runnerFile}`,
      },
    };
  }
  try {
    const { stdout, stderr } = await execFileAsync(cmd, [absPath, ...args], {
      cwd: STAGING_ROOT,
      env: isolatedChildEnv(),
      timeout: timeoutMs,
      windowsHide: true,
    });
    const parsed = extractLastJson(stdout) || extractLastJson(stderr);
    const validObj = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    return {
      present: true,
      output: validObj,
      exitCode: 0,
      killed: false,
      stderrSnippet: validObj ? "" : sanitizeText(stderr || stdout).slice(-400).trim(),
      error: validObj ? null : "Runner exited without valid Contract 2 JSON output",
    };
  } catch (err) {
    const stdout = err?.stdout ? String(err.stdout) : "";
    const stderr = err?.stderr ? String(err.stderr) : "";
    const parsed = extractLastJson(stdout) || extractLastJson(stderr);
    const validObj = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    return {
      present: true,
      output: validObj,
      exitCode: typeof err?.code === "number" ? err.code : null,
      killed: Boolean(err?.killed),
      stderrSnippet: sanitizeText(stderr || stdout).slice(-400).trim(),
      error: sanitizeText(err instanceof Error ? err.message : String(err)),
    };
  }
}

function resolvePathTemplate(templatePath, paramSchemas = {}, cfg = {}) {
  const sampleMap = {
    ...(cfg.sampleIds && typeof cfg.sampleIds === "object" ? cfg.sampleIds : {}),
    ...(cfg.sampleParams && typeof cfg.sampleParams === "object" ? cfg.sampleParams : {}),
  };
  let unresolved = false;
  const resolved = templatePath.replace(/\{([^}]+)\}/g, (_, paramName) => {
    const configuredVal = sampleMap[paramName];
    if (configuredVal !== undefined && configuredVal !== null && String(configuredVal).length > 0) {
      return encodeURIComponent(String(configuredVal));
    }
    const schemaInfo = paramSchemas?.[paramName];
    if (schemaInfo) {
      if (schemaInfo.example !== null && schemaInfo.example !== undefined && String(schemaInfo.example).length > 0) {
        return encodeURIComponent(String(schemaInfo.example));
      }
      if (
        schemaInfo.defaultValue !== null &&
        schemaInfo.defaultValue !== undefined &&
        String(schemaInfo.defaultValue).length > 0
      ) {
        return encodeURIComponent(String(schemaInfo.defaultValue));
      }
      if (schemaInfo.enum0 !== null && schemaInfo.enum0 !== undefined && String(schemaInfo.enum0).length > 0) {
        return encodeURIComponent(String(schemaInfo.enum0));
      }
      if (schemaInfo.type === "integer" || schemaInfo.type === "number") {
        return String(schemaInfo.minimum !== null && schemaInfo.minimum !== undefined ? schemaInfo.minimum : 1);
      }
    }
    unresolved = true;
    return `{${paramName}}`;
  });
  return unresolved ? null : resolved;
}

function buildBaselineEndpointsToProbe(discoveredEndpoints, apiOrigin, endpointMetadata = {}, cfg = {}) {
  if (!apiOrigin) return [];
  const candidates = [];
  const seenPaths = new Set();
  for (const ep of discoveredEndpoints) {
    const m = ep.match(/^GET\s+(\S+)$/i);
    if (!m) continue;
    const rawPath = m[1];
    if (rawPath === "/healthz" || rawPath === "/readyz" || rawPath === "/openapi.json" || rawPath === "/v1/openapi.json") {
      continue;
    }
    const meta = endpointMetadata[ep] || endpointMetadata[`GET ${rawPath}`] || {};
    const resolvedPath = rawPath.includes("{")
      ? resolvePathTemplate(rawPath, meta.paramSchemas, cfg)
      : rawPath;
    if (!resolvedPath || seenPaths.has(resolvedPath)) continue;
    seenPaths.add(resolvedPath);
    candidates.push({
      path: resolvedPath,
      rawEndpoint: ep,
      requiresAuth: Boolean(meta.requiresAuth),
    });
  }
  return candidates;
}

function resolveConfigPath(configPath) {
  if (!configPath) return undefined;
  const candidates = [
    path.resolve(process.cwd(), configPath),
    path.resolve(STAGING_ROOT, configPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.resolve(process.cwd(), configPath);
}

function resolvePathCandidates(rawPath, searchDirs = [process.cwd(), STAGING_ROOT]) {
  if (!rawPath || typeof rawPath !== "string") return rawPath;
  const trimmed = rawPath.trim();
  if (!trimmed) return trimmed;
  if (path.isAbsolute(trimmed)) return trimmed;
  for (const dir of searchDirs) {
    if (!dir) continue;
    const cand = path.resolve(dir, trimmed);
    if (fs.existsSync(cand)) return cand;
  }
  const primary = searchDirs.find(Boolean) || process.cwd();
  return path.resolve(primary, trimmed);
}

function resolveOptionalLocalUrlOrPath(rawVal, searchDirs) {
  if (rawVal === undefined || rawVal === null) return rawVal;
  const trimmed = String(rawVal).trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return resolvePathCandidates(trimmed, searchDirs);
}

function resolveAiProviderValue(rawProvider, searchDirs) {
  if (rawProvider === undefined || rawProvider === null) return rawProvider;
  const raw = String(rawProvider).trim();
  if (!raw) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("file://")) {
    const filePart = raw.slice("file://".length);
    if (path.isAbsolute(filePart)) return raw;
    return `file://${resolvePathCandidates(filePart, searchDirs)}`;
  }
  const looksExplicitRelative =
    raw.startsWith("./") ||
    raw.startsWith("../") ||
    raw.startsWith(".\\") ||
    raw.startsWith("..\\");
  if (looksExplicitRelative) {
    return resolvePathCandidates(raw, searchDirs);
  }
  const hasProviderScheme = /^[a-z0-9_-]+:/i.test(raw) && !/^[a-z]:[\\/]/i.test(raw);
  if (!hasProviderScheme && !path.isAbsolute(raw)) {
    for (const dir of searchDirs) {
      if (!dir) continue;
      const cand = path.resolve(dir, raw);
      if (fs.existsSync(cand)) return cand;
    }
  }
  return raw;
}

export async function runQaLoop(opts = {}) {
  const resolvedConfig = resolveConfigPath(opts.config);
  const cfg = resolvedConfig ? loadConfigFile(resolvedConfig) : {};
  const configDir = resolvedConfig ? path.dirname(resolvedConfig) : null;
  const allowPrivateIp = Boolean(opts.allowPrivateIp || cfg.allowPrivateIp);
  const targetUrl = opts.targetUrl ?? cfg.targetUrl;
  const apiUrl = opts.apiUrl ?? cfg.apiUrl ?? targetUrl;
  const aiUrl = opts.aiUrl ?? cfg.aiUrl;
  const aiProvider =
    opts.aiProvider !== undefined && opts.aiProvider !== null
      ? resolveAiProviderValue(opts.aiProvider, [process.cwd(), configDir, STAGING_ROOT])
      : cfg.aiProvider !== undefined && cfg.aiProvider !== null
        ? resolveAiProviderValue(cfg.aiProvider, [configDir, process.cwd(), STAGING_ROOT])
        : undefined;
  const mailpitUrl = opts.mailpitUrl ?? cfg.mailpitUrl;
  const langfuseUrl = opts.langfuseUrl ?? cfg.langfuseUrl;
  const oidcUrl = opts.oidcUrl ?? cfg.oidcUrl;
  const openapiUrl =
    opts.openapiUrl !== undefined && opts.openapiUrl !== null
      ? resolveOptionalLocalUrlOrPath(opts.openapiUrl, [process.cwd(), configDir, STAGING_ROOT])
      : cfg.openapiUrl !== undefined && cfg.openapiUrl !== null
        ? resolveOptionalLocalUrlOrPath(cfg.openapiUrl, [configDir, process.cwd(), STAGING_ROOT])
        : undefined;
  const resolvedRouteCatalogPath = cfg.routeCatalogPath
    ? resolvePathCandidates(cfg.routeCatalogPath, [configDir, process.cwd(), STAGING_ROOT])
    : undefined;
  const resolvedFrontendRegistryPath = cfg.frontendRegistryPath
    ? resolvePathCandidates(cfg.frontendRegistryPath, [configDir, process.cwd(), STAGING_ROOT])
    : undefined;
  const resolvedStorageState = opts.storageState
    ? resolvePathCandidates(opts.storageState, [process.cwd(), configDir, STAGING_ROOT])
    : undefined;
  const cliRepoPaths = (Array.isArray(opts.repoPaths) ? opts.repoPaths : []).map((rp) =>
    resolvePathCandidates(rp, [process.cwd(), configDir, STAGING_ROOT]),
  );
  const cfgRepoPaths = (Array.isArray(cfg.repoPaths) ? cfg.repoPaths : []).map((rp) =>
    resolvePathCandidates(rp, [configDir, process.cwd(), STAGING_ROOT]),
  );
  const repoPaths = uniqueStrings([...cliRepoPaths, ...cfgRepoPaths]);

  const memoryDir = path.resolve(opts.memoryDir || MEMORY_DIR);
  const budgetFile = opts.budgetFile ? path.resolve(opts.budgetFile) : path.join(memoryDir, "run-budget.json");

  const maxIterations = parseNonNegativeNumber(opts.iterations ?? opts.maxIterations, 1, "--iterations");
  const maxMinutes = opts.maxMinutes ?? cfg.maxMinutes ?? cfg.limits?.maxMinutes;
  const maxRequests = opts.maxRequests ?? cfg.maxRequests ?? cfg.limits?.maxRequests;
  const maxAiCalls = opts.maxAiCalls ?? cfg.maxAiCalls ?? cfg.limits?.maxAiCalls;
  const dryRun = Boolean(opts.dryRun);
  const modes = parseModes(opts.modes);

  const aiExplicitlyDisabled = Number(maxAiCalls) === 0;
  const safetyAiUrl = aiUrl || (/^https?:\/\//i.test(String(aiProvider || "")) ? String(aiProvider) : undefined);

  // Step 1: Pre-flight Safety & Budget Gate (before any HTTP calls or ledger writes)
  const preflight = evaluateSafetyAndBudget({
    config: resolvedConfig,
    targetUrl,
    apiUrl,
    aiUrl: safetyAiUrl,
    mailpitUrl,
    langfuseUrl,
    oidcUrl,
    openapiUrl,
    maxMinutes,
    maxRequests,
    maxAiCalls,
    budgetFile,
    reset: opts.resetBudget,
    allowPrivateIp,
    ignoreAiCap: true,
    dryRun,
  });

  if (preflight.exitCode !== 0) {
    return { exitCode: preflight.exitCode, summary: preflight.payload };
  }

  let currentBudget = preflight.payload.budget;
  const isAiExhausted = (b) => aiExplicitlyDisabled || b.maxAiCalls === 0 || b.aiCallsUsed >= b.maxAiCalls;
  const isBudgetExhausted = (b) => {
    const elapsedMinutes = (Date.now() - Date.parse(b.startTime)) / 60000;
    return b.maxMinutes === 0 || elapsedMinutes > b.maxMinutes || b.requestsUsed >= b.maxRequests;
  };

  const coveragePath = path.join(memoryDir, "coverage-ledger.json");
  const findingsPath = path.join(memoryDir, "findings-ledger.json");

  if (dryRun) {
    const covRes = readJsonSafe(coveragePath);
    const finRes = readJsonSafe(findingsPath);
    const existingIterations = Array.isArray(covRes.data?.iterations) ? covRes.data.iterations.length : 0;
    const existingFindings = Array.isArray(finRes.data?.findings) ? finRes.data.findings.length : 0;
    const plannedTasks = [];
    if (modes.includes("exploratory")) {
      plannedTasks.push("ui-explorer.mjs", "cdp-diagnostics.mjs");
    }
    if (modes.some((m) => ["stateful", "property", "negative", "authorization"].includes(m))) {
      plannedTasks.push("api-fuzz-stateful.py");
    }
    if (modes.includes("concurrency")) {
      plannedTasks.push("concurrency-k6.mjs");
    }
    if (modes.includes("resilience")) {
      plannedTasks.push("resilience-toxiproxy.mjs");
    }
    if (modes.includes("ai") && (aiUrl || aiProvider) && !isAiExhausted(currentBudget)) {
      plannedTasks.push("ai-eval-promptfoo.mjs");
    }
    return {
      exitCode: 0,
      summary: sanitizeForOutput({
        ok: true,
        dryRun: true,
        status: "dry_run",
        iterationsCompleted: 0,
        plannedIterations: maxIterations,
        plannedModes: modes,
        plannedRunners: plannedTasks,
        totalIterationsRecorded: existingIterations,
        totalFindingsRecorded: existingFindings,
        budget: currentBudget,
        coverageLedgerPath: toStagingRelPath(coveragePath),
        findingsLedgerPath: toStagingRelPath(findingsPath),
        reportPath: null,
      }),
    };
  }

  // Step 2: Safe Ledger Load / Initialization
  const coverageLedger = loadOrRecoverLedger(coveragePath, { schemaVersion: "1.0.0", iterations: [] });
  const findingsLedger = loadOrRecoverLedger(findingsPath, { schemaVersion: "1.0.0", findings: [] });
  if (!Array.isArray(coverageLedger.iterations)) coverageLedger.iterations = [];
  if (!Array.isArray(findingsLedger.findings)) findingsLedger.findings = [];

  ensureDir(path.join(memoryDir, "regressions"));
  ensureDir(path.join(memoryDir, "traces"));

  const apiOrigin = apiUrl ? new URL(apiUrl).origin : targetUrl ? new URL(targetUrl).origin : null;

  const updateBudget = (addRequests = 0, addAiCalls = 0) => {
    const nextAiCalls = (currentBudget.aiCallsUsed || 0) + addAiCalls;
    const check = evaluateSafetyAndBudget({
      config: resolvedConfig,
      targetUrl,
      apiUrl,
      aiUrl,
      mailpitUrl,
      langfuseUrl,
      oidcUrl,
      openapiUrl,
      maxMinutes: currentBudget.maxMinutes,
      maxRequests: currentBudget.maxRequests,
      maxAiCalls: currentBudget.maxAiCalls,
      budgetFile,
      consumeRequests: addRequests,
      consumeAiCalls: addAiCalls,
      allowPrivateIp,
      ignoreAiCap: currentBudget.maxAiCalls === 0 || addAiCalls === 0 || nextAiCalls <= currentBudget.maxAiCalls,
    });
    if (check.payload?.budget) currentBudget = check.payload.budget;
    return check;
  };

  let iterationsCompleted = 0;

  for (let iterIdx = 0; iterIdx < maxIterations; iterIdx += 1) {
    if (isBudgetExhausted(currentBudget)) break;

    const iterNum = coverageLedger.iterations.length + 1;
    const iterStartedAt = new Date().toISOString();
    const phases = {};
    const toolsRun = new Set();
    const routes = new Set();
    const endpoints = new Set();
    const roles = new Set();
    const newFindings = [];
    let budgetExhaustedMidLoop = false;
    let endpointMetadata = {};

    // Phase 1: discover
    const discoveryOut = await runDiscovery({
      config: resolvedConfig,
      targetUrl,
      apiUrl,
      aiUrl,
      oidcUrl,
      openapiUrl,
      routeCatalogPath: resolvedRouteCatalogPath,
      frontendRegistryPath: resolvedFrontendRegistryPath,
      repoPaths,
      memoryDir,
      timeoutMs: 3000,
    });
    toolsRun.add("discover-surface");
    for (const r of discoveryOut.coverage.routes) routes.add(r);
    for (const e of discoveryOut.coverage.endpoints) endpoints.add(e);
    for (const rl of discoveryOut.coverage.roles) roles.add(rl);
    for (const f of discoveryOut.findings) newFindings.push(f);
    const traceRel = discoveryOut.artifacts?.traces?.[0];
    if (traceRel) {
      const traceAbs = path.isAbsolute(traceRel) ? traceRel : path.resolve(STAGING_ROOT, traceRel);
      const traceRes = readJsonSafe(traceAbs);
      if (traceRes.data?.endpointMetadata && typeof traceRes.data.endpointMetadata === "object") {
        endpointMetadata = traceRes.data.endpointMetadata;
      }
    }
    const discBudgetCheck = updateBudget(discoveryOut.budgetConsumed.requests, 0);
    if (discBudgetCheck.exitCode === 3) budgetExhaustedMidLoop = true;
    phases.discover = {
      timestamp: new Date().toISOString(),
      status: discoveryOut.status === "failed" ? "degraded" : "completed",
      summary: discoveryOut.notes,
    };

    // Phase 2: plan
    const plannedTasks = [];
    if (modes.includes("exploratory")) {
      plannedTasks.push({ file: "ui-explorer.mjs", isPy: false, mode: "exploratory" });
      plannedTasks.push({ file: "cdp-diagnostics.mjs", isPy: false, mode: "exploratory" });
    }
    if (modes.some((m) => ["stateful", "property", "negative", "authorization"].includes(m))) {
      plannedTasks.push({ file: "api-fuzz-stateful.py", isPy: true, mode: "stateful" });
    }
    if (modes.includes("concurrency")) {
      plannedTasks.push({ file: "concurrency-k6.mjs", isPy: false, mode: "concurrency" });
    }
    if (modes.includes("resilience")) {
      plannedTasks.push({ file: "resilience-toxiproxy.mjs", isPy: false, mode: "resilience" });
    }
    if (modes.includes("ai") && (aiUrl || aiProvider) && !isAiExhausted(currentBudget)) {
      plannedTasks.push({ file: "ai-eval-promptfoo.mjs", isPy: false, mode: "ai" });
    }
    phases.plan = {
      timestamp: new Date().toISOString(),
      status: "completed",
      summary: `Planned ${plannedTasks.length} runner check(s) for modes: ${modes.join(",")}`,
    };

    // Phase 3 & 4: execute & observe
    const skippedRunners = [];
    const executedOutputs = [];
    const runnerStatuses = [];

    if (!budgetExhaustedMidLoop) {
      for (const task of plannedTasks) {
        if (isBudgetExhausted(currentBudget)) {
          budgetExhaustedMidLoop = true;
          break;
        }
        const remainingReq = Math.max(1, currentBudget.maxRequests - currentBudget.requestsUsed);
        const remainingAi = Math.max(0, currentBudget.maxAiCalls - currentBudget.aiCallsUsed);
        const runnerArgs = [];
        if (resolvedConfig) runnerArgs.push("--config", resolvedConfig);
        if (allowPrivateIp) runnerArgs.push("--allow-private-ip");
        if (targetUrl) runnerArgs.push("--target-url", targetUrl);
        if (apiUrl) runnerArgs.push("--api-url", apiUrl);
        if (mailpitUrl) runnerArgs.push("--mailpit-url", mailpitUrl);
        if (langfuseUrl) runnerArgs.push("--langfuse-url", langfuseUrl);
        if (openapiUrl) runnerArgs.push("--openapi-url", openapiUrl);
        if (task.file === "ui-explorer.mjs" && resolvedStorageState) {
          runnerArgs.push("--storage-state", resolvedStorageState);
        }
        if (task.file === "api-fuzz-stateful.py" && resolvedRouteCatalogPath) {
          runnerArgs.push("--route-catalog", resolvedRouteCatalogPath);
        }
        for (const rp of repoPaths) {
          runnerArgs.push("--repo-path", rp);
        }
        if (opts.memoryDir) runnerArgs.push("--memory-dir", memoryDir);
        if (task.mode === "ai" && (aiUrl || aiProvider)) {
          if (aiUrl) runnerArgs.push("--ai-url", aiUrl);
          if (aiProvider) runnerArgs.push("--ai-provider", String(aiProvider));
          runnerArgs.push("--max-ai-calls", String(remainingAi));
        }
        if (task.mode !== "ai") {
          const sliceCap = task.file === "api-fuzz-stateful.py" ? 60 : 40;
          runnerArgs.push("--max-requests", String(Math.min(remainingReq, sliceCap)));
        }

        const runnerTimeout =
          task.file === "ui-explorer.mjs"
            ? 65000
            : task.file === "api-fuzz-stateful.py" ||
                task.file === "ai-eval-promptfoo.mjs" ||
                task.file === "resilience-toxiproxy.mjs"
              ? 45000
              : task.file === "concurrency-k6.mjs" || task.file === "cdp-diagnostics.mjs"
                ? 35000
                : 30000;
        const runRes = await runRegisteredRunner(task.file, runnerArgs, task.isPy, runnerTimeout);
        if (!runRes.present) {
          skippedRunners.push(task.file);
          continue;
        }
        if (runRes.output) {
          executedOutputs.push(runRes.output);
          runnerStatuses.push({ runner: task.file, mode: task.mode, status: runRes.output.status || "passed" });
          toolsRun.add(runRes.output.tool);
          for (const r of runRes.output.coverage?.routes || []) routes.add(r);
          for (const e of runRes.output.coverage?.endpoints || []) endpoints.add(e);
          for (const rl of runRes.output.coverage?.roles || []) roles.add(rl);
          for (const f of runRes.output.findings || []) newFindings.push(f);
          const bCheck = updateBudget(
            runRes.output.budgetConsumed?.requests || 0,
            runRes.output.budgetConsumed?.aiCalls || 0,
          );
          if (bCheck.exitCode === 3) {
            budgetExhaustedMidLoop = true;
            break;
          }
        } else {
          const crashStatus = runRes.exitCode !== null && runRes.exitCode !== 0 ? "failed" : "degraded";
          runnerStatuses.push({ runner: task.file, mode: task.mode, status: crashStatus });
          const errDetail = sanitizeText(
            [
              runRes.exitCode !== null ? `exitCode=${runRes.exitCode}` : null,
              runRes.killed ? "timedOut=true" : null,
              runRes.error || "No valid Contract 2 JSON output",
              runRes.stderrSnippet ? `stderr=${runRes.stderrSnippet}` : null,
            ]
              .filter(Boolean)
              .join("; "),
          ).replace(/[\r\n]+/g, " ");
          newFindings.push({
            id: `QA-RUN-${newFindings.length + 1}`,
            fingerprint: `runtime_degraded|runner:${task.file}`,
            classification: "runtime_degraded",
            severity: "medium",
            title: `Registered runner ${task.file} crashed or returned invalid JSON`,
            endpointOrRoute: apiOrigin ? "/" : "",
            checkMode: "unreachable",
            ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
            reproCommand: `${task.isPy ? "python" : "node"} scripts/runners/${task.file}${allowPrivateIp ? " --allow-private-ip" : ""}`,
            evidencePaths: [],
            verifiedOutcome: errDetail || `Runner ${task.file} failed without valid Contract 2 JSON`,
          });
        }
      }

      // Built-in lightweight non-mutating baseline probes when M3 runners are not yet registered
      if (!budgetExhaustedMidLoop && apiOrigin && skippedRunners.length > 0) {
        toolsRun.add("node");
        const probeCandidates = buildBaselineEndpointsToProbe(
          Array.from(endpoints),
          apiOrigin,
          endpointMetadata,
          cfg,
        );
        const traceSlug = new Date().toISOString().replace(/[:.]/g, "-");
        const probeTracePath = path.join(memoryDir, "traces", `baseline-probes-${traceSlug}.json`);
        const relProbeTrace = toStagingRelPath(probeTracePath);
        const probeRecords = [];

        for (const candidate of probeCandidates) {
          if (currentBudget.requestsUsed >= currentBudget.maxRequests) {
            budgetExhaustedMidLoop = true;
            break;
          }
          const p = candidate.path;
          const fullUrl = new URL(p, apiOrigin).toString();
          const res = await fetchWithTimeout(fullUrl, { method: "GET" }, 2500);
          probeRecords.push({
            path: p,
            rawEndpoint: candidate.rawEndpoint,
            requiresAuth: candidate.requiresAuth,
            status: res.status,
            parseError: res.parseError,
            error: res.error,
          });
          const bCheck = updateBudget(1, 0);
          const trimmedBody = (res.text || "").trim();
          const looksLikeJson =
            res.contentType.includes("json") || trimmedBody.startsWith("{") || trimmedBody.startsWith("[");

          if (res.status >= 500) {
            newFindings.push({
              id: `QA-BASE-${newFindings.length + 1}`,
              classification: "confirmed_bug",
              severity: "high",
              title: `Unhandled HTTP ${res.status} on GET ${p}`,
              endpointOrRoute: `GET ${p}`,
              checkMode: "status_gte_500",
              reproCommand: `curl -i ${fullUrl}`,
              evidencePaths: [relProbeTrace],
              verifiedOutcome: `Expected HTTP < 500 during baseline surface probe, got HTTP ${res.status}`,
            });
          } else if (res.ok && res.parseError && looksLikeJson) {
            newFindings.push({
              id: `QA-BASE-${newFindings.length + 1}`,
              classification: "confirmed_bug",
              severity: "high",
              title: `Malformed JSON returned with HTTP ${res.status} on GET ${p}`,
              endpointOrRoute: `GET ${p}`,
              checkMode: "invalid_json_body",
              reproCommand: `curl -i ${fullUrl}`,
              evidencePaths: [relProbeTrace],
              verifiedOutcome: `JSON parse failed (${res.parseError})`,
            });
          } else if (candidate.requiresAuth && res.status === 200 && trimmedBody.length > 0) {
            newFindings.push({
              id: `QA-BASE-${newFindings.length + 1}`,
              classification: "confirmed_bug",
              severity: "critical",
              title: `Unauthenticated access permitted on security-protected GET ${p}`,
              endpointOrRoute: `GET ${p}`,
              checkMode: "unauth_protected_200",
              reproCommand: `curl -i ${fullUrl}`,
              evidencePaths: [relProbeTrace],
              verifiedOutcome: `OpenAPI declares security requirements on ${candidate.rawEndpoint}, yet unauthenticated GET returned HTTP 200`,
            });
          }

          if (bCheck.exitCode === 3) {
            budgetExhaustedMidLoop = true;
            break;
          }
        }

        if (probeRecords.length > 0) {
          writeJsonAtomic(probeTracePath, { apiOrigin, probeRecords });
        }
      }
    }

    phases.execute = {
      timestamp: new Date().toISOString(),
      status: budgetExhaustedMidLoop ? "stopped_budget_exhausted" : "completed",
      summary: `Executed ${executedOutputs.length} runner(s); skipped_non_applicable=${skippedRunners.length}${runnerStatuses.length > 0 ? `; statuses=${runnerStatuses.map((s) => `${s.runner}:${s.status}`).join(",")}` : ""}`,
    };
    phases.observe = {
      timestamp: new Date().toISOString(),
      status: "completed",
      summary: `Observed ${newFindings.length} raw finding(s) across ${toolsRun.size} tool(s)`,
    };

    // Phase 5: verify
    if (budgetExhaustedMidLoop || !modes.includes("outcome_verification")) {
      phases.verify = {
        timestamp: new Date().toISOString(),
        status: budgetExhaustedMidLoop ? "stopped_budget_exhausted" : "skipped",
        summary: "Outcome verification skipped due to mode filter or budget cap",
      };
    } else {
      const verifyOut = await runVerifyOutcomes({
        config: resolvedConfig,
        targetUrl,
        apiUrl,
        mailpitUrl,
        langfuseUrl,
        pgQuery: opts.pgQuery ?? cfg.pgQuery,
        memoryDir,
        timeoutMs: 3000,
      });
      toolsRun.add("verify-outcomes");
      for (const e of verifyOut.coverage.endpoints) endpoints.add(e);
      for (const f of verifyOut.findings) newFindings.push(f);
      const bCheck = updateBudget(verifyOut.budgetConsumed.requests, 0);
      if (bCheck.exitCode === 3) budgetExhaustedMidLoop = true;
      phases.verify = {
        timestamp: new Date().toISOString(),
        status: verifyOut.status === "degraded" ? "degraded" : "completed",
        summary: verifyOut.notes,
      };
    }

    // Phase 6: reproduce (deduplicate first so IDs & filenames are monotonic and deterministic)
    const nowIso = new Date().toISOString();
    const existingByFingerprint = new Map();
    let maxNumericId = 0;

    const persistDurableEvidencePaths = (paths) => {
      const kept = [];
      const evidenceDir = path.join(memoryDir, "evidence");
      for (const rawPath of paths || []) {
        if (!rawPath || typeof rawPath !== "string") continue;
        const norm = rawPath.replaceAll("\\", "/");
        if (norm.startsWith("test-results/")) {
          const absSrc = path.resolve(STAGING_ROOT, norm);
          if (fs.existsSync(absSrc)) {
            ensureDir(evidenceDir);
            const absDst = path.join(evidenceDir, path.basename(absSrc));
            if (!fs.existsSync(absDst)) {
              fs.copyFileSync(absSrc, absDst);
            }
            kept.push(toStagingRelPath(absDst));
          }
        } else {
          kept.push(rawPath);
        }
      }
      return uniqueStrings(kept);
    };

    for (const existing of findingsLedger.findings) {
      const m = String(existing.id || "").match(/^QA-(\d+)$/);
      if (m) maxNumericId = Math.max(maxNumericId, Number.parseInt(m[1], 10));
      const fp = existing.fingerprint || `${existing.classification}|${existing.endpointOrRoute || existing.title}`;
      existing.fingerprint = fp;
      existing.evidencePaths = persistDurableEvidencePaths(existing.evidencePaths || []);
      existingByFingerprint.set(fp, existing);
    }

    const candidateReproScripts = [];
    const touchedFindings = [];
    for (const candidate of newFindings) {
      if (candidate.reproScript) {
        candidateReproScripts.push(candidate.reproScript);
      }
      const fp =
        candidate.fingerprint ||
        `${candidate.classification}|${candidate.endpointOrRoute || candidate.title}`;
      const durableEvidence = persistDurableEvidencePaths(candidate.evidencePaths || []);
      const existing = existingByFingerprint.get(fp);
      if (existing) {
        existing.lastSeenAt = nowIso;
        existing.occurrences = (existing.occurrences || 1) + 1;
        if (!existing.checkMode && candidate.checkMode) {
          existing.checkMode = candidate.checkMode;
        }
        if (!existing.tokenEnv && candidate.tokenEnv) {
          existing.tokenEnv = candidate.tokenEnv;
        }
        if (!existing.headersEnv && candidate.headersEnv) {
          existing.headersEnv = candidate.headersEnv;
        }
        if (candidate.authRequired) {
          existing.authRequired = true;
        }
        if (!existing.role && candidate.role) {
          existing.role = candidate.role;
        }
        if (candidate.allowPrivateIp) {
          existing.allowPrivateIp = true;
        }
        const existingReproAbs = existing.reproScript
          ? path.isAbsolute(existing.reproScript)
            ? existing.reproScript
            : path.resolve(STAGING_ROOT, existing.reproScript)
          : null;
        if ((!existingReproAbs || !fs.existsSync(existingReproAbs)) && candidate.reproScript) {
          existing.reproScript = candidate.reproScript;
        }
        existing.evidencePaths = uniqueStrings([...(existing.evidencePaths || []), ...durableEvidence]);
        if (!existing.verifiedOutcome && candidate.verifiedOutcome) {
          existing.verifiedOutcome = candidate.verifiedOutcome;
        }
        touchedFindings.push(existing);
      } else {
        maxNumericId += 1;
        const assignedId = `QA-${String(maxNumericId).padStart(3, "0")}`;
        const record = {
          id: assignedId,
          fingerprint: fp,
          classification: candidate.classification,
          severity: candidate.severity || "medium",
          title: candidate.title,
          endpointOrRoute: candidate.endpointOrRoute || "",
          ...(candidate.checkMode ? { checkMode: candidate.checkMode } : {}),
          ...(candidate.role ? { role: candidate.role } : {}),
          ...(candidate.authRequired ? { authRequired: true } : {}),
          ...(candidate.tokenEnv ? { tokenEnv: candidate.tokenEnv } : {}),
          ...(candidate.headersEnv ? { headersEnv: candidate.headersEnv } : {}),
          ...(candidate.allowPrivateIp || allowPrivateIp ? { allowPrivateIp: true } : {}),
          reproCommand: candidate.reproCommand || `curl -i ${apiOrigin || targetUrl || "http://127.0.0.1"}`,
          reproScript: candidate.reproScript || "",
          evidencePaths: durableEvidence,
          verifiedOutcome: candidate.verifiedOutcome || "Observed during autonomous QA loop",
          firstSeenAt: nowIso,
          lastSeenAt: nowIso,
          occurrences: 1,
        };
        findingsLedger.findings.push(record);
        existingByFingerprint.set(fp, record);
        touchedFindings.push(record);
      }
    }

    const reproRes = generateRegressionScripts(
      touchedFindings,
      apiOrigin,
      memoryDir,
      targetUrl,
      resolvedConfig,
      allowPrivateIp,
    );
    const regDirAbs = path.resolve(path.join(memoryDir, "regressions"));
    const referencedRepros = new Set(
      findingsLedger.findings.map((f) => (f.reproScript ? path.resolve(STAGING_ROOT, f.reproScript) : null)).filter(Boolean),
    );
    for (const candScript of uniqueStrings(candidateReproScripts)) {
      const candAbs = path.isAbsolute(candScript) ? path.resolve(candScript) : path.resolve(STAGING_ROOT, candScript);
      if (candAbs.startsWith(regDirAbs + path.sep) && !referencedRepros.has(candAbs) && fs.existsSync(candAbs)) {
        fs.rmSync(candAbs, { force: true });
      }
    }
    phases.reproduce = {
      timestamp: new Date().toISOString(),
      status: reproRes.warnings.length > 0 ? "degraded" : "completed",
      summary: `Verified syntax for ${reproRes.generated.length} regression script(s)${reproRes.warnings.length > 0 ? ` (${reproRes.warnings.length} syntax warning(s))` : ""}`,
    };

    // Phase 7: report
    writeJsonAtomic(findingsPath, findingsLedger);

    const iterCompletedAt = new Date().toISOString();
    phases.explore_further = {
      timestamp: iterCompletedAt,
      status: budgetExhaustedMidLoop ? "stopped_budget_exhausted" : "completed",
      summary: budgetExhaustedMidLoop
        ? "Stopping loop: request or runtime budget exhausted"
        : iterIdx + 1 < maxIterations
          ? "Proceeding to next QA loop iteration"
          : "Completed requested iterations",
    };

    phases.report = {
      timestamp: iterCompletedAt,
      status: "completed",
      summary: `Persisted iteration #${iterNum} and ${findingsLedger.findings.length} finding(s)`,
    };

    coverageLedger.iterations.push({
      iteration: iterNum,
      startedAt: iterStartedAt,
      completedAt: iterCompletedAt,
      phases,
      toolsRun: Array.from(toolsRun),
      routes: Array.from(routes),
      endpoints: Array.from(endpoints),
      roles: Array.from(roles),
      modes,
      budgetSnapshot: currentBudget,
    });
    writeJsonAtomic(coveragePath, coverageLedger);
    iterationsCompleted += 1;

    if (budgetExhaustedMidLoop) break;
  }

  let reportPath = null;
  if (opts.outReport) {
    const rep = generateHtmlReport({ out: opts.outReport, memoryDir, config: resolvedConfig });
    reportPath = rep.outPath;
  }

  return {
    exitCode: 0,
    summary: sanitizeForOutput({
      ok: true,
      status: isBudgetExhausted(currentBudget) ? "stopped_budget_exhausted" : "completed",
      iterationsCompleted,
      totalIterationsRecorded: coverageLedger.iterations.length,
      totalFindingsRecorded: findingsLedger.findings.length,
      budget: currentBudget,
      coverageLedgerPath: toStagingRelPath(coveragePath),
      findingsLedgerPath: toStagingRelPath(findingsPath),
      reportPath,
    }),
  };
}

async function main() {
  const { values } = parseCliArgs(process.argv.slice(2), {
    booleanFlags: ["dry-run", "reset-budget", "allow-private-ip", "help"],
    multiFlags: ["repo-path"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/run-qa-loop.mjs [--config <path>] --target-url <url> [--api-url <url>] [--ai-url <url>] [--ai-provider <id-or-file>] [--mailpit-url <url>] [--langfuse-url <url>] [--pg-query <sql>] [--memory-dir <dir>] [--budget-file <path>] [--iterations N] [--max-requests N] [--max-ai-calls N] [--dry-run] [--out-report <path>]",
    );
    process.exit(0);
  }

  const res = await runQaLoop({
    config: values.config,
    targetUrl: values["target-url"],
    apiUrl: values["api-url"],
    aiUrl: values["ai-url"],
    aiProvider: values["ai-provider"],
    mailpitUrl: values["mailpit-url"],
    langfuseUrl: values["langfuse-url"],
    oidcUrl: values["oidc-url"],
    openapiUrl: values["openapi-url"],
    storageState: values["storage-state"],
    pgQuery: values["pg-query"],
    repoPaths: values["repo-path"],
    memoryDir: values["memory-dir"],
    budgetFile: values["budget-file"],
    modes: values.modes,
    iterations: values.iterations,
    maxIterations: values["max-iterations"],
    maxMinutes: values["max-minutes"],
    maxRequests: values["max-requests"],
    maxAiCalls: values["max-ai-calls"],
    dryRun: Boolean(values["dry-run"]),
    outReport: values["out-report"],
    resetBudget: Boolean(values["reset-budget"]),
    allowPrivateIp: values["allow-private-ip"] ? true : undefined,
  });

  console.log(JSON.stringify(res.summary, null, 2));
  process.exit(res.exitCode);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
