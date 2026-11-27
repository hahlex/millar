#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ensureDir,
  isApiLikeUrl,
  isStaticAssetUrl,
  loadConfigFile,
  loadPlaywright,
  MEMORY_DIR,
  normalizeSafeOrigin,
  parseCliArgs,
  parseNonNegativeNumber,
  readJsonSafe,
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
  const allowedOriginsList = uniqueStrings(authMeta.allowedHeaderOrigins || [normalizeSafeOrigin(defaultTargetUrl)].filter(Boolean));
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
  const expected4xxStatus = Number(authMeta.expected4xxStatus || 0);

  return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

function loadPw() {
  const candidates = [
    ${JSON.stringify(pkgJsonPath)},
    process.env.AUTONOMOUS_QA_NODE_MODULES ? path.join(process.env.AUTONOMOUS_QA_NODE_MODULES, "playwright", "index.js") : "",
    path.join(os.homedir(), ".gemini", "config", "skills", "millar-autonomous-qa", "node_modules", "playwright", "index.js"),
  ].filter(Boolean);
  for (const cand of candidates) {
    try {
      const req = createRequire(cand);
      return req(cand.endsWith("package.json") ? "playwright" : cand);
    } catch {
      // try next candidate
    }
  }
  throw new Error("Playwright not found for UI reproducer");
}
const { chromium } = loadPw();

const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}

const baseUrl = getFlag("--target-url", getFlag("--api-url", ${JSON.stringify(defaultTargetUrl)}));
const apiUrlFlag = getFlag("--api-url", "");
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
const expected4xxStatus = ${JSON.stringify(expected4xxStatus)};

