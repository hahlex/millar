#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ensureDir,
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
    tool: "playwright",
    mode: "exploratory",
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
      screenshots: uniqueStrings(fields.screenshots || []),
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

function buildUiReproScript(finding, defaultTargetUrl, checkType, routePath, authMeta = {}) {
  const safeId = stripEmDash(String(finding.id || "QA-UI-001")).replace(/[\r\n]+/g, " ");
  const safeTitle = stripEmDash(String(finding.title || "UI Defect")).replace(/[\r\n]+/g, " ");
  const pkgJsonPath = path.join(STAGING_ROOT, "package.json");
  const requiredRole = String(authMeta.roleName || "guest");
  const authRequired = Boolean(authMeta.authRequired);
  const headersRequired = Boolean(authMeta.headersRequired);
  const defaultTokenEnv = String(authMeta.tokenEnv || (authRequired && !headersRequired ? "QA_TOKEN" : ""));
  const defaultHeadersEnv = String(authMeta.headersEnv || (headersRequired ? "QA_HEADERS" : ""));
  const requiredHeaderKeys = Array.isArray(authMeta.requiredHeaderKeys)
    ? authMeta.requiredHeaderKeys.map((k) => sanitizeText(String(k))).filter(Boolean)
    : [];
  const defaultStorageState = authMeta.storageState ? String(authMeta.storageState) : "";
  const localStorageKey = String(authMeta.localStorageKey || "");
  const cleanStorageEntries = {};
  if (authMeta.localStorageEntries && typeof authMeta.localStorageEntries === "object") {
    for (const [k, v] of Object.entries(authMeta.localStorageEntries)) {
      if (localStorageKey && k === localStorageKey) continue;
      const isSensitiveKey =
        /(?:password|passwd|secret|api_key|apikey|client_secret|access_token|refresh_token|auth_token|token|cookie|set-cookie|authorization|x-api-key|x-auth-token)/i.test(
          String(k),
        );
      const rawStr = typeof v === "string" ? v : JSON.stringify(v);
      cleanStorageEntries[k] = isSensitiveKey ? "[REDACTED]" : sanitizeText(rawStr);
    }
  }
  const subResourceMethod = String(authMeta.subResourceMethod || "GET");
  const subResourcePath = String(authMeta.subResourcePath || "");

  return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(${JSON.stringify(pkgJsonPath)});
const { chromium } = require("playwright");

const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}

const baseUrl = getFlag("--target-url", getFlag("--api-url", ${JSON.stringify(defaultTargetUrl)}));
const targetUrl = new URL(${JSON.stringify(routePath)}, baseUrl).toString();
const checkType = ${JSON.stringify(checkType)};
const requiredRole = ${JSON.stringify(requiredRole)};
const authRequired = ${JSON.stringify(authRequired)};
const headersRequired = ${JSON.stringify(headersRequired)};
const defaultTokenEnv = ${JSON.stringify(defaultTokenEnv)};
const defaultHeadersEnv = ${JSON.stringify(defaultHeadersEnv)};
const requiredHeaderKeys = ${JSON.stringify(requiredHeaderKeys)};
const defaultStorageState = ${JSON.stringify(defaultStorageState)};
const storageStateArg = getFlag("--storage-state", defaultStorageState);
const tokenEnvName = getFlag("--token-env", defaultTokenEnv);
const headersEnvName = getFlag("--headers-env", defaultHeadersEnv);
const workspaceMode = getFlag("--workspace", process.env.QA_WORKSPACE_MODE || "");
const localStorageKey = ${JSON.stringify(localStorageKey)};
const defaultStorageEntries = ${JSON.stringify(cleanStorageEntries)};
const subResourceMethod = ${JSON.stringify(subResourceMethod)};
const subResourcePath = ${JSON.stringify(subResourcePath)};

const authToken = tokenEnvName ? String(process.env[tokenEnvName] || "").trim() : "";
const rawHeadersEnv = headersEnvName ? String(process.env[headersEnvName] || "").trim() : "";
const extraHeaders = {};
if (rawHeadersEnv) {
  try {
    const parsedHdrs = JSON.parse(rawHeadersEnv);
    if (parsedHdrs && typeof parsedHdrs === "object" && !Array.isArray(parsedHdrs)) {
      for (const [hk, hv] of Object.entries(parsedHdrs)) {
        if (hv !== undefined && hv !== null) extraHeaders[hk] = String(hv);
      }
    } else {
      console.error("AUTH_ENV_REQUIRED", ${JSON.stringify(safeId)}, "role=" + requiredRole, "headersEnv=" + headersEnvName);
      process.exit(2);
    }
  } catch {
    const colonIdx = rawHeadersEnv.indexOf(":");
    if (colonIdx > 0) {
      extraHeaders[rawHeadersEnv.slice(0, colonIdx).trim()] = rawHeadersEnv.slice(colonIdx + 1).trim();
    } else if (requiredHeaderKeys.length === 1) {
      extraHeaders[requiredHeaderKeys[0]] = rawHeadersEnv;
    } else {
      console.error("AUTH_ENV_REQUIRED", ${JSON.stringify(safeId)}, "role=" + requiredRole, "headersEnv=" + headersEnvName);
      process.exit(2);
    }
  }
}
const hasExtraAuthHeader = Object.keys(extraHeaders).some((k) => k.toLowerCase() === "authorization");
let hasSuppliedHeaders = Object.keys(extraHeaders).length > 0;
if (authToken) {
  if (
    headersRequired &&
    Object.keys(extraHeaders).length === 0 &&
    !defaultTokenEnv &&
    requiredHeaderKeys.length === 1 &&
    requiredHeaderKeys[0].toLowerCase() !== "authorization"
  ) {
    extraHeaders[requiredHeaderKeys[0]] = authToken;
    hasSuppliedHeaders = true;
  } else if (!localStorageKey && !hasExtraAuthHeader) {
    const authHeaderName = "Authorization";
    extraHeaders[authHeaderName] = authToken.startsWith("Bearer ") ? authToken : "Bearer " + authToken;
  }
}

