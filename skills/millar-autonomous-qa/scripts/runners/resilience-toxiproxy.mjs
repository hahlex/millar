#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import http from "node:http";
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
  STAGING_ROOT,
  TEST_RESULTS_DIR,
  toStagingRelPath,
  uniqueStrings,
  writeJsonAtomic,
} from "../lib/common.mjs";
import { evaluateSafetyAndBudget } from "../safety-guard.mjs";

function makeUniqueTag() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = crypto.randomBytes(3).toString("hex");
  return `${ts}-${process.pid}-${rand}`;
}

function buildOutput(fields) {
  return sanitizeForOutput({
    tool: "toxiproxy",
    mode: "resilience",
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

function sendProxiedHttpGet({ proxyPort, originalHost, reqPath, timeoutMs = 2500 }) {
  const started = Date.now();
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: proxyPort,
        path: reqPath || "/",
        method: "GET",
        headers: {
          Host: originalHost,
          Connection: "close",
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 500,
            status: res.statusCode || 0,
            bodyLength: Buffer.concat(chunks).length,
            durationMs: Date.now() - started,
            error: null,
            timedOut: false,
          });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy(new Error(`Proxied request timed out after ${timeoutMs}ms`));
    });
    req.on("error", (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      resolve({
        ok: false,
        status: 0,
        bodyLength: 0,
        durationMs: Date.now() - started,
        error: msg,
        timedOut: /timed out/i.test(msg),
      });
    });
    req.end();
  });
}

function parseDockerPort(containerId, containerPortSpec) {
  const out = execFileSync("docker", ["port", containerId, containerPortSpec], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 4000,
  });
  const firstLine = out.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
  const portStr = firstLine.trim().split(":").pop();
  const portNum = Number.parseInt(portStr || "", 10);
  if (!Number.isFinite(portNum) || portNum <= 0) {
    throw new Error(`Failed to parse docker port for ${containerPortSpec}: "${out.trim()}"`);
  }
  return portNum;
}

async function waitForToxiproxyAdmin(adminBaseUrl, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${adminBaseUrl}/version`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) return await res.text();
    } catch {
      // retry until ready
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Toxiproxy admin API did not become ready at ${adminBaseUrl}`);
}

