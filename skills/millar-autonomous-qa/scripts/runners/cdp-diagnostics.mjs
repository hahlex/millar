#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
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
    tool: "chrome-devtools-mcp",
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
      roles: uniqueStrings(fields.roles || ["guest"]),
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

function killProcessTree(child) {
  if (!child || !child.pid) return;
  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      child.kill("SIGKILL");
    }
  } catch {
    // ignore if already exited
  }
}

function extractTextContent(mcpResult) {
  if (!mcpResult || !Array.isArray(mcpResult.content)) return "";
  return mcpResult.content
    .filter((c) => c && c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("\n");
}

function parsePageId(newPageText) {
  const selected = String(newPageText || "").match(/(\d+):[^\n]*\[selected\]/);
  if (selected) return Number.parseInt(selected[1], 10);
  const lines = String(newPageText || "").match(/^(\d+):/gm);
  if (lines && lines.length > 0) {
    const last = lines[lines.length - 1].match(/^(\d+):/);
    if (last) return Number.parseInt(last[1], 10);
  }
  return null;
}

class McpStdioClient {
  constructor(binPath) {
    this.child = spawn(
      process.execPath,
      [binPath, "--headless", "--isolated", "--no-usage-statistics", "--no-performance-crux"],
      {
        cwd: STAGING_ROOT,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = "";
    this.stderr = "";
    this.closed = false;

    this.child.stdout.on("data", (chunk) => {
      this.buffer += chunk.toString("utf8");
      let nlIdx;
      while ((nlIdx = this.buffer.indexOf("\n")) !== -1) {
        const line = this.buffer.slice(0, nlIdx).trim();
        this.buffer = this.buffer.slice(nlIdx + 1);
        if (!line) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id !== undefined && this.pending.has(msg.id)) {
            const waiter = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            clearTimeout(waiter.timer);
            if (msg.error) {
              waiter.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              waiter.resolve(msg.result);
            }
          }
        } catch {
          // ignore non-JSON diagnostic lines
        }
      }
    });

    this.child.stderr.on("data", (chunk) => {
      if (this.stderr.length < 4096) {
        this.stderr += chunk.toString("utf8");
      }
    });

    this.child.on("close", () => {
      this.closed = true;
      for (const [, waiter] of this.pending) {
        clearTimeout(waiter.timer);
        waiter.reject(new Error("chrome-devtools-mcp process closed unexpectedly"));
      }
      this.pending.clear();
    });

    this.child.on("error", (err) => {
      this.closed = true;
      for (const [, waiter] of this.pending) {
        clearTimeout(waiter.timer);
        waiter.reject(err);
      }
      this.pending.clear();
    });

    if (this.child.stdin) {
      this.child.stdin.on("error", (err) => {
        this.closed = true;
        for (const [, waiter] of this.pending) {
          clearTimeout(waiter.timer);
          waiter.reject(err);
        }
        this.pending.clear();
      });
    }
  }

  request(method, params = {}, timeoutMs = 8000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      if (this.closed || !this.child.stdin || this.child.stdin.destroyed || !this.child.stdin.writable) {
        reject(new Error("MCP client already closed"));
        return;
      }
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      const payload = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
      try {
        this.child.stdin.write(payload);
      } catch (err) {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  notify(method, params = {}) {
    if (this.closed || !this.child.stdin || this.child.stdin.destroyed || !this.child.stdin.writable) return;
    const payload = JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n";
    try {
      this.child.stdin.write(payload);
    } catch {
      // ignore broken pipe on notify
    }
  }

  async close() {
    try {
      if (!this.closed && this.child.stdin && !this.child.stdin.destroyed) {
        this.child.stdin.end();
      }
    } catch {
      // ignore
    }
    await new Promise((resolve) => {
      if (this.closed) return resolve();
      const t = setTimeout(resolve, 350);
      this.child.once("close", () => {
        clearTimeout(t);
        resolve();
      });
    });
    if (!this.closed) {
      killProcessTree(this.child);
    }
  }
}

async function main() {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();

  const { values } = parseCliArgs(process.argv.slice(2), {
    booleanFlags: ["dry-run", "allow-private-ip", "trace", "lighthouse", "help"],
    multiFlags: ["repo-path"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/runners/cdp-diagnostics.mjs [--config <path>] --target-url <url> [--trace] [--lighthouse] [--memory-dir <dir>] [--trace-dir <dir>] [--out <file>] [--dry-run]",
    );
    process.exit(0);
  }

  const cfg = values.config ? loadConfigFile(values.config) : {};
  const targetUrl = values["target-url"] ?? cfg.targetUrl;
  const apiUrl = values["api-url"] ?? cfg.apiUrl ?? targetUrl;
  const memoryDir = path.resolve(values["memory-dir"] || MEMORY_DIR);
  const traceDir = path.resolve(values["trace-dir"] || path.join(memoryDir, "traces"));
  const dryRun = Boolean(values["dry-run"]);
  const enableTrace = Boolean(values.trace);
  const enableLighthouse = Boolean(values.lighthouse);
  const allowPrivateIp = Boolean(values["allow-private-ip"] || cfg.allowPrivateIp);
  const privIpFlag = allowPrivateIp ? " --allow-private-ip" : "";

  if (!targetUrl) {
    emitAndExit(
      buildOutput({
        status: "skipped_non_applicable",
        startedAt,
        startedMs,
        notes: "No --target-url provided; skipping Chrome DevTools MCP diagnostics.",
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
    budgetFile: path.join(TEST_RESULTS_DIR, `.guard-cdp-${process.pid}-${Date.now()}.json`),
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
            id: "QA-CDP-SAFETY-001",
            classification: "runtime_degraded",
            severity: "critical",
            title: "Safety guard rejected target URL",
            reproCommand: `node scripts/safety-guard.mjs --target-url ${targetUrl}`,
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

  const parsedTarget = new URL(targetUrl);
  const targetRoute = `${parsedTarget.pathname || "/"}${parsedTarget.search || ""}`;

  if (dryRun) {
    emitAndExit(
      buildOutput({
        status: "skipped_non_applicable",
        startedAt,
        startedMs,
        routes: [targetRoute],
        notes: "Dry run enabled; skipped Chrome DevTools MCP launch.",
      }),
      values.out,
      0,
    );
  }

  ensureDir(traceDir);
  const uniqueTag = makeUniqueTag();
  const tracePath = path.join(traceDir, `cdp-diagnostics-${uniqueTag}.json`);
  const relTracePath = toStagingRelPath(tracePath);

  const mcpBin = path.join(
    STAGING_ROOT,
    "node_modules",
    "chrome-devtools-mcp",
    "out",
    "Default",
    "gen",
    "src",
    "bin",
    "chrome-devtools-mcp.js",
  );

  if (!fs.existsSync(mcpBin)) {
    const output = buildOutput({
      status: "degraded",
      startedAt,
      startedMs,
      findings: [
        {
          id: "QA-CDP-DEGRADED-001",
          fingerprint: "runtime_degraded|cdp_bin_missing",
          classification: "runtime_degraded",
          severity: "medium",
          title: "chrome-devtools-mcp entrypoint not found",
          reproCommand: `node scripts/runners/cdp-diagnostics.mjs --target-url ${targetUrl}${privIpFlag}`,
          evidencePaths: [relTracePath],
          verifiedOutcome: `Missing file: ${mcpBin}`,
        },
      ],
      traces: [relTracePath],
      notes: "chrome-devtools-mcp binary missing.",
    });
    writeJsonAtomic(tracePath, output);
    emitAndExit(output, values.out, 0);
  }

  const client = new McpStdioClient(mcpBin);
  const findings = [];
  const routes = [];
  const endpoints = [];
  let assertions = 0;
  let requestsConsumed = 0;
  let pageId = null;
  let evalData = null;
  let consoleText = "";
  let networkText = "";
  let perfTraceText = null;
  let lighthouseText = null;
  let cdpError = null;

  const overallRpcBudgetMs = enableTrace || enableLighthouse ? 23000 : 15000;
  const rpcDeadlineMs = startedMs + overallRpcBudgetMs;
  const remainingRpcMs = (capMs) => {
    const rem = rpcDeadlineMs - Date.now();
    if (rem <= 250) {
      throw new Error(`CDP MCP cumulative deadline (${overallRpcBudgetMs}ms) exceeded`);
    }
    return Math.min(capMs, rem);
  };

  try {
    await client.request(
      "initialize",
      {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "autonomous-qa-cdp", version: "1.0.0" },
      },
      remainingRpcMs(7000),
    );
    client.notify("notifications/initialized", {});

    const newPageTimeout = Math.min(8000, remainingRpcMs(8000));
    const newPageRes = await client.request(
      "tools/call",
      { name: "new_page", arguments: { url: targetUrl, timeout: newPageTimeout } },
      remainingRpcMs(9000),
    );
    requestsConsumed += 1;
    const newPageText = extractTextContent(newPageRes);
    if (newPageRes?.isError) {
      throw new Error(newPageText || "new_page returned error");
    }
    pageId = parsePageId(newPageText);
    if (!pageId) {
      throw new Error(`Unable to parse pageId from new_page output: ${newPageText.slice(0, 200)}`);
    }
    routes.push(targetRoute);
    assertions += 1;

    const evalRes = await client.request(
      "tools/call",
      {
        name: "evaluate_script",
        arguments: {
          pageId,
          function:
            "() => ({ title: document.title || '', readyState: document.readyState, bodyLen: (document.body?.innerText || '').trim().length, hasMain: Boolean(document.querySelector('main, h1')), fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null, domInteractiveMs: performance.getEntriesByType('navigation')[0]?.domInteractive ?? null })",
        },
      },
      remainingRpcMs(5000),
    );
    const evalRaw = extractTextContent(evalRes);
    if (evalRes?.isError) {
      throw new Error(evalRaw || "evaluate_script returned error");
    }
    const jsonMatch = evalRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        evalData = JSON.parse(jsonMatch[0]);
      } catch {
        evalData = { raw: evalRaw };
      }
    } else {
      evalData = { raw: evalRaw };
    }
    assertions += 1;

    const consoleRes = await client.request(
      "tools/call",
      { name: "list_console_messages", arguments: { pageId } },
      remainingRpcMs(4000),
    );
    consoleText = extractTextContent(consoleRes);
    if (consoleRes?.isError) {
      throw new Error(consoleText || "list_console_messages returned error");
    }
    assertions += 1;

    const seenConsoleErrors = new Set();
    for (const line of consoleText.split(/\r?\n/)) {
      const m = line.match(/^(?:msgid=\d+\s+)?\[error\]\s+(.+)$/i);
      if (!m) continue;
      const errMsg = m[1].trim();
      if (!errMsg || seenConsoleErrors.has(errMsg)) continue;
      seenConsoleErrors.add(errMsg);
      const isUncaught = /uncaught|pageerror|typeerror|referenceerror/i.test(errMsg);
      findings.push({
        id: `QA-CDP-${String(findings.length + 1).padStart(3, "0")}`,
        fingerprint: `confirmed_bug|cdp:${isUncaught ? "pageerror" : "console_error"}:${targetRoute}:${errMsg.slice(0, 80)}`,
        classification: "confirmed_bug",
        severity: isUncaught ? "high" : "medium",
        title: isUncaught
          ? `CDP uncaught pageerror detected on ${targetRoute}`
          : `CDP browser console.error detected on ${targetRoute}`,
        endpointOrRoute: targetRoute,
        checkMode: isUncaught ? "cdp_pageerror" : "cdp_console_error",
        ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
        reproCommand: `node scripts/runners/cdp-diagnostics.mjs --target-url ${targetUrl}${privIpFlag}`,
        evidencePaths: [relTracePath],
        verifiedOutcome: `Chrome DevTools MCP list_console_messages recorded [error]: ${sanitizeText(errMsg)}`,
      });
    }

    const netRes = await client.request(
      "tools/call",
      { name: "list_network_requests", arguments: { pageId } },
      remainingRpcMs(4000),
    );
    networkText = extractTextContent(netRes);
    if (netRes?.isError) {
      throw new Error(networkText || "list_network_requests returned error");
    }
    assertions += 1;

    for (const line of networkText.split(/\r?\n/)) {
      const m = line.match(/\b(GET|POST|PUT|PATCH|DELETE)\s+(https?:\/\/\S+)\s+\[(\d{3})\]/i);
      if (m) {
        const method = m[1].toUpperCase();
        const reqUrl = m[2];
        const statusCode = Number.parseInt(m[3], 10);
        let reqPath = reqUrl;
        try {
          const u = new URL(reqUrl);
          reqPath = `${u.pathname}${u.search}`;
          endpoints.push(`${method} ${u.pathname}`);
        } catch {
          // ignore
        }
        if (statusCode >= 500) {
          findings.push({
            id: `QA-CDP-${String(findings.length + 1).padStart(3, "0")}`,
            fingerprint: `confirmed_bug|cdp:http5xx:${method} ${reqPath}`,
            classification: "confirmed_bug",
            severity: "high",
            title: `CDP network request failed with HTTP ${statusCode}`,
            endpointOrRoute: `${method} ${reqPath}`,
            checkMode: "status_gte_500",
            reproCommand: `curl -i ${reqUrl}`,
            evidencePaths: [relTracePath],
            verifiedOutcome: `Chrome DevTools MCP recorded ${method} ${reqUrl} -> HTTP ${statusCode}`,
          });
        }
      }
    }

    if (enableTrace) {
      const perfRes = await client.request(
        "tools/call",
        { name: "performance_start_trace", arguments: { pageId, reload: true, autoStop: true } },
        remainingRpcMs(23000),
      );
      perfTraceText = extractTextContent(perfRes);
      if (perfRes?.isError) {
        throw new Error(perfTraceText || "performance_start_trace returned error");
      }
      assertions += 1;
    }

    if (enableLighthouse) {
      const lhRes = await client.request(
        "tools/call",
        { name: "lighthouse_audit", arguments: { pageId, mode: "navigation", device: "desktop" } },
        remainingRpcMs(23000),
      );
      lighthouseText = extractTextContent(lhRes);
      if (lhRes?.isError) {
        throw new Error(lighthouseText || "lighthouse_audit returned error");
      }
      assertions += 1;
    }
  } catch (err) {
    cdpError = err instanceof Error ? err.message : String(err);
    findings.push({
      id: `QA-CDP-${String(findings.length + 1).padStart(3, "0")}`,
      fingerprint: `runtime_degraded|cdp:${targetRoute}`,
      classification: "runtime_degraded",
      severity: "medium",
      title: "Chrome DevTools MCP diagnostic probe degraded or timed out",
      endpointOrRoute: targetRoute,
      ...(allowPrivateIp ? { allowPrivateIp: true } : {}),
      reproCommand: `node scripts/runners/cdp-diagnostics.mjs --target-url ${targetUrl}${privIpFlag}`,
      evidencePaths: [relTracePath],
      verifiedOutcome: sanitizeText(cdpError),
    });
  } finally {
    await client.close();
  }

  let status = "passed";
  if (findings.some((f) => f.classification === "confirmed_bug")) {
    status = "failed";
  } else if (cdpError || findings.some((f) => f.classification === "runtime_degraded")) {
    status = "degraded";
  }

  const output = buildOutput({
    status,
    startedAt,
    startedMs,
    requests: requestsConsumed,
    routes,
    endpoints,
    roles: ["guest"],
    assertions,
    findings,
    traces: [relTracePath],
    notes: cdpError
      ? `CDP diagnostics degraded: ${cdpError}`
      : `CDP diagnostics completed on ${targetRoute} (pageId=${pageId}, title=${JSON.stringify(evalData?.title || "")}, fcpMs=${evalData?.fcpMs ?? "n/a"}).`,
  });

  writeJsonAtomic(tracePath, {
    ...output,
    targetUrl,
    pageId,
    evalData,
    consoleText,
    networkText,
    perfTraceText,
    lighthouseText,
    mcpStderr: client.stderr,
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