const allowedOrigins = new Set(${JSON.stringify(allowedOriginsList)});
try { allowedOrigins.add(new URL(baseUrl).origin); } catch {}
if (apiUrlFlag) { try { allowedOrigins.add(new URL(apiUrlFlag).origin); } catch {} }

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
  if (hasStorageState) {
    contextOpts.storageState = resolvedStorageState;
  }
  const context = await browser.newContext(contextOpts);
  // Origin-scoped header injection: never leak auth or tenant headers to third-party origins
  if (hasExtraHeaders) {
    await context.route("**/*", async (route) => {
      try {
        const reqOrigin = new URL(route.request().url()).origin;
        if (allowedOrigins.has(reqOrigin)) {
          const merged = { ...route.request().headers() };
          const existingLower = new Set(Object.keys(merged).map((k) => k.toLowerCase()));
          for (const [hk, hv] of Object.entries(extraHeaders)) {
            if (!existingLower.has(hk.toLowerCase())) merged[hk] = hv;
          }
          await route.continue({ headers: merged });
          return;
        }
      } catch {
        // ignore URL parse error
      }
      await route.continue();
    });
  }
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const serverErrors = [];
  const api4xxErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err instanceof Error ? err.message : String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("response", (res) => {
    const st = res.status();
    if (st >= 500) {
      serverErrors.push(st + " " + res.url());
    } else if (st >= 400 && st < 500) {
      try {
        const u = new URL(res.url());
        if (allowedOrigins.has(u.origin) && /^\\/(?:api|v\\d+)\\//i.test(u.pathname)) {
          api4xxErrors.push({ status: st, method: res.request().method(), pathname: u.pathname, url: res.url() });
        }
      } catch {
        // ignore
      }
    }
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
  await page.waitForTimeout(450);

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
        hdrs.Authorization = authToken.startsWith("Bearer ") ? authToken : "Bearer " + authToken;
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
  else if (checkType === "api_4xx") {
    reproduced = api4xxErrors.some(
      (e) =>
        (!subResourcePath || e.pathname.includes(subResourcePath.split("?")[0])) &&
        (!expected4xxStatus || e.status === expected4xxStatus),
    );
  } else if (checkType === "blank_screen") {
    const len = await page.evaluate(() => (document.body?.innerText || "").trim().length).catch(() => 0);
    reproduced = len < 20;
  } else {
    reproduced = pageErrors.length > 0 || consoleErrors.length > 0 || serverErrors.length > 0;
  }

  if (reproduced) {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, JSON.stringify({ pageErrors, consoleErrors, serverErrors, api4xxErrors }));
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
  const { chromium } = await loadPlaywright();
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

function isRouteExploratoryCandidate(routePath, roleName) {
  if (typeof routePath !== "string" || !routePath.startsWith("/")) return false;
  if (routePath.includes(":") || routePath.includes("{") || routePath.includes("*")) return false;
  if (/^\/(?:logout|sign-out|signout|log-out)(?:\/|\?|$)/i.test(routePath)) return false;
  if (roleName !== "guest" && /^\/(?:login|signin|sign-in|register|forgot-password|reset-password|auth\/callback)(?:\/|\?|$)/i.test(routePath)) {
    return false;
  }
  return true;
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

function isExpectedApiStatus(roleCfg, pathname, status) {
  const allowList = Array.isArray(roleCfg?.expectedApiStatuses) ? roleCfg.expectedApiStatuses : [];
  for (const rule of allowList) {
    if (!rule || typeof rule !== "object") continue;
    const statusMatch = rule.status === undefined || Number(rule.status) === status;
    const pathMatch = !rule.path || pathname.includes(String(rule.path));
    if (statusMatch && pathMatch) return true;
  }
  return false;
}

function extractErrorSnippet(rawText) {
  const cleaned = sanitizeText(String(rawText || "").trim());
  if (!cleaned) return { code: "", detail: "" };
  try {
    const obj = JSON.parse(cleaned);
    const code = String(obj?.code || obj?.error?.code || obj?.error_code || "").slice(0, 64);
    const detailRaw = obj?.detail || obj?.message || obj?.error?.message || obj?.error || "";
    const detail = sanitizeText(typeof detailRaw === "string" ? detailRaw : JSON.stringify(detailRaw)).slice(0, 220);
    return { code, detail };
  } catch {
    return { code: "", detail: cleaned.slice(0, 220) };
  }
}

function compactJsonSample(rawText, maxChars = 1800) {
  if (!rawText || typeof rawText !== "string") return null;
  const trimmed = rawText.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(0, Math.max(maxChars * 4, 8192)));
    const shrink = (val, depth = 0) => {
      if (depth > 3) return typeof val;
      if (Array.isArray(val)) return val.slice(0, 3).map((item) => shrink(item, depth + 1));
      if (val && typeof val === "object") {
        const out = {};
        let kCount = 0;
        for (const [k, v] of Object.entries(val)) {
          if (kCount >= 24) break;
          out[k] = shrink(v, depth + 1);
          kCount += 1;
        }
        return out;
      }
      if (typeof val === "string") return sanitizeText(val).slice(0, 160);
      return val;
    };
    return sanitizeForOutput(shrink(parsed, 0));
  } catch {
    return null;
  }
}

async function main() {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();

  const { values } = parseCliArgs(process.argv.slice(2), {
    booleanFlags: ["dry-run", "allow-private-ip", "interactive", "no-interactive", "check-occlusion", "help"],
    multiFlags: ["repo-path"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/runners/ui-explorer.mjs [--config <path>] --target-url <url> [--api-url <url>] [--storage-state <path>] [--exclude-routes-file <json>] [--discovered-routes-file <json>] [--max-routes-per-role N] [--interactive] [--memory-dir <dir>] [--trace-dir <dir>] [--out <file>] [--max-requests N] [--dry-run]",
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
  const maxRoutesPerRoleOverride = values["max-routes-per-role"]
    ? parseNonNegativeNumber(values["max-routes-per-role"], 6, "--max-routes-per-role")
    : cfg.maxRoutesPerRole
      ? parseNonNegativeNumber(cfg.maxRoutesPerRole, 6, "maxRoutesPerRole")
      : null;
  const enableInteractive = values["no-interactive"]
    ? false
    : Boolean(values.interactive || cfg.interactiveTabs !== false);
  const dryRun = Boolean(values["dry-run"]);

  // Optional frontier inputs from run-qa-loop.mjs for Iteration 2+ expansion
  let excludeRoutesByRole = {};
  let globalExcludeRoutes = new Set();
  if (values["exclude-routes-file"]) {
    const exRes = readJsonSafe(path.resolve(values["exclude-routes-file"]));
    if (Array.isArray(exRes.data)) {
      globalExcludeRoutes = new Set(exRes.data.filter((r) => typeof r === "string"));
    } else if (exRes.data && typeof exRes.data === "object") {
      excludeRoutesByRole = exRes.data;
    }
  }
  let discoveredFrontierRoutes = [];
  if (values["discovered-routes-file"]) {
    const discRes = readJsonSafe(path.resolve(values["discovered-routes-file"]));
    if (Array.isArray(discRes.data)) {
      discoveredFrontierRoutes = uniqueStrings(discRes.data);
    } else if (Array.isArray(discRes.data?.routes)) {
      discoveredFrontierRoutes = uniqueStrings(discRes.data.routes);
    }
  }

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
  const observedApiRecords = [];
  const observedApiKeySet = new Set();
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
  const roleCap = Math.min(rawConfiguredRoles.length, Math.max(1, Math.floor(maxRequests / 3)));
  const configuredRoles = rawConfiguredRoles.slice(0, roleCap);

  const parsedEntry = new URL(targetUrl);
  const entryOrigin = parsedEntry.origin;
  const apiOrigin = normalizeSafeOrigin(apiUrl);
  const entryRouteWithSearch = `${parsedEntry.pathname || "/"}${parsedEntry.search || ""}`;
  const allowedHeaderOrigins = new Set(
    [
      entryOrigin,
      apiOrigin,
      ...(Array.isArray(cfg.headerAllowedOrigins) ? cfg.headerAllowedOrigins.map(normalizeSafeOrigin) : []),
    ].filter(Boolean),
  );
  const allowedHeaderOriginsList = Array.from(allowedHeaderOrigins);
  const softDeadlineMs =
    startedMs + (configuredRoles.length >= 5 ? 68000 : configuredRoles.length > 2 ? 42000 : 24000);

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
      const src = buildUiReproScript(f, entryOrigin, checkType, routePath, {
        ...authMeta,
        allowedHeaderOrigins: allowedHeaderOriginsList,
      });
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
      const campusId = roleCfg.campusId ? String(roleCfg.campusId) : "";
      rolesVisited.push(roleName);

      // Prefer explicit browserHeaders if supplied (allows empty {} when SPA handles own API headers); otherwise roleCfg.headers
      const rawHeadersObj =
        roleCfg.browserHeaders && typeof roleCfg.browserHeaders === "object" && !Array.isArray(roleCfg.browserHeaders)
          ? roleCfg.browserHeaders
          : roleCfg.headers && typeof roleCfg.headers === "object" && !Array.isArray(roleCfg.headers)
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

      // P0 Security + Zero-FP Fix: NEVER set global contextOpts.extraHTTPHeaders.
      // Attach origin-scoped route interception so auth/tenant headers NEVER leak to external CDNs/fonts.
      const contextOpts = { viewport: { width: 1280, height: 720 } };
      const rawRoleStorageState = roleCfg.storageState ? String(roleCfg.storageState) : "";
      const resolvedRoleStorageState = rawRoleStorageState
        ? resolvePathCandidates(rawRoleStorageState, [configDir, process.cwd(), STAGING_ROOT])
        : "";
      const effectiveStorageState = cliStorageState || resolvedRoleStorageState;
      if (effectiveStorageState && fs.existsSync(effectiveStorageState)) {
        contextOpts.storageState = effectiveStorageState;
      }

      const context = await browser.newContext(contextOpts);
      if (Object.keys(contextHeaders).length > 0) {
        await context.route("**/*", async (route) => {
          try {
            const reqUrl = route.request().url();
            const reqOrigin = new URL(reqUrl).origin;
            if (allowedHeaderOrigins.has(reqOrigin) && !isStaticAssetUrl(reqUrl)) {
              const merged = { ...route.request().headers() };
              const existingLower = new Set(Object.keys(merged).map((k) => k.toLowerCase()));
              for (const [hk, hv] of Object.entries(contextHeaders)) {
                if (!existingLower.has(hk.toLowerCase())) {
                  merged[hk] = hv;
                }
              }
              await route.continue({ headers: merged });
              return;
            }
          } catch {
            // fall through to unmodified request
          }
          await route.continue();
        });
      }

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
      const roleExcludeSet = new Set([
        ...globalExcludeRoutes,
        ...(Array.isArray(excludeRoutesByRole[roleName]) ? excludeRoutesByRole[roleName] : []),
      ]);
      const seedRoutes = Array.isArray(roleCfg.routes)
        ? roleCfg.routes.filter((r) => isRouteExploratoryCandidate(r, roleName))
        : [];
      const frontierCandidates = discoveredFrontierRoutes.filter((r) => isRouteExploratoryCandidate(r, roleName));
      // Prioritize UNVISITED routes across iterations (frontier expansion!)
      const allCandidateRoutes = uniqueStrings([...seedRoutes, ...frontierCandidates, entryRouteWithSearch]);
      const unvisitedPriority = allCandidateRoutes.filter((r) => !roleExcludeSet.has(r));
      const fallbackVisited = allCandidateRoutes.filter((r) => roleExcludeSet.has(r));
      const queue = unvisitedPriority.length > 0 ? [...unvisitedPriority, ...fallbackVisited] : [...fallbackVisited];

      try {
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
        const defaultPerRoleCap = configuredRoles.length >= 5 ? 5 : 7;
        const perRoleCap = maxRoutesPerRoleOverride ?? defaultPerRoleCap;
        const maxRoutesForRole = Math.max(
          1,
          Math.min(perRoleCap, Math.floor((maxRequests - requestsConsumed) / remainingRoles)),
        );
        let routesExploredInRole = 0;

        while (
          queue.length > 0 &&
          routesExploredInRole < maxRoutesForRole &&
          requestsConsumed < maxRequests &&
          Date.now() < softDeadlineMs
        ) {
          const relRoute = queue.shift();
          if (!relRoute || visitedInContext.has(relRoute)) continue;
          visitedInContext.add(relRoute);

          const fullPageUrl = new URL(relRoute, entryOrigin).toString();
          const pageErrors = [];
          const consoleErrors = [];
          const reactLifecycleWarnings = [];
          const ignoredConsoleAuth = [];
          const serverErrors = [];
          const api4xxErrors = [];
          const expectedAuthStatuses = [];
          const pendingResponseReads = [];

          const onPageError = (err) => {
            pageErrors.push(err instanceof Error ? err.message : String(err));
          };
          const onConsole = (msg) => {
            const mType = msg.type();
            const txt = msg.text();
            if (/flushSync was called from inside a lifecycle method|Hydration failed|Minified React error/i.test(txt)) {
              reactLifecycleWarnings.push(txt);
            }
            if (mType === "error") {
              if (isExpectedGuestAuthNoise(txt, roleName)) {
                ignoredConsoleAuth.push(txt);
              } else {
                consoleErrors.push(txt);
              }
            }
          };
          const onResponse = (res) => {
            const st = res.status();
            const req = res.request();
            const method = req.method().toUpperCase();
            const resUrl = res.url();
            let u = null;
            try {
              u = new URL(resUrl);
            } catch {
              u = null;
            }
            const isTargetApi = Boolean(u && allowedHeaderOrigins.has(u.origin) && isApiLikeUrl(resUrl));
            if (isTargetApi) {
              endpointsObserved.push(`${method} ${u.pathname}`);
            }

            if (st >= 500) {
              serverErrors.push({ status: st, url: resUrl, method });
            } else if ((st === 401 || st === 403) && roleName === "guest") {
              expectedAuthStatuses.push({ status: st, url: resUrl });
            } else if (st >= 400 && st < 500 && isTargetApi && !isExpectedApiStatus(roleCfg, u.pathname, st)) {
              const p = res
                .text()
                .then((bodyText) => {
                  const { code, detail } = extractErrorSnippet(bodyText);
                  api4xxErrors.push({
                    status: st,
                    method,
                    url: resUrl,
                    pathname: u.pathname,
                    search: u.search || "",
                    code,
                    detail,
                  });
                })
                .catch(() => {
                  api4xxErrors.push({
                    status: st,
                    method,
                    url: resUrl,
                    pathname: u.pathname,
                    search: u.search || "",
                    code: "",
                    detail: "",
                  });
                });
              pendingResponseReads.push(p);
            }

            // Record API traffic observation for HAR-to-OpenAPI synthesis & 4-axis Auth Matrix
            if (isTargetApi && observedApiRecords.length < 180) {
              const obsKey = `${roleName}|${method}|${u.pathname}|${st}`;
              if (!observedApiKeySet.has(obsKey)) {
                observedApiKeySet.add(obsKey);
                const queryKeys = Array.from(u.searchParams.keys()).slice(0, 12);
                const reqPostData = req.postData();
                const reqSample = reqPostData ? compactJsonSample(reqPostData, 600) : null;
                const pObs = res
                  .text()
                  .then((txt) => {
                    observedApiRecords.push(
                      sanitizeForOutput({
                        role: roleName,
                        tenantId,
                        campusId,
                        route: relRoute,
                        method,
                        origin: u.origin,
                        pathname: u.pathname,
                        search: u.search || "",
                        queryKeys,
                        status: st,
                        requestSample: reqSample,
                        responseSample: st < 500 ? compactJsonSample(txt, 1400) : null,
                      }),
                    );
                  })
                  .catch(() => {});
                pendingResponseReads.push(pObs);
              }
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
              .waitForFunction(() => (document.body?.innerText || "").trim().length > 60, null, { timeout: 1400 })
              .catch(() => {});
            await page.waitForTimeout(300);
          } catch (err) {
            navError = err instanceof Error ? err.message : String(err);
          }

          let domInfo = await page
            .evaluate(() => {
              const title = document.title || "";
              const bodyText = (document.body?.innerText || "").trim();
              const textLen = bodyText.length;
              const hasMain = Boolean(document.querySelector("main, h1, [role='main']"));
              const hasSpinner = Boolean(document.querySelector("[role='progressbar'], .ant-spin-spinning, .animate-spin"));
              const links = Array.from(document.querySelectorAll("a[href]"))
                .map((a) => a.getAttribute("href") || "")
                .filter(Boolean);
              const formCount = document.querySelectorAll("form").length;
              const hasEmDash = bodyText.includes("\u2014");
              const rawKeyMatches = (bodyText.match(/\b[a-z]{2,14}\.[a-z0-9_]{2,20}\.[a-z0-9_]{2,24}\b/g) || [])
                .filter((tok) => !/\.(?:com|org|net|io|vn|local|dev|edu|js|ts|css|png|svg|pdf|json|html)$/i.test(tok))
                .slice(0, 5);
              return { title, textLen, hasMain, hasSpinner, links, formCount, hasEmDash, rawKeyMatches };
            })
            .catch(() => ({
              title: "",
              textLen: 0,
              hasMain: false,
              hasSpinner: false,
              links: [],
              formCount: 0,
              hasEmDash: false,
              rawKeyMatches: [],
            }));

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
                  const bodyText = (document.body?.innerText || "").trim();
                  const textLen = bodyText.length;
                  const hasMain = Boolean(document.querySelector("main, h1, [role='main']"));
                  const hasSpinner = Boolean(
                    document.querySelector("[role='progressbar'], .ant-spin-spinning, .animate-spin"),
                  );
                  const links = Array.from(document.querySelectorAll("a[href]"))
                    .map((a) => a.getAttribute("href") || "")
                    .filter(Boolean);
                  const formCount = document.querySelectorAll("form").length;
                  const hasEmDash = bodyText.includes("\u2014");
                  const rawKeyMatches = (bodyText.match(/\b[a-z]{2,14}\.[a-z0-9_]{2,20}\.[a-z0-9_]{2,24}\b/g) || [])
                    .filter((tok) => !/\.(?:com|org|net|io|vn|local|dev|edu|js|ts|css|png|svg|pdf|json|html)$/i.test(tok))
                    .slice(0, 5);
                  return { title, textLen, hasMain, hasSpinner, links, formCount, hasEmDash, rawKeyMatches };
                })
                .catch(() => domInfo);
            }
          }

          // Phase 2: Lightweight ARIA accessibility snapshot summary + safe read-only tab probing
          let ariaSummary = null;
          let tabsClicked = [];
          if (!navError && Date.now() < softDeadlineMs - 2000) {
            try {
              const snap = await page.locator("body").ariaSnapshot({ timeout: 1200 });
              const lines = String(snap || "").split(/\r?\n/);
              ariaSummary = {
                lineCount: lines.length,
                headings: lines.filter((l) => /\bheading\b/.test(l)).length,
                buttons: lines.filter((l) => /\bbutton\b/.test(l)).length,
                tabs: lines.filter((l) => /\btab\b/.test(l)).length,
                links: lines.filter((l) => /\blink\b/.test(l)).length,
              };
              assertions += 1;
            } catch {
              ariaSummary = null;
            }

            if (enableInteractive && Date.now() < softDeadlineMs - 2200) {
              try {
                const tabLoc = page.locator("[role='tab']:visible");
                const tabCount = Math.min(await tabLoc.count(), 4);
                const unsafeTabRe = /delete|remove|logout|sign ?out|submit|pay|cancel|archive|revoke|reset|xóa|đăng xuất|thanh toán/i;
                let clicked = 0;
                for (let ti = 0; ti < tabCount && clicked < 2; ti += 1) {
                  const tab = tabLoc.nth(ti);
                  const selected = await tab.getAttribute("aria-selected").catch(() => null);
                  const txt = (await tab.innerText().catch(() => "")).trim();
                  if (selected === "true" || !txt || unsafeTabRe.test(txt)) continue;
                  await tab.click({ timeout: 1500 }).catch(() => {});
                  await page.waitForTimeout(380);
                  tabsClicked.push(txt.slice(0, 40));
                  clicked += 1;
                  assertions += 1;
                }
              } catch {
                // ignore tab probe error
              }
            }
          }

          // Phase 2: UI Occlusion check on visible primary action buttons
          let occludedButtons = [];
          if (!navError && Date.now() < softDeadlineMs - 1500) {
            occludedButtons = await page
              .evaluate(() => {
                const results = [];
                const buttons = Array.from(
                  document.querySelectorAll("button[type='submit'], .ant-btn-primary, button[data-primary='true']"),
                ).slice(0, 8);
                for (const btn of buttons) {
                  const rect = btn.getBoundingClientRect();
                  if (rect.width < 20 || rect.height < 16) continue;
                  if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
                    continue;
                  }
                  const pts = [
                    [rect.left + rect.width * 0.5, rect.top + rect.height * 0.5],
                    [rect.left + rect.width * 0.25, rect.top + rect.height * 0.5],
                    [rect.left + rect.width * 0.75, rect.top + rect.height * 0.5],
                    [rect.left + rect.width * 0.5, rect.top + rect.height * 0.25],
                  ];
                  let blockedPts = 0;
                  let blockerDesc = "";
                  for (const [px, py] of pts) {
                    const stack = document.elementsFromPoint(px, py);
                    const topEl = stack[0];
                    if (!topEl || btn === topEl || btn.contains(topEl) || topEl.contains(btn)) continue;
                    const cs = window.getComputedStyle(topEl);
                    const pos = cs.position;
                    if (pos === "fixed" || pos === "sticky" || Number(cs.zIndex || 0) >= 50) {
                      blockedPts += 1;
                      if (!blockerDesc) {
                        blockerDesc = `${topEl.tagName.toLowerCase()}${topEl.id ? "#" + topEl.id : ""}${typeof topEl.className === "string" && topEl.className.trim() ? "." + topEl.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`;
                      }
                    }
                  }
                  if (blockedPts >= 2) {
                    results.push({
                      label: (btn.innerText || btn.getAttribute("aria-label") || "primary-button").trim().slice(0, 50),
                      blocker: blockerDesc || "fixed-overlay",
                      blockedRatio: blockedPts / pts.length,
                    });
                  }
                }
                return results;
              })
              .catch(() => []);
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

          // Wait briefly for pending response body reads (structured api_4xx + HAR observations)
          if (pendingResponseReads.length > 0) {
            await Promise.race([
              Promise.allSettled(pendingResponseReads),
              new Promise((resolve) => setTimeout(resolve, 1200)),
            ]);
          }

          // Deduplicate redundant generic console errors ("Failed to load resource: status of 404/403")
          // when we already captured the structured API 4xx finding with exact URL & error code.
          const captured4xxStatuses = new Set(api4xxErrors.map((e) => e.status));
          const filteredConsoleErrors = consoleErrors.filter((txt) => {
            const m = String(txt || "").match(/Failed to load resource:.*status of (\d{3})/i);
            if (m && captured4xxStatuses.has(Number.parseInt(m[1], 10))) {
              return false;
            }
            return true;
          });

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
            for (const apiErr of api4xxErrors) {
              assertions += 1;
              const codeSuffix = apiErr.code ? ` [${apiErr.code}]` : "";
              const detailSuffix = apiErr.detail ? `: ${apiErr.detail}` : "";
              trackRouteFinding(
                pushFinding(
                  {
                    id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                    fingerprint: `confirmed_bug|ui:api4xx:${roleName}:${apiErr.method} ${apiErr.pathname}:${apiErr.status}`,
                    classification: "confirmed_bug",
                    severity: apiErr.status === 403 || apiErr.status === 404 || apiErr.status === 422 ? "high" : "medium",
                    title: `Authenticated UI API call returned HTTP ${apiErr.status} on ${apiErr.method} ${apiErr.pathname} (role=${roleName}, route=${relRoute})`,
                    endpointOrRoute: `${apiErr.method} ${apiErr.pathname}`,
                    checkMode: "api_4xx",
                    reproCommand: `node scripts/runners/ui-explorer.mjs --target-url ${fullPageUrl}`,
                    evidencePaths: [relJsonTracePath],
                    verifiedOutcome: sanitizeText(
                      `During UI load of ${relRoute} as role=${roleName}, ${apiErr.method} ${apiErr.pathname}${apiErr.search} returned HTTP ${apiErr.status}${codeSuffix}${detailSuffix}`,
                    ),
                  },
                  "api_4xx",
                  relRoute,
                  {
                    ...roleAuthMetaBase,
                    subResourceMethod: apiErr.method,
                    subResourcePath: `${apiErr.pathname}${apiErr.search}`,
                    expected4xxStatus: apiErr.status,
                  },
                ),
              );
            }
            if (filteredConsoleErrors.length > 0) {
              assertions += 1;
              trackRouteFinding(
                pushFinding(
                  {
                    id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                    fingerprint: `confirmed_bug|ui:console_error:${roleName}:${relRoute}`,
                    classification: "confirmed_bug",
                    severity: "medium",
                    title: `Browser console.error detected on ${relRoute} (role=${roleName})`,
                    endpointOrRoute: relRoute,
                    reproCommand: `node scripts/runners/ui-explorer.mjs --target-url ${fullPageUrl}`,
                    evidencePaths: [relJsonTracePath],
                    verifiedOutcome: `Console error(s): ${sanitizeText(filteredConsoleErrors.join("; "))}`,
                  },
                  "console_error",
                  relRoute,
                  roleAuthMetaBase,
                ),
              );
            }
            if (reactLifecycleWarnings.length > 0) {
              assertions += 1;
              trackRouteFinding(
                pushFinding(
                  {
                    id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                    fingerprint: `confirmed_bug|ui:react_lifecycle:${relRoute}`,
                    classification: "confirmed_bug",
                    severity: "medium",
                    title: `React lifecycle or hydration error detected on ${relRoute}`,
                    endpointOrRoute: relRoute,
                    checkMode: "console_error",
                    reproCommand: `node scripts/runners/ui-explorer.mjs --target-url ${fullPageUrl}`,
                    evidencePaths: [relJsonTracePath],
                    verifiedOutcome: sanitizeText(reactLifecycleWarnings.slice(0, 2).join("; ")),
                  },
                  "console_error",
                  relRoute,
                  roleAuthMetaBase,
                ),
              );
            }
            if (roleName !== "guest" && navStatus === 200 && domInfo.textLen < 20 && !domInfo.hasSpinner) {
              assertions += 1;
              trackRouteFinding(
                pushFinding(
                  {
                    id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                    fingerprint: `confirmed_bug|ui:blank_screen:${roleName}:${relRoute}`,
                    classification: "confirmed_bug",
                    severity: "high",
                    title: `Blank or empty screen rendered on ${relRoute} (role=${roleName})`,
                    endpointOrRoute: relRoute,
                    checkMode: "blank_screen",
                    reproCommand: `node scripts/runners/ui-explorer.mjs --target-url ${fullPageUrl}`,
                    evidencePaths: [relJsonTracePath],
                    verifiedOutcome: `HTTP 200 on ${relRoute} as role=${roleName} rendered only ${domInfo.textLen} visible character(s) with no active loading indicator`,
                  },
                  "blank_screen",
                  relRoute,
                  roleAuthMetaBase,
                ),
              );
            }
            for (const occ of occludedButtons) {
              assertions += 1;
              trackRouteFinding(
                pushFinding(
                  {
                    id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                    fingerprint: `confirmed_bug|ui:occlusion:${relRoute}:${occ.label}`,
                    classification: "confirmed_bug",
                    severity: "medium",
                    title: `Primary button "${occ.label}" occluded by overlay "${occ.blocker}" on ${relRoute}`,
                    endpointOrRoute: relRoute,
                    checkMode: "ui_occlusion",
                    reproCommand: `node scripts/runners/ui-explorer.mjs --target-url ${fullPageUrl}`,
                    evidencePaths: [relJsonTracePath],
                    verifiedOutcome: `Button "${occ.label}" on ${relRoute} had ${Math.round(occ.blockedRatio * 100)}% of sampled hit points covered by ${occ.blocker}`,
                  },
                  "ui_occlusion",
                  relRoute,
                  roleAuthMetaBase,
                ),
              );
            }
            if (cfg.forbidEmDash && domInfo.hasEmDash) {
              assertions += 1;
              trackRouteFinding(
                pushFinding(
                  {
                    id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                    fingerprint: `spec_gap|ui:em_dash:${relRoute}`,
                    classification: "spec_gap",
                    severity: "low",
                    title: `Rendered UI copy contains forbidden U+2014 em-dash on ${relRoute}`,
                    endpointOrRoute: relRoute,
                    reproCommand: `node scripts/runners/ui-explorer.mjs --target-url ${fullPageUrl}`,
                    evidencePaths: [relJsonTracePath],
                    verifiedOutcome: `Visible DOM text on ${relRoute} contains U+2014 em-dash character(s)`,
                  },
                  "console_error",
                  relRoute,
                  roleAuthMetaBase,
                ),
              );
            }
            if (Array.isArray(domInfo.rawKeyMatches) && domInfo.rawKeyMatches.length > 0) {
              assertions += 1;
              trackRouteFinding(
                pushFinding(
                  {
                    id: `QA-UI-${String(findings.length + 1).padStart(3, "0")}`,
                    fingerprint: `spec_gap|ui:untranslated_i18n:${relRoute}`,
                    classification: "spec_gap",
                    severity: "low",
                    title: `Possible untranslated i18n key(s) visible on ${relRoute}`,
                    endpointOrRoute: relRoute,
                    reproCommand: `node scripts/runners/ui-explorer.mjs --target-url ${fullPageUrl}`,
                    evidencePaths: [relJsonTracePath],
                    verifiedOutcome: `Visible DOM text contained dot-delimited key-like token(s): ${domInfo.rawKeyMatches.join(", ")}`,
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
            routeFindings.length > 0 ||
              navError ||
              navStatus >= 500 ||
              pageErrors.length > 0 ||
              filteredConsoleErrors.length > 0 ||
              api4xxErrors.length > 0 ||
              serverErrors.length > 0,
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
                const candidateRoute = `${resolved.pathname || "/"}${resolved.search || ""}`;
                if (!isRouteExploratoryCandidate(candidateRoute, roleName)) continue;
                if (!visitedInContext.has(candidateRoute) && !queue.includes(candidateRoute)) {
                  if (!roleExcludeSet.has(candidateRoute)) {
                    queue.unshift(candidateRoute);
                  } else {
                    queue.push(candidateRoute);
                  }
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
            ariaSummary,
            tabsClicked,
            occludedButtons,
            formCheckSummary,
            pageErrors,
            consoleErrors: filteredConsoleErrors,
            api4xxErrors,
            reactLifecycleWarnings,
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

  // Persist merged redacted API traffic observations for HAR-to-OpenAPI synthesis & 4-axis Auth Matrix
  if (observedApiRecords.length > 0) {
    const obsPath = path.join(traceDir, "observed-api-traffic.json");
    const prevObs = readJsonSafe(obsPath);
    const prevRecords = Array.isArray(prevObs.data?.records) ? prevObs.data.records : [];
    const mergedMap = new Map();
    for (const rec of [...prevRecords, ...observedApiRecords]) {
      const k = `${rec.role}|${rec.method}|${rec.pathname}|${rec.status}`;
      mergedMap.set(k, rec);
    }
    writeJsonAtomic(obsPath, {
      updatedAt: new Date().toISOString(),
      apiOrigin: apiOrigin || entryOrigin,
      records: Array.from(mergedMap.values()).slice(-300),
    });
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
    notes: `Explored ${uniqueStrings(routesVisited).length} route(s) across ${uniqueStrings(rolesVisited).length} role(s) via Playwright (${launchRes.channelUsed}); findings=${findings.length}, confirmedBugs=${findings.filter((f) => f.classification === "confirmed_bug").length}, observedApiCalls=${observedApiRecords.length}.`,
  });

  writeJsonAtomic(jsonTracePath, {
    ...output,
    channelUsed: launchRes.channelUsed,
    targetUrl,
    allowedHeaderOrigins: allowedHeaderOriginsList,
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