async function runBrowserFaultCheck(targetUrl, budgetMs = 11000) {
  const deadlineMs = Date.now() + budgetMs;
  const remainingMs = () => Math.max(200, deadlineMs - Date.now());
  let htmlDetected = false;
  try {
    const preRes = await fetch(targetUrl, {
      method: "GET",
      signal: AbortSignal.timeout(Math.min(1200, remainingMs())),
    });
    const ct = String(preRes.headers.get("content-type") || "").toLowerCase();
    if (preRes.status !== 200 || !ct.includes("text/html")) {
      return {
        executed: false,
        htmlDetected: false,
        skippedReason: `Target did not return 200 text/html (status=${preRes.status}, ct=${ct || "none"})`,
      };
    }
    htmlDetected = true;
  } catch (err) {
    return {
      executed: false,
      htmlDetected: false,
      skippedReason: `Pre-flight HTML check failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (Date.now() + 1000 >= deadlineMs) {
    return { executed: false, htmlDetected, skippedReason: "Browser budget exhausted during pre-flight check" };
  }

  let browser = null;
  let context = null;
  let page = null;
  let recoveryPage = null;
  try {
    const { chromium } = await import("playwright");
    const launchTimeout = Math.min(5500, remainingMs());
    const launchAttempt = (async () => {
      try {
        return await chromium.launch({ channel: "chrome", headless: true, timeout: launchTimeout });
      } catch {
        return await chromium.launch({ headless: true, timeout: launchTimeout });
      }
    })();
    browser = await Promise.race([
      launchAttempt,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Browser launch timeout")), launchTimeout)),
    ]);
  } catch (err) {
    return {
      executed: false,
      htmlDetected,
      skippedReason: `Playwright unavailable within budget: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  try {
    context = await browser.newContext();
    page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    let interceptedCount = 0;
    page.on("pageerror", (err) => pageErrors.push(err instanceof Error ? err.message : String(err)));
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const txt = msg.text();
        const locUrl = String(msg.location()?.url || "");
        if (/^Failed to load resource:/i.test(txt) && /\/favicon\.ico(?:\?.*)?$/i.test(locUrl)) {
          return;
        }
        if (/^Failed to load resource:\s*(?:the server responded with a status of 503|net::ERR_FAILED|net::ERR_ABORTED)/i.test(txt)) {
          return;
        }
        consoleErrors.push(txt);
      }
    });

    const apiRouteMatcher = (url) => /\/(api|v1)\//.test(url.pathname);
    await page.route(
      apiRouteMatcher,
      async (route) => {
        interceptedCount += 1;
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "QA simulated 503 resilience fault" }),
        });
      },
    );

    const faultNav = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: Math.min(3000, remainingMs()),
    });
    await page.waitForTimeout(Math.min(250, remainingMs()));

    await page.unroute(apiRouteMatcher);
    if (Date.now() + 500 < deadlineMs) {
      await page.route(
        apiRouteMatcher,
        async (route) => {
          interceptedCount += 1;
          await route.abort("failed");
        },
      );
      await page.reload({ waitUntil: "domcontentloaded", timeout: Math.min(2200, remainingMs()) }).catch(() => {});
      await page.waitForTimeout(Math.min(200, remainingMs()));
      await page.unroute(apiRouteMatcher);
    }

    await page.close().catch(() => {});
    page = null;

    recoveryPage = await context.newPage();
    recoveryPage.on("pageerror", (err) => pageErrors.push(err instanceof Error ? err.message : String(err)));
    recoveryPage.on("console", (msg) => {
      if (msg.type() === "error") {
        const txt = msg.text();
        const locUrl = String(msg.location()?.url || "");
        if (/^Failed to load resource:/i.test(txt) && /\/favicon\.ico(?:\?.*)?$/i.test(locUrl)) {
          return;
        }
        consoleErrors.push(txt);
      }
    });
    const recoveryNav = await recoveryPage.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: Math.min(2500, remainingMs()),
    });
    await recoveryPage.waitForTimeout(Math.min(150, remainingMs()));
    const recoveryStatus = recoveryNav ? recoveryNav.status() : 200;

    return {
      executed: true,
      htmlDetected,
      faultNavStatus: faultNav ? faultNav.status() : 200,
      recoveryStatus,
      interceptedCount,
      pageErrors,
      consoleErrors,
    };
  } catch (err) {
    return {
      executed: false,
      htmlDetected,
      skippedReason: `Browser fault check aborted gracefully: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    if (recoveryPage) await recoveryPage.close().catch(() => {});
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

async function main() {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();

  const { values } = parseCliArgs(process.argv.slice(2), {
    booleanFlags: ["dry-run", "allow-private-ip", "skip-browser", "browser-only", "help"],
    multiFlags: ["repo-path"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/runners/resilience-toxiproxy.mjs [--config <path>] --target-url <url> [--api-url <url>] [--skip-browser] [--browser-only] [--memory-dir <dir>] [--trace-dir <dir>] [--out <file>] [--dry-run]",
    );
    process.exit(0);
  }

  const cfg = values.config ? loadConfigFile(values.config) : {};
  const apiUrl = values["api-url"] ?? cfg.apiUrl ?? values["target-url"] ?? cfg.targetUrl;
  const targetUrl = values["target-url"] ?? cfg.targetUrl ?? apiUrl;
  const memoryDir = path.resolve(values["memory-dir"] || MEMORY_DIR);
  const traceDir = path.resolve(values["trace-dir"] || path.join(memoryDir, "traces"));
  const dryRun = Boolean(values["dry-run"]);
  const skipBrowser = Boolean(values["skip-browser"]);
  const browserOnly = Boolean(values["browser-only"]);
  const allowPrivateIp = Boolean(values["allow-private-ip"] || cfg.allowPrivateIp);
  const privIpFlag = allowPrivateIp ? " --allow-private-ip" : "";

  if (!apiUrl) {
    emitAndExit(
      buildOutput({
        status: "skipped_non_applicable",
        startedAt,
        startedMs,
        notes: "No --api-url or --target-url provided; skipping Toxiproxy resilience runner.",
      }),
      values.out,
      0,
    );
  }

  const safetyCheck = evaluateSafetyAndBudget({
    config: values.config,
    targetUrl,
    apiUrl,
    allowPrivateIp,
    budgetFile: path.join(TEST_RESULTS_DIR, `.guard-toxi-${process.pid}-${Date.now()}.json`),
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
            id: "QA-TOXI-SAFETY-001",
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
        notes: "Dry run enabled; skipped Toxiproxy container spin-up.",
      }),
      values.out,
      0,
    );
  }

  ensureDir(traceDir);
  const uniqueTag = makeUniqueTag();
  const tracePath = path.join(traceDir, `resilience-toxiproxy-${uniqueTag}.json`);
  const relTracePath = toStagingRelPath(tracePath);

  const parsedApi = new URL(apiUrl);
  const originalHost = parsedApi.host;
  const rawHost = parsedApi.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const dockerHost = rawHost === "127.0.0.1" || rawHost === "localhost" || rawHost === "::1" ? "host.docker.internal" : parsedApi.hostname;
  const upstreamPort = parsedApi.port ? Number.parseInt(parsedApi.port, 10) : parsedApi.protocol === "https:" ? 443 : 80;
  let probePath = parsedApi.pathname && parsedApi.pathname !== "/" ? `${parsedApi.pathname}${parsedApi.search || ""}` : "/";
  if (probePath === "/" && cfg.resilienceProbePath) {
    const rawProbe = String(cfg.resilienceProbePath).trim();
    if (rawProbe) {
      probePath = rawProbe.startsWith("/") ? rawProbe : `/${rawProbe}`;
    }
  } else if (probePath === "/") {
    try {
      const hz = await fetch(`${parsedApi.origin}/healthz`, { method: "GET", signal: AbortSignal.timeout(1200) });
      if (hz.ok) probePath = "/healthz";
    } catch {
      // keep "/" if unreachable or no /healthz
    }
  }
  const probeApiUrl = new URL(probePath, parsedApi.origin).toString();
  const proxyName = `qa-proxy-${process.pid}-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;

  let containerId = null;
  let adminBaseUrl = null;
  let proxyCreated = false;
  let requestsConsumed = 0;
  let assertions = 0;
  const findings = [];
  const steps = {};

  if (browserOnly) {
    steps.toxiproxySkipped = "--browser-only set";
  } else {
    try {
      containerId = execFileSync(
        "docker",
        [
          "run",
          "-d",
          "--rm",
          "-p",
          "127.0.0.1:0:8474",
          "-p",
          "127.0.0.1:0:18080",
          "--add-host=host.docker.internal:host-gateway",
          "ghcr.io/shopify/toxiproxy:latest",
        ],
        { cwd: STAGING_ROOT, encoding: "utf8", windowsHide: true, timeout: 10000 },
      ).trim();

      const adminPort = parseDockerPort(containerId, "8474/tcp");
      const proxyPort = parseDockerPort(containerId, "18080/tcp");
      adminBaseUrl = `http://127.0.0.1:${adminPort}`;
      const toxiVersion = await waitForToxiproxyAdmin(adminBaseUrl, 6000);
      steps.toxiproxyVersion = toxiVersion.trim();

      const createRes = await fetch(`${adminBaseUrl}/proxies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: proxyName,
          listen: "0.0.0.0:18080",
          upstream: `${dockerHost}:${upstreamPort}`,
          enabled: true,
        }),
        signal: AbortSignal.timeout(3000),
      });
      if (!createRes.ok) {
        throw new Error(`Failed to create Toxiproxy proxy (${createRes.status}): ${await createRes.text()}`);
      }
      proxyCreated = true;

      // Step 1: Baseline through proxy
      requestsConsumed += 1;
      assertions += 1;
      const baseline = await sendProxiedHttpGet({ proxyPort, originalHost, reqPath: probePath, timeoutMs: 3000 });
      steps.baseline = baseline;

      if (baseline.status === 0 || baseline.error) {
        findings.push({
          id: "QA-TOXI-DEGRADED-001",
          fingerprint: `runtime_degraded|toxiproxy_upstream:${originalHost}`,
          classification: "runtime_degraded",
          severity: "medium",
          title: "Upstream target unreachable through Toxiproxy baseline probe",
          endpointOrRoute: `GET ${probePath}`,
          checkMode: "unreachable",
          ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
          reproCommand: `node scripts/runners/resilience-toxiproxy.mjs --api-url ${probeApiUrl} --skip-browser${privIpFlag}`,
          evidencePaths: [relTracePath],
          verifiedOutcome: sanitizeText(baseline.error || `Proxied baseline status=${baseline.status}`),
        });
      } else {
        // Step 2: Latency toxic (300ms)
        const latencyToxicRes = await fetch(`${adminBaseUrl}/proxies/${proxyName}/toxics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "qa_latency",
            type: "latency",
            stream: "downstream",
            toxicity: 1.0,
            attributes: { latency: 300, jitter: 30 },
          }),
          signal: AbortSignal.timeout(3000),
        });
        if (!latencyToxicRes.ok) {
          throw new Error(`Failed to add latency toxic (${latencyToxicRes.status}): ${await latencyToxicRes.text()}`);
        }
        requestsConsumed += 1;
        assertions += 1;
        const latencyRes = await sendProxiedHttpGet({ proxyPort, originalHost, reqPath: probePath, timeoutMs: 2500 });
        steps.latency = latencyRes;
        await fetch(`${adminBaseUrl}/proxies/${proxyName}/toxics/qa_latency`, {
          method: "DELETE",
          signal: AbortSignal.timeout(2000),
        }).catch(() => {});

        if (latencyRes.status === 0 || latencyRes.timedOut || latencyRes.status >= 500) {
          findings.push({
            id: `QA-TOXI-${String(findings.length + 1).padStart(3, "0")}`,
            fingerprint: `confirmed_bug|toxiproxy_latency:${probePath}`,
            classification: "confirmed_bug",
            severity: "high",
            title:
              latencyRes.status >= 500
                ? `Upstream returned HTTP ${latencyRes.status} under 300ms Toxiproxy latency`
                : `Upstream timed out or failed under 300ms Toxiproxy latency (status=${latencyRes.status})`,
            endpointOrRoute: `GET ${probePath}`,
            checkMode: "resilience_toxiproxy_latency",
            ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
            reproCommand: `node scripts/runners/resilience-toxiproxy.mjs --api-url ${probeApiUrl} --skip-browser${privIpFlag}`,
            evidencePaths: [relTracePath],
            verifiedOutcome: sanitizeText(
              latencyRes.timedOut || latencyRes.status === 0
                ? `Injected 300ms latency toxic and proxied request timed out/failed: ${latencyRes.error || `status=${latencyRes.status}`}`
                : `Injected 300ms latency toxic and received HTTP ${latencyRes.status}`,
            ),
          });
        }

        // Step 3: Reset peer fault toxic
        const resetToxicRes = await fetch(`${adminBaseUrl}/proxies/${proxyName}/toxics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "qa_reset",
            type: "reset_peer",
            stream: "downstream",
            toxicity: 1.0,
            attributes: { timeout: 50 },
          }),
          signal: AbortSignal.timeout(3000),
        });
        if (!resetToxicRes.ok) {
          throw new Error(`Failed to add reset_peer toxic (${resetToxicRes.status}): ${await resetToxicRes.text()}`);
        }
        requestsConsumed += 1;
        assertions += 1;
        const resetRes = await sendProxiedHttpGet({ proxyPort, originalHost, reqPath: probePath, timeoutMs: 2500 });
        steps.resetPeer = resetRes;
        await fetch(`${adminBaseUrl}/proxies/${proxyName}/toxics/qa_reset`, {
          method: "DELETE",
          signal: AbortSignal.timeout(2000),
        }).catch(() => {});

        // Step 4: Recovery verification
        requestsConsumed += 1;
        assertions += 1;
        const recoveryRes = await sendProxiedHttpGet({ proxyPort, originalHost, reqPath: probePath, timeoutMs: 2500 });
        steps.recovery = recoveryRes;
        if (recoveryRes.status === 0 || recoveryRes.status >= 500) {
          findings.push({
            id: `QA-TOXI-${String(findings.length + 1).padStart(3, "0")}`,
            fingerprint: `confirmed_bug|toxiproxy_recovery:${probePath}`,
            classification: "confirmed_bug",
            severity: "high",
            title: "Upstream failed to recover after Toxiproxy fault removal",
            endpointOrRoute: `GET ${probePath}`,
            checkMode: "resilience_toxiproxy_recovery",
            ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
            reproCommand: `node scripts/runners/resilience-toxiproxy.mjs --api-url ${probeApiUrl} --skip-browser${privIpFlag}`,
            evidencePaths: [relTracePath],
            verifiedOutcome: `Post-recovery probe returned status=${recoveryRes.status}, error=${recoveryRes.error}`,
          });
        }
      }
    } catch (err) {
      findings.push({
        id: "QA-TOXI-DEGRADED-002",
        fingerprint: "runtime_degraded|toxiproxy_docker",
        classification: "runtime_degraded",
        severity: "medium",
        title: "Toxiproxy container setup or fault-injection failed",
        endpointOrRoute: `GET ${probePath}`,
        checkMode: "unreachable",
        ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
        reproCommand: `node scripts/runners/resilience-toxiproxy.mjs --api-url ${probeApiUrl} --skip-browser${privIpFlag}`,
        evidencePaths: [relTracePath],
        verifiedOutcome: sanitizeText(err instanceof Error ? err.message : String(err)),
      });
    } finally {
      if (proxyCreated && adminBaseUrl) {
        await fetch(`${adminBaseUrl}/proxies/${proxyName}`, {
          method: "DELETE",
          signal: AbortSignal.timeout(1500),
        }).catch(() => {});
      }
      if (containerId) {
        try {
          execFileSync("docker", ["rm", "-f", containerId], {
            stdio: "ignore",
            windowsHide: true,
            timeout: 5000,
          });
        } catch {
          // ignore if already removed by --rm
        }
      }
    }
  }

  const routesVisited = [];
  if (!skipBrowser && targetUrl) {
    const browserRes = await runBrowserFaultCheck(targetUrl, 11000);
    steps.browserFaultCheck = browserRes;
    if (browserRes.executed) {
      const targetRoute = new URL(targetUrl).pathname || "/";
      routesVisited.push(targetRoute);
      requestsConsumed += 2;
      assertions += 1;
      const consoleErrors = Array.isArray(browserRes.consoleErrors) ? browserRes.consoleErrors : [];
      if (browserRes.pageErrors.length > 0 || consoleErrors.length > 0 || browserRes.recoveryStatus >= 500) {
        findings.push({
          id: `QA-TOXI-${String(findings.length + 1).padStart(3, "0")}`,
          fingerprint: `confirmed_bug|browser_fault:${targetRoute}`,
          classification: "confirmed_bug",
          severity: "high",
          title: "UI failed or logged errors under Playwright 503/abort resilience check",
          endpointOrRoute: targetRoute,
          checkMode: "resilience_browser_fault",
          ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
          reproCommand: `node scripts/runners/resilience-toxiproxy.mjs --target-url ${targetUrl} --api-url ${apiUrl} --browser-only${privIpFlag}`,
          evidencePaths: [relTracePath],
          verifiedOutcome: sanitizeText(
            `Browser fault check recoveryStatus=${browserRes.recoveryStatus}, pageErrors=${browserRes.pageErrors.join("; ")}, consoleErrors=${consoleErrors.join("; ")}`,
          ),
        });
      }
    } else if (browserRes.htmlDetected) {
      findings.push({
        id: `QA-TOXI-DEGRADED-${String(findings.length + 1).padStart(3, "0")}`,
        fingerprint: "runtime_degraded|browser_fault_check",
        classification: "runtime_degraded",
        severity: "medium",
        title: "Playwright browser fault check did not complete within budget",
        endpointOrRoute: new URL(targetUrl).pathname || "/",
        checkMode: "unreachable",
        ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
        reproCommand: `node scripts/runners/resilience-toxiproxy.mjs --target-url ${targetUrl} --api-url ${apiUrl} --browser-only${privIpFlag}`,
        evidencePaths: [relTracePath],
        verifiedOutcome: sanitizeText(browserRes.skippedReason || "Browser fault check failed to execute"),
      });
    }
  } else if (skipBrowser) {
    steps.browserFaultCheck = { executed: false, skippedReason: "--skip-browser set" };
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
    requests: requestsConsumed,
    routes: routesVisited,
    endpoints: browserOnly ? [] : [`GET ${probePath}`],
    roles: ["anonymous"],
    assertions,
    findings,
    traces: [relTracePath],
    notes:
      status === "degraded"
        ? `Toxiproxy resilience check degraded on ${apiUrl}; cleaned up ephemeral proxy/container.`
        : `Toxiproxy resilience suite passed (baseline=${steps.baseline?.status}, latency=${steps.latency?.durationMs}ms, resetPeer=${Boolean(steps.resetPeer?.error)}, recovery=${steps.recovery?.status}, browserCheck=${Boolean(steps.browserFaultCheck?.executed)}).`,
  });

  writeJsonAtomic(tracePath, {
    ...output,
    apiUrl,
    originalHost,
    proxyName,
    steps,
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