const hasExtraHeaders = Object.keys(extraHeaders).length > 0;
function resolveStorageStatePath(rawPath) {
  if (!rawPath) return "";
  const trimmed = String(rawPath).trim();
  if (!trimmed) return "";
  if (path.isAbsolute(trimmed)) return trimmed;
  const candidates = [
    path.resolve(process.cwd(), trimmed),
    path.resolve(path.dirname(${JSON.stringify(pkgJsonPath)}), trimmed),
    path.resolve(import.meta.dirname, trimmed),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return candidates[0];
}
const resolvedStorageState = resolveStorageStatePath(storageStateArg);
const hasStorageState = Boolean(resolvedStorageState && fs.existsSync(resolvedStorageState));

if (authRequired) {
  if (headersRequired && !hasSuppliedHeaders) {
    console.error("AUTH_ENV_REQUIRED", ${JSON.stringify(safeId)}, "role=" + requiredRole, "headersEnv=" + (headersEnvName || "QA_HEADERS"));
    process.exit(2);
  }
  if ((!headersRequired || defaultTokenEnv) && !authToken && !hasStorageState) {
    console.error("AUTH_ENV_REQUIRED", ${JSON.stringify(safeId)}, "role=" + requiredRole, "tokenEnv=" + (tokenEnvName || "QA_TOKEN"));
    process.exit(2);
  }
}

let browser;
let exitCode = 1;
try {
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
  const contextOpts = { viewport: { width: 1280, height: 720 } };
  if (hasExtraHeaders) {
    contextOpts.extraHTTPHeaders = extraHeaders;
  }
  if (hasStorageState) {
    contextOpts.storageState = resolvedStorageState;
  }
  const context = await browser.newContext(contextOpts);
  if (hasExtraHeaders) {
    await context.setExtraHTTPHeaders(extraHeaders);
  }
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const serverErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err instanceof Error ? err.message : String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("response", (res) => {
    if (res.status() >= 500) serverErrors.push(res.status() + " " + res.url());
  });

  const entriesToInject = { ...defaultStorageEntries };
  if (authToken && localStorageKey) {
    entriesToInject[localStorageKey] = authToken;
  }
  if (workspaceMode) {
    entriesToInject["hahlex.last-workspace"] = workspaceMode;
  }
  if (Object.keys(entriesToInject).length > 0) {
    const baseOrigin = new URL(baseUrl).origin;
    await page.goto(baseOrigin, { waitUntil: "domcontentloaded", timeout: 6000 }).catch(() => {});
    await page.evaluate((entries) => {
      for (const [k, v] of Object.entries(entries)) {
        try {
          window.localStorage.setItem(k, v);
        } catch {
          // ignore storage error
        }
      }
    }, entriesToInject);
  }

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 8000 });
  await page
    .waitForFunction(() => (document.body?.innerText || "").trim().length > 60, null, { timeout: 1500 })
    .catch(() => {});
  await page.waitForTimeout(350);

  const linkCount = await page.locator("a[href]").count().catch(() => 0);
  if (linkCount === 0) {
    const wsPattern = workspaceMode === "teaching"
      ? /Giảng dạy|Teaching|Vào không gian|Enter/i
      : /Quản lý|Giảng dạy|Teaching|Management|Vào không gian|Enter/i;
    const wsBtn = page.locator("button").filter({ hasText: wsPattern }).first();
    if ((await wsBtn.count().catch(() => 0)) > 0) {
      await wsBtn.click().catch(() => {});
      await page.waitForTimeout(600);
    }
  }
  await page.waitForTimeout(400);

  if (checkType === "server_5xx" && subResourcePath && serverErrors.length === 0) {
    try {
      const subUrl = new URL(subResourcePath, baseUrl).toString();
      const hdrs = { ...extraHeaders };
      const hasAuthHdr = Object.keys(hdrs).some((k) => k.toLowerCase() === "authorization");
      if (authToken && !localStorageKey && !hasAuthHdr) {
        const authHeaderName = "Authorization";
        hdrs[authHeaderName] = authToken.startsWith("Bearer ") ? authToken : "Bearer " + authToken;
      }
      const subRes = hasStorageState
        ? await context.request.fetch(subUrl, { method: subResourceMethod, headers: hdrs, timeout: 4000 })
        : await fetch(subUrl, { method: subResourceMethod, headers: hdrs, signal: AbortSignal.timeout(4000) });
      const subStatus = typeof subRes.status === "function" ? subRes.status() : subRes.status;
      if (subStatus >= 500) {
        serverErrors.push(subStatus + " " + subUrl);
      }
    } catch {
      // ignore direct probe error
    }
  }

  let reproduced = false;
  if (checkType === "pageerror") reproduced = pageErrors.length > 0;
  else if (checkType === "console_error") reproduced = consoleErrors.length > 0;
  else if (checkType === "server_5xx") reproduced = serverErrors.length > 0;
  else reproduced = pageErrors.length > 0 || consoleErrors.length > 0 || serverErrors.length > 0;

  if (reproduced) {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, JSON.stringify({ pageErrors, consoleErrors, serverErrors }));
    exitCode = 1;
  } else {
    console.log("RESOLVED", ${JSON.stringify(safeId)}, targetUrl);
    exitCode = 0;
  }
} catch (err) {
  console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, err instanceof Error ? err.message : String(err));
  exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
}
process.exit(exitCode);
`;
}

async function launchBrowser() {
  const { chromium } = await import("playwright");
  try {
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    return { browser, channelUsed: "chrome" };
  } catch (chromeErr) {
    try {
      const browser = await chromium.launch({ headless: true });
      return { browser, channelUsed: "chromium-fallback" };
    } catch (fallbackErr) {
      const msg = [
        chromeErr instanceof Error ? chromeErr.message : String(chromeErr),
        fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
      ].join(" | ");
      return { browser: null, error: msg };
    }
  }
}

function isExpectedGuestAuthNoise(text, roleName) {
  if (roleName !== "guest") return false;
  return /status of 401|status of 403|\b401\s*\(Unauthorized\)/i.test(String(text || ""));
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

async function main() {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();

  const { values } = parseCliArgs(process.argv.slice(2), {
    booleanFlags: ["dry-run", "allow-private-ip", "help"],
    multiFlags: ["repo-path"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/runners/ui-explorer.mjs [--config <path>] --target-url <url> [--api-url <url>] [--storage-state <path>] [--memory-dir <dir>] [--trace-dir <dir>] [--out <file>] [--max-requests N] [--dry-run]",
    );
    process.exit(0);
  }

  const resolvedConfig = values.config ? resolveConfigPath(values.config) : undefined;
  const cfg = resolvedConfig ? loadConfigFile(resolvedConfig) : {};
  const configDir = resolvedConfig ? path.dirname(resolvedConfig) : null;
  const cliStorageState = values["storage-state"]
    ? resolvePathCandidates(String(values["storage-state"]), [process.cwd(), configDir, STAGING_ROOT])
    : "";
  const targetUrl = values["target-url"] ?? cfg.targetUrl;
  const apiUrl = values["api-url"] ?? cfg.apiUrl ?? targetUrl;
  const memoryDir = path.resolve(values["memory-dir"] || MEMORY_DIR);
  const traceDir = path.resolve(values["trace-dir"] || path.join(memoryDir, "traces"));
  const regDir = path.join(memoryDir, "regressions");
  const maxRequests = parseNonNegativeNumber(
    values["max-requests"] ?? cfg.maxRequests ?? cfg.limits?.maxRequests,
    30,
    "--max-requests",
  );
  const dryRun = Boolean(values["dry-run"]);

  if (!targetUrl) {
    emitAndExit(
      buildOutput({
        status: "skipped_non_applicable",
        startedAt,
        startedMs,
        notes: "No --target-url provided; skipping Playwright UI exploration.",
      }),
      values.out,
      0,
    );
  }

  const safetyCheck = evaluateSafetyAndBudget({
    config: values.config,
    targetUrl,
    apiUrl,
    allowPrivateIp: Boolean(values["allow-private-ip"] || cfg.allowPrivateIp),
    budgetFile: path.join(TEST_RESULTS_DIR, `.guard-${process.pid}-${Date.now()}.json`),
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
            id: "QA-UI-SAFETY-001",
            classification: "runtime_degraded",
            severity: "critical",
            title: "Safety guard rejected target URL",
            reproCommand: `node scripts/safety-guard.mjs --target-url ${targetUrl}`,
            evidencePaths: [],
            verifiedOutcome: (safetyCheck.payload?.reasons || []).join("; ") || "Safety guard failure",
          },
        ],
        notes: "Safety guard blocked non-compliant target URL.",
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
        routes: [new URL(targetUrl).pathname || "/"],
        notes: "Dry run enabled; skipped Playwright browser execution.",
      }),
      values.out,
      0,
    );
  }

  ensureDir(traceDir);
  ensureDir(regDir);
  const evidenceDir = path.join(memoryDir, "evidence");
  ensureDir(evidenceDir);
  const uniqueTag = makeUniqueTag();
  const pwTraceDir = path.join(TEST_RESULTS_DIR, "playwright-traces");
  const screenshotDir = path.join(TEST_RESULTS_DIR, "screenshots");
  ensureDir(pwTraceDir);
  ensureDir(screenshotDir);

  const jsonTracePath = path.join(traceDir, `ui-explorer-${uniqueTag}.json`);
  const relJsonTracePath = toStagingRelPath(jsonTracePath);

  const launchRes = await launchBrowser();
  if (!launchRes.browser) {
    const output = buildOutput({
      status: "degraded",
      startedAt,
      startedMs,
      findings: [
        {
          id: "QA-UI-DEGRADED-001",
          fingerprint: "runtime_degraded|playwright_launch",
          classification: "runtime_degraded",
          severity: "medium",
          title: "Playwright browser launch failed",
          reproCommand: `node scripts/runners/ui-explorer.mjs --target-url ${targetUrl}`,
          evidencePaths: [relJsonTracePath],
          verifiedOutcome: sanitizeText(launchRes.error || "Unknown browser launch error"),
        },
      ],
      traces: [relJsonTracePath],
      notes: `Playwright browser could not launch: ${launchRes.error}`,
    });
    writeJsonAtomic(jsonTracePath, output);
    emitAndExit(output, values.out, 0);
  }

  const browser = launchRes.browser;
  const routesVisited = [];
  const endpointsObserved = [];
  const rolesVisited = [];
  const findings = [];
  const traceArtifacts = [relJsonTracePath];
  const screenshots = [];
  const regressionTests = [];
  const pageReports = [];
  const seenFingerprints = new Set();

  let requestsConsumed = 0;
  let assertions = 0;
  let targetReachable = false;

  const rawConfiguredRoles =
    Array.isArray(cfg.roles) && cfg.roles.length > 0
      ? cfg.roles
      : Array.isArray(cfg.accounts) && cfg.accounts.length > 0
        ? cfg.accounts
        : [{ role: "guest", tenantId: "default" }];
  const roleCap = Math.min(rawConfiguredRoles.length, Math.max(1, Math.floor(maxRequests / 4)));
  const configuredRoles = rawConfiguredRoles.slice(0, roleCap);

  const parsedEntry = new URL(targetUrl);
  const entryOrigin = parsedEntry.origin;
  const entryRouteWithSearch = `${parsedEntry.pathname || "/"}${parsedEntry.search || ""}`;
  const softDeadlineMs =
    startedMs + (configuredRoles.length >= 5 ? 48000 : configuredRoles.length > 2 ? 32000 : 18000);

  const pushFinding = (f, checkType, routePath, authMeta = {}) => {
    const fp = f.fingerprint;
    if (seenFingerprints.has(fp)) return null;
    seenFingerprints.add(fp);

    if (authMeta.roleName && authMeta.roleName !== "guest") {
      f.role = authMeta.roleName;
    }
    if (authMeta.authRequired) {
      f.authRequired = true;
    }
    if (authMeta.tokenEnv) {
      f.tokenEnv = authMeta.tokenEnv;
    }
    if (authMeta.headersEnv) {
      f.headersEnv = authMeta.headersEnv;
    }

    if (f.classification === "confirmed_bug") {
      const regName = `ui-${slugify(f.id, 16)}-${uniqueTag}.mjs`;
      const regAbs = path.join(regDir, regName);
      const src = buildUiReproScript(f, entryOrigin, checkType, routePath, authMeta);
      writeTextAtomic(regAbs, src);
      let syntaxOk = true;
      try {
        execFileSync(process.execPath, ["--check", regAbs], { windowsHide: true, timeout: 4000 });
      } catch {
        syntaxOk = false;
        fs.rmSync(regAbs, { force: true });
      }
      if (syntaxOk) {
        const relReg = toStagingRelPath(regAbs);
        f.reproScript = relReg;
        regressionTests.push(relReg);
      }
    }
    findings.push(f);
    return f;
  };

  try {
    for (let roleIdx = 0; roleIdx < configuredRoles.length; roleIdx += 1) {
      const roleCfg = configuredRoles[roleIdx];
      if (Date.now() > softDeadlineMs || requestsConsumed >= maxRequests) break;

      const roleName = String(roleCfg.role || roleCfg.name || "guest");
      const tenantId = String(roleCfg.tenantId || "default");
      rolesVisited.push(roleName);

      const rawHeadersObj =
        roleCfg.headers && typeof roleCfg.headers === "object" && !Array.isArray(roleCfg.headers)
          ? roleCfg.headers
          : null;
      const headerKeys = rawHeadersObj ? Object.keys(rawHeadersObj).filter((k) => String(k).trim().length > 0) : [];
      let runtimeRoleHeaders = rawHeadersObj ? { ...rawHeadersObj } : null;
      if ((!runtimeRoleHeaders || headerKeys.length === 0) && roleCfg.headersEnv && process.env[String(roleCfg.headersEnv)]) {
        const rawEnvHdrs = String(process.env[String(roleCfg.headersEnv)]).trim();
        if (rawEnvHdrs) {
          try {
            const parsedEnvHdrs = JSON.parse(rawEnvHdrs);
            if (parsedEnvHdrs && typeof parsedEnvHdrs === "object" && !Array.isArray(parsedEnvHdrs)) {
              runtimeRoleHeaders = {};
              for (const [k, v] of Object.entries(parsedEnvHdrs)) {
                const ks = String(k).trim();
                if (ks && v !== undefined && v !== null) {
                  runtimeRoleHeaders[ks] = String(v);
                  if (!headerKeys.includes(ks)) headerKeys.push(ks);
                }
              }
            }
          } catch {
            const colonIdx = rawEnvHdrs.indexOf(":");
            if (colonIdx > 0) {
              const hk = rawEnvHdrs.slice(0, colonIdx).trim();
              const hv = rawEnvHdrs.slice(colonIdx + 1).trim();
              if (hk) {
                runtimeRoleHeaders = { [hk]: hv };
                if (!headerKeys.includes(hk)) headerKeys.push(hk);
              }
            }
          }
        }
      }
      const hasRoleHeaders = headerKeys.length > 0 || Boolean(roleCfg.headersEnv);
      const headersEnvName = roleCfg.headersEnv ? String(roleCfg.headersEnv) : hasRoleHeaders ? "QA_HEADERS" : "";
      const tokenEnvName = roleCfg.tokenEnv ? String(roleCfg.tokenEnv) : "";
      const rawResolvedToken = roleCfg.token || (tokenEnvName ? process.env[tokenEnvName] : null);
      const resolvedToken =
        rawResolvedToken !== null && rawResolvedToken !== undefined ? String(rawResolvedToken).trim() : "";

      const contextHeaders = runtimeRoleHeaders ? { ...runtimeRoleHeaders } : {};
      const hasRuntimeAuthHeader = Object.keys(contextHeaders).some((k) => k.toLowerCase() === "authorization");
      if (!roleCfg.localStorageKey && resolvedToken && !hasRuntimeAuthHeader) {
        contextHeaders.Authorization = resolvedToken.startsWith("Bearer ")
          ? resolvedToken
          : `Bearer ${resolvedToken}`;
      }

      const contextOpts = { viewport: { width: 1280, height: 720 } };
      if (Object.keys(contextHeaders).length > 0) {
        contextOpts.extraHTTPHeaders = contextHeaders;
      }
      const rawRoleStorageState = roleCfg.storageState ? String(roleCfg.storageState) : "";
      const resolvedRoleStorageState = rawRoleStorageState
        ? resolvePathCandidates(rawRoleStorageState, [configDir, process.cwd(), STAGING_ROOT])
        : "";
      const effectiveStorageState = cliStorageState || resolvedRoleStorageState;
      if (effectiveStorageState && fs.existsSync(effectiveStorageState)) {
        contextOpts.storageState = effectiveStorageState;
      }

      const context = await browser.newContext(contextOpts);
      const pwZipPath = path.join(pwTraceDir, `ui-${uniqueTag}-${slugify(roleName, 16)}.zip`);
      let tracingActive = false;
      try {
        await context.tracing.start({ screenshots: true, snapshots: false });
        tracingActive = true;
      } catch {
        tracingActive = false;
      }

      const page = await context.newPage();
      const visitedInContext = new Set();
      const seedRoutes = Array.isArray(roleCfg.routes) ? roleCfg.routes.filter((r) => typeof r === "string" && r.startsWith("/")) : [];
      const queue = uniqueStrings([entryRouteWithSearch, ...seedRoutes]);

      try {
        // Optional token/login bootstrap when credentials exist
        const storageEntries = {};
        if (roleCfg.localStorageEntries && typeof roleCfg.localStorageEntries === "object") {
          for (const [sk, sv] of Object.entries(roleCfg.localStorageEntries)) {
            storageEntries[sk] = typeof sv === "string" ? sv : JSON.stringify(sv);
          }
        }
        if (resolvedToken && roleCfg.localStorageKey) {
          storageEntries[roleCfg.localStorageKey] = String(resolvedToken);
        }
        const roleAuthRequired =
          (roleName !== "guest" || Boolean(cliStorageState)) &&
          Boolean(
            resolvedToken ||
              tokenEnvName ||
              hasRoleHeaders ||
              effectiveStorageState ||
              (roleCfg.loginUrl && roleCfg.email),
          );
        const roleAuthMetaBase = {
          roleName,
          authRequired: roleAuthRequired,
          headersRequired: hasRoleHeaders,
          headersEnv: headersEnvName,
          requiredHeaderKeys: headerKeys,
          storageState: effectiveStorageState || "",
          tokenEnv: tokenEnvName || (roleAuthRequired && (!hasRoleHeaders || resolvedToken) ? "QA_TOKEN" : ""),
          localStorageKey: roleCfg.localStorageKey ? String(roleCfg.localStorageKey) : "",
          localStorageEntries: roleCfg.localStorageEntries || null,
        };

        if (Object.keys(storageEntries).length > 0) {
          await page.goto(entryOrigin, { waitUntil: "domcontentloaded", timeout: 6000 }).catch(() => {});
          await page.evaluate(
            (entries) => {
              for (const [k, v] of Object.entries(entries)) {
                try {
                  window.localStorage.setItem(k, v);
                } catch {
                  // ignore storage error
                }
              }
            },
            storageEntries,
          );
          requestsConsumed += 1;
        } else if (roleCfg.loginUrl && roleCfg.email && roleCfg.password) {
          const loginPageUrl = new URL(roleCfg.loginUrl, entryOrigin).toString();
          await page.goto(loginPageUrl, { waitUntil: "domcontentloaded", timeout: 6000 }).catch(() => {});
          requestsConsumed += 1;
          const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
          const passInput = page.locator('input[type="password"], input[name="password"]').first();
          if ((await emailInput.count()) > 0 && (await passInput.count()) > 0) {
            await emailInput.fill(String(roleCfg.email));
            await passInput.fill(String(roleCfg.password));
            const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first();
            if ((await submitBtn.count()) > 0) {
              await submitBtn.click().catch(() => {});
              await page.waitForTimeout(350);
            }
          }
        }

        const remainingRoles = Math.max(1, configuredRoles.length - roleIdx);
        const perRoleCap = configuredRoles.length >= 5 ? 3 : 6;
        const maxRoutesForRole = Math.max(1, Math.min(perRoleCap, Math.floor((maxRequests - requestsConsumed) / remainingRoles)));
        let routesExploredInRole = 0;

        while (queue.length > 0 && routesExploredInRole < maxRoutesForRole && requestsConsumed < maxRequests && Date.now() < softDeadlineMs) {
          const relRoute = queue.shift();
          if (!relRoute || visitedInContext.has(relRoute)) continue;
          visitedInContext.add(relRoute);

          const fullPageUrl = new URL(relRoute, entryOrigin).toString();
          const pageErrors = [];
          const consoleErrors = [];
          const ignoredConsoleAuth = [];
          const serverErrors = [];
          const expectedAuthStatuses = [];

          const onPageError = (err) => {
            pageErrors.push(err instanceof Error ? err.message : String(err));
          };
          const onConsole = (msg) => {
            if (msg.type() === "error") {
              const txt = msg.text();
              if (isExpectedGuestAuthNoise(txt, roleName)) {
                ignoredConsoleAuth.push(txt);
              } else {
                consoleErrors.push(txt);
              }
            }
          };
          const onResponse = (res) => {
            const st = res.status();
            try {
              const u = new URL(res.url());
              if (
                u.pathname.startsWith("/api/") ||
                u.pathname.startsWith("/v1/") ||
                u.pathname === "/healthz" ||
                u.pathname === "/readyz"
              ) {
                endpointsObserved.push(`${res.request().method()} ${u.pathname}`);
              }
            } catch {
              // ignore non-standard url
            }
            if (st >= 500) {
              serverErrors.push({ status: st, url: res.url(), method: res.request().method() });
            } else if ((st === 401 || st === 403) && roleName === "guest") {
              expectedAuthStatuses.push({ status: st, url: res.url() });
            }
          };

          page.on("pageerror", onPageError);
          page.on("console", onConsole);
          page.on("response", onResponse);

          let navStatus = 0;
          let navError = null;
          try {
            requestsConsumed += 1;
            routesExploredInRole += 1;
            const resp = await page.goto(fullPageUrl, { waitUntil: "domcontentloaded", timeout: 7000 });
            navStatus = resp ? resp.status() : 200;
            targetReachable = true;
            await page
              .waitForFunction(() => (document.body?.innerText || "").trim().length > 60, null, { timeout: 1200 })
              .catch(() => {});
            await page.waitForTimeout(250);
          } catch (err) {
            navError = err instanceof Error ? err.message : String(err);
          }

          let domInfo = await page
            .evaluate(() => {
              const title = document.title || "";
              const textLen = (document.body?.innerText || "").trim().length;
              const hasMain = Boolean(document.querySelector("main, h1, [role='main']"));
              const links = Array.from(document.querySelectorAll("a[href]"))
                .map((a) => a.getAttribute("href") || "")
                .filter(Boolean);
              const formCount = document.querySelectorAll("form").length;
              return { title, textLen, hasMain, links, formCount };
            })
            .catch(() => ({ title: "", textLen: 0, hasMain: false, links: [], formCount: 0 }));

          // Fallback for WorkspaceChooser / PlatformModeChooser button screens when no nav links yet
          if (domInfo.links.length === 0 && Date.now() < softDeadlineMs - 1500) {
            const wsBtn = page
              .locator("button")
              .filter({ hasText: /Quản lý|Giảng dạy|Teaching|Management|Vào không gian|Enter/i })
              .first();
            if ((await wsBtn.count().catch(() => 0)) > 0) {
              await wsBtn.click().catch(() => {});
              await page.waitForTimeout(600);
              domInfo = await page
                .evaluate(() => {
                  const title = document.title || "";
                  const textLen = (document.body?.innerText || "").trim().length;
                  const hasMain = Boolean(document.querySelector("main, h1, [role='main']"));
                  const links = Array.from(document.querySelectorAll("a[href]"))
                    .map((a) => a.getAttribute("href") || "")
                    .filter(Boolean);
                  const formCount = document.querySelectorAll("form").length;
                  return { title, textLen, hasMain, links, formCount };
                })
                .catch(() => domInfo);
            }
          }

          assertions += 1;
          routesVisited.push(relRoute);

          // Non-mutating validation check + bounded safe QA-prefixed submission on non-destructive forms
          let formCheckSummary = null;
          if (domInfo.formCount > 0 && Date.now() < softDeadlineMs - 2000) {
            formCheckSummary = await page
              .evaluate(() => {
                const form = document.querySelector("form#quick-create") || document.querySelector("form");
                if (!form) return null;
                const reqInputs = Array.from(form.querySelectorAll("input[required], select[required], textarea[required]"));
                const hasRequired = reqInputs.length > 0;
                const emptyValid = form.checkValidity ? form.checkValidity() : true;
                const actionAttr = String(form.getAttribute("action") || "");
                const formId = String(form.id || "");
                const hasPassword = Boolean(form.querySelector('input[type="password"]'));
                const submitEl = form.querySelector('button[type="submit"], input[type="submit"]');
                const submitText = submitEl ? String(submitEl.textContent || submitEl.getAttribute("value") || "") : "";
                return {
                  id: formId || null,
                  action: actionAttr || null,
                  hasRequired,
                  emptyValid,
                  hasPassword,
                  hasSubmit: Boolean(submitEl),
                  submitText: submitText.trim(),
                  submitted: false,
                };
              })
              .catch(() => null);
            if (formCheckSummary) assertions += 1;

            const isBlockedFormContext =
              !formCheckSummary ||
              formCheckSummary.hasPassword ||
              !formCheckSummary.hasSubmit ||
              /\/(login|signin|sign-in|auth|logout|sign-out|assistant|finance|payroll|settings)/i.test(relRoute) ||
              /(login|signin|sign-in|auth|logout|sign-out|delete|remove|destroy|password|reset|payment|billing|checkout|invoice|transfer|erase|assistant|chat|invite|publish)/i.test(
                `${formCheckSummary.id || ""} ${formCheckSummary.action || ""} ${formCheckSummary.submitText || ""}`,
              );

            if (
              !dryRun &&
              !isBlockedFormContext &&
              requestsConsumed + 2 <= maxRequests &&
              !pageReports.some((r) => r.formCheckSummary?.submitted)
            ) {
              try {
                const safeValue = `__autqa_ui_${slugify(roleName, 10)}`;
                const filledCount = await page.evaluate((val) => {
                  const form = document.querySelector("form#quick-create") || document.querySelector("form");
                  if (!form) return 0;
                  let count = 0;
                  const inputs = form.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), textarea");
                  for (const inp of inputs) {
                    const t = (inp.getAttribute("type") || "text").toLowerCase();
                    if (t === "password" || t === "file") continue;
                    const fillVal = t === "email" ? "qa@hahlex.local" : t === "number" ? "1" : val;
                    inp.value = fillVal;
                    inp.dispatchEvent(new Event("input", { bubbles: true }));
                    inp.dispatchEvent(new Event("change", { bubbles: true }));
                    count += 1;
                  }
                  return count;
                }, safeValue);
                if (filledCount > 0) {
                  const formLoc = page.locator("form#quick-create").first();
                  const activeForm = (await formLoc.count()) > 0 ? formLoc : page.locator("form").first();
                  const subBtn = activeForm.locator('button[type="submit"], input[type="submit"]').first();
                  if ((await subBtn.count()) > 0) {
                    requestsConsumed += 1;
                    assertions += 1;
                    await subBtn.click({ timeout: 2500 }).catch(() => {});
                    await page.waitForTimeout(350);
                    formCheckSummary.submitted = true;
                    if (page.url() !== fullPageUrl) {
                      await page.goto(fullPageUrl, { waitUntil: "domcontentloaded", timeout: 3000 }).catch(() => {});
                    }
                  }
                }
              } catch {
                // ignore safe form submission failure
              }
            }
          }

          const routeFindings = [];
          const trackRouteFinding = (pushed) => {
            if (pushed) routeFindings.push(pushed);
          };

          if (navError) {
            trackRouteFinding(
              pushFinding(
                {
                  id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                  fingerprint: `runtime_degraded|ui:${relRoute}`,
                  classification: "runtime_degraded",
                  severity: "medium",
                  title: `UI route unreachable or navigation failed on ${relRoute}`,
                  endpointOrRoute: relRoute,
                  reproCommand: `node scripts/runners/ui-explorer.mjs --target-url ${fullPageUrl}`,
                  evidencePaths: [relJsonTracePath],
                  verifiedOutcome: sanitizeText(navError),
                },
                "navigation",
                relRoute,
                roleAuthMetaBase,
              ),
            );
          } else {
            if (navStatus >= 500) {
              trackRouteFinding(
                pushFinding(
                  {
                    id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                    fingerprint: `confirmed_bug|ui:http5xx:${relRoute}`,
                    classification: "confirmed_bug",
                    severity: "high",
                    title: `UI navigation returned HTTP ${navStatus} on ${relRoute}`,
                    endpointOrRoute: relRoute,
                    checkMode: "status_gte_500",
                    reproCommand: `curl -i ${fullPageUrl}`,
                    evidencePaths: [relJsonTracePath],
                    verifiedOutcome: `Playwright navigation to ${fullPageUrl} as role=${roleName} returned HTTP ${navStatus}`,
                  },
                  "server_5xx",
                  relRoute,
                  roleAuthMetaBase,
                ),
              );
            }
            if (pageErrors.length > 0) {
              assertions += 1;
              trackRouteFinding(
                pushFinding(
                  {
                    id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                    fingerprint: `confirmed_bug|ui:pageerror:${relRoute}`,
                    classification: "confirmed_bug",
                    severity: "high",
                    title: `Uncaught pageerror detected on ${relRoute}`,
                    endpointOrRoute: relRoute,
                    reproCommand: `node scripts/runners/ui-explorer.mjs --target-url ${fullPageUrl}`,
                    evidencePaths: [relJsonTracePath],
                    verifiedOutcome: `Uncaught pageerror(s): ${sanitizeText(pageErrors.join("; "))}`,
                  },
                  "pageerror",
                  relRoute,
                  roleAuthMetaBase,
                ),
              );
            }
            if (consoleErrors.length > 0) {
              assertions += 1;
              trackRouteFinding(
                pushFinding(
                  {
                    id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                    fingerprint: `confirmed_bug|ui:console_error:${relRoute}`,
                    classification: "confirmed_bug",
                    severity: "medium",
                    title: `Browser console.error detected on ${relRoute}`,
                    endpointOrRoute: relRoute,
                    reproCommand: `node scripts/runners/ui-explorer.mjs --target-url ${fullPageUrl}`,
                    evidencePaths: [relJsonTracePath],
                    verifiedOutcome: `Console error(s): ${sanitizeText(consoleErrors.join("; "))}`,
                  },
                  "console_error",
                  relRoute,
                  roleAuthMetaBase,
                ),
              );
            }
            for (const se of serverErrors) {
              assertions += 1;
              let subPath = "/";
              try {
                const parsedSub = new URL(se.url);
                subPath = `${parsedSub.pathname}${parsedSub.search}`;
              } catch {
                subPath = "/";
              }
              trackRouteFinding(
                pushFinding(
                  {
                    id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                    fingerprint: `confirmed_bug|ui:subres5xx:${se.url}`,
                    classification: "confirmed_bug",
                    severity: "high",
                    title: `UI sub-resource ${se.method} returned HTTP ${se.status}`,
                    endpointOrRoute: `${se.method} ${subPath}`,
                    checkMode: "status_gte_500",
                    reproCommand: `curl -i ${se.url}`,
                    evidencePaths: [relJsonTracePath],
                    verifiedOutcome: `During UI load of ${relRoute}, ${se.method} ${se.url} returned HTTP ${se.status}`,
                  },
                  "server_5xx",
                  relRoute,
                  {
                    ...roleAuthMetaBase,
                    subResourceMethod: se.method,
                    subResourcePath: subPath,
                  },
                ),
              );
            }
          }

          const routeHasFinding = Boolean(
            navError || navStatus >= 500 || pageErrors.length > 0 || consoleErrors.length > 0 || serverErrors.length > 0,
          );
          if (screenshots.length === 0 || routeHasFinding) {
            const shotDir = routeHasFinding ? evidenceDir : screenshotDir;
            const shotPath = path.join(shotDir, `ui-${uniqueTag}-${slugify(roleName, 12)}-${slugify(relRoute, 20)}.png`);
            try {
              await page.screenshot({ path: shotPath, fullPage: false, timeout: 3000 });
              const relShot = toStagingRelPath(shotPath);
              screenshots.push(relShot);
              if (routeHasFinding) {
                for (const f of routeFindings) {
                  if (!f.evidencePaths.includes(relShot)) {
                    f.evidencePaths.push(relShot);
                  }
                }
                for (const f of findings) {
                  if (f.endpointOrRoute === relRoute && !f.evidencePaths.includes(relShot)) {
                    f.evidencePaths.push(relShot);
                  }
                }
              }
            } catch {
              // ignore screenshot error
            }
          }

          for (const href of domInfo.links) {
            if (href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("#")) continue;
            try {
              const resolved = new URL(href, entryOrigin);
              if (resolved.origin === entryOrigin) {
                if (/\/(logout|sign-out|signout|log-out)(?:\/|\?|$)/i.test(resolved.pathname)) {
                  continue;
                }
                const candidateRoute = `${resolved.pathname || "/"}${resolved.search || ""}`;
                if (!visitedInContext.has(candidateRoute) && !queue.includes(candidateRoute)) {
                  queue.push(candidateRoute);
                }
              }
            } catch {
              // ignore invalid href
            }
          }

          pageReports.push({
            role: roleName,
            tenantId,
            route: relRoute,
            status: navStatus,
            title: domInfo.title,
            textLen: domInfo.textLen,
            hasMain: domInfo.hasMain,
            formCheckSummary,
            pageErrors,
            consoleErrors,
            ignoredConsoleAuth,
            serverErrors,
            expectedAuthStatuses,
          });

          page.off("pageerror", onPageError);
          page.off("console", onConsole);
          page.off("response", onResponse);
        }
      } finally {
        await page.close().catch(() => {});
        if (tracingActive) {
          try {
            await context.tracing.stop({ path: pwZipPath });
            traceArtifacts.push(toStagingRelPath(pwZipPath));
          } catch {
            // ignore trace save failure
          }
        }
        await context.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }

  let status = "passed";
  if (!targetReachable) {
    status = "degraded";
  } else if (findings.some((f) => f.classification === "confirmed_bug")) {
    status = "failed";
  } else if (findings.some((f) => f.classification === "runtime_degraded")) {
    status = "degraded";
  }

  const output = buildOutput({
    status,
    startedAt,
    startedMs,
    requests: requestsConsumed,
    routes: routesVisited,
    endpoints: endpointsObserved,
    roles: rolesVisited,
    assertions,
    findings,
    traces: traceArtifacts,
    screenshots,
    regressionTests,
    notes: `Explored ${uniqueStrings(routesVisited).length} route(s) across ${uniqueStrings(rolesVisited).length} role(s) via Playwright (${launchRes.channelUsed}); findings=${findings.length}, errorsCaptured=${findings.filter((f) => f.classification === "confirmed_bug").length}.`,
  });

  writeJsonAtomic(jsonTracePath, {
    ...output,
    channelUsed: launchRes.channelUsed,
    targetUrl,
    pageReports,
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
