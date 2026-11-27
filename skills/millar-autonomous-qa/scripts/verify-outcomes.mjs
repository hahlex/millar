#!/usr/bin/env node
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  fetchWithTimeout,
  isolatedChildEnv,
  loadConfigFile,
  MEMORY_DIR,
  parseCliArgs,
  parseNonNegativeNumber,
  sanitizeForOutput,
  toStagingRelPath,
  uniqueStrings,
  writeJsonAtomic,
} from "./lib/common.mjs";
import { getPythonBin } from "./python-env.mjs";

const execFileAsync = promisify(execFile);

async function runPostgresCheck(pgDsn, pgQuery, timeoutMs) {
  const pythonBin = getPythonBin();
  if (!pythonBin || !fs.existsSync(pythonBin)) {
    return { status: "skipped", reason: "Python venv not available for psycopg check" };
  }
  const pyCode = [
    "import json, os, psycopg",
    "dsn = os.environ['QA_PG_DSN']",
    "q = os.environ.get('QA_PG_QUERY') or 'SELECT 1 AS ok'",
    "with psycopg.connect(dsn, connect_timeout=3) as conn:",
    "    with conn.cursor() as cur:",
    "        cur.execute(q)",
    "        rows = cur.fetchall() if cur.description else []",
    "serial_rows = [list(r) if isinstance(r, (list, tuple)) else [r] for r in rows[:20]]",
    "first_row = serial_rows[0] if serial_rows else None",
    "first_val = first_row[0] if first_row else None",
    "print(json.dumps({'ok': True, 'rowCount': len(rows), 'firstValue': first_val, 'firstRow': first_row, 'rows': serial_rows}, default=str))",
  ].join("\n");

  try {
    const { stdout } = await execFileAsync(pythonBin, ["-c", pyCode], {
      timeout: Math.max(timeoutMs, 5000),
      env: isolatedChildEnv({
        QA_PG_DSN: pgDsn,
        QA_PG_QUERY: pgQuery || "SELECT 1 AS ok",
      }),
      windowsHide: true,
    });
    const parsed = JSON.parse(stdout.trim());
    return { status: "passed", ...parsed };
  } catch (err) {
    return {
      status: "degraded",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runRedisCheck(redisUrl, timeoutMs) {
  const pythonBin = getPythonBin();
  if (!pythonBin || !fs.existsSync(pythonBin)) {
    return { status: "skipped", reason: "Python venv not available for redis check" };
  }
  const pyCode = [
    "import json, os, redis",
    "client = redis.from_url(os.environ['QA_REDIS_URL'], socket_timeout=3)",
    "pong = bool(client.ping())",
    "queues = {}",
    "for k in client.keys('rq:queue:*'):",
    "    name = k.decode('utf-8', 'ignore') if isinstance(k, bytes) else str(k)",
    "    try:",
    "        if hasattr(client, 'type'):",
    "            kt = client.type(name)",
    "            kts = kt.decode('utf-8', 'ignore') if isinstance(kt, bytes) else str(kt)",
    "            if kts != 'list':",
    "                continue",
    "        queues[name] = client.llen(name)",
    "    except Exception as exc:",
    "        if 'WRONGTYPE' in str(exc):",
    "            continue",
    "        raise",
    "workers = client.smembers('rq:workers') or set()",
    "print(json.dumps({'ok': pong, 'queues': queues, 'rqWorkerCount': len(workers)}))",
  ].join("\n");

  try {
    const { stdout } = await execFileAsync(pythonBin, ["-c", pyCode], {
      timeout: Math.max(timeoutMs, 5000),
      env: isolatedChildEnv({ QA_REDIS_URL: redisUrl }),
      windowsHide: true,
    });
    const parsed = JSON.parse(stdout.trim());
    return { status: "passed", ...parsed };
  } catch (err) {
    return {
      status: "degraded",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runDockerLogCheck(containerName, requestId, timeoutMs) {
  try {
    const { stdout, stderr } = await execFileAsync(
      "docker",
      ["logs", "--since", "5m", "--tail", "100", containerName],
      { timeout: Math.max(timeoutMs, 4000), windowsHide: true },
    );
    const combined = `${stdout}\n${stderr}`;
    const hasUncaught = /UnhandledPromiseRejection|Traceback \(most recent call last\)|FATAL:/i.test(combined);
    const matchedRequestId = requestId ? combined.includes(requestId) : false;
    return {
      container: containerName,
      status: hasUncaught ? "failed" : "passed",
      matchedRequestId,
      hasUncaught,
    };
  } catch (err) {
    return {
      container: containerName,
      status: "degraded",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runVerifyOutcomes(opts = {}) {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();
  const cfg = opts.config ? loadConfigFile(opts.config) : {};
  const timeoutMs = parseNonNegativeNumber(opts.timeoutMs, 4000, "--timeout-ms");

  const targetUrl = opts.targetUrl ?? cfg.targetUrl;
  const apiUrl = opts.apiUrl ?? cfg.apiUrl ?? targetUrl;
  const mailpitUrl = opts.mailpitUrl ?? cfg.mailpitUrl;
  const langfuseUrl = opts.langfuseUrl ?? cfg.langfuseUrl;
  const apiCheckUrl = opts.apiCheckUrl;
  const probeEndpoint = opts.probeEndpoint;
  const requestId = opts.requestId;
  const expectMailpitMarker = opts.expectMailpitMarker;
  const pgDsn = opts.pgDsn ?? opts.pgUrl ?? cfg.pgDsn ?? (cfg.pgDsnEnv ? process.env[cfg.pgDsnEnv] : undefined);
  const pgQuery = opts.pgQuery ?? cfg.pgQuery;
  const redisUrl = opts.redisUrl ?? cfg.redisUrl ?? (cfg.redisUrlEnv ? process.env[cfg.redisUrlEnv] : undefined);
  const dockerContainersValueless = opts.dockerContainers === true;
  const dockerContainerInputs = Array.isArray(opts.dockerContainers)
    ? opts.dockerContainers
    : typeof opts.dockerContainers === "string"
      ? opts.dockerContainers.split(",").map((s) => s.trim())
      : [];
  const dockerContainers = uniqueStrings([
    ...dockerContainerInputs.map((s) => String(s || "").trim()).filter(Boolean),
    ...(Array.isArray(cfg.dockerContainers) ? cfg.dockerContainers.map((s) => String(s || "").trim()).filter(Boolean) : []),
  ]);

  const memoryDir = path.resolve(opts.memoryDir || MEMORY_DIR);
  const traceDir = path.resolve(opts.traceDir || path.join(memoryDir, "traces"));
  const tsSlug = startedAt.replace(/[:.]/g, "-");
  const tracePath = path.join(traceDir, `verify-outcomes-${tsSlug}.json`);
  const relTracePath = toStagingRelPath(tracePath);

  const findings = [];
  const nextFindingId = () => `QA-VER-${String(findings.length + 1).padStart(3, "0")}`;

  const channels = {};
  const endpointsChecked = [];
  const routesChecked = [];
  let requests = 0;
  let assertions = 0;
  let hasBug = false;
  let hasDegraded = false;

  const headers = {};
  if (requestId) headers["X-Request-Id"] = requestId;

  const tryParseUrl = (raw, base) => {
    try {
      return base ? new URL(raw, base) : new URL(raw);
    } catch {
      return null;
    }
  };

  // 1. API & Correlation Channel
  if (apiUrl || apiCheckUrl || probeEndpoint) {
    const apiResults = [];
    const baseApiParsed = apiUrl ? tryParseUrl(apiUrl) : targetUrl ? tryParseUrl(targetUrl) : null;
    const baseApi = baseApiParsed ? baseApiParsed.origin : null;
    const urlsToCheck = [];

    if ((apiUrl || targetUrl) && !baseApi) {
      hasDegraded = true;
      findings.push({
        id: nextFindingId(),
        fingerprint: "runtime_degraded|verify_outcomes:invalid_api_url",
        classification: "runtime_degraded",
        severity: "medium",
        title: "Invalid API or target URL provided to verify-outcomes",
        endpointOrRoute: "/",
        checkMode: "unreachable",
        reproCommand: "node scripts/verify-outcomes.mjs",
        evidencePaths: [relTracePath],
        verifiedOutcome: `Invalid URL: ${apiUrl || targetUrl}`,
      });
    } else if (probeEndpoint && baseApi) {
      const pUrl = tryParseUrl(probeEndpoint, baseApi);
      if (pUrl) {
        urlsToCheck.push(pUrl.toString());
      } else {
        hasDegraded = true;
        findings.push({
          id: nextFindingId(),
          fingerprint: "runtime_degraded|verify_outcomes:invalid_probe_endpoint",
          classification: "runtime_degraded",
          severity: "medium",
          title: "Invalid probe endpoint URL provided to verify-outcomes",
          endpointOrRoute: String(probeEndpoint),
          checkMode: "unreachable",
          reproCommand: "node scripts/verify-outcomes.mjs",
          evidencePaths: [relTracePath],
          verifiedOutcome: `Invalid probe endpoint: ${probeEndpoint}`,
        });
      }
    } else if (baseApi) {
      urlsToCheck.push(`${baseApi}/healthz`, `${baseApi}/readyz`);
    }
    if (apiCheckUrl) {
      if (tryParseUrl(apiCheckUrl)) {
        urlsToCheck.push(apiCheckUrl);
      } else {
        hasDegraded = true;
        findings.push({
          id: nextFindingId(),
          fingerprint: "runtime_degraded|verify_outcomes:invalid_api_check_url",
          classification: "runtime_degraded",
          severity: "medium",
          title: "Invalid --api-check-url provided to verify-outcomes",
          endpointOrRoute: "/",
          checkMode: "unreachable",
          reproCommand: "node scripts/verify-outcomes.mjs",
          evidencePaths: [relTracePath],
          verifiedOutcome: `Invalid --api-check-url: ${apiCheckUrl}`,
        });
      }
    }

    for (const checkUrl of uniqueStrings(urlsToCheck)) {
      const u = tryParseUrl(checkUrl);
      if (!u) continue;
      const pathWithQuery = `${u.pathname || "/"}${u.search || ""}`;
      const res = await fetchWithTimeout(checkUrl, { method: "GET", headers }, timeoutMs);
      requests += 1;
      assertions += 1;
      endpointsChecked.push(`GET ${pathWithQuery}`);
      apiResults.push({
        url: checkUrl,
        status: res.status,
        ok: res.ok,
        parseError: res.parseError,
        error: res.error,
        echoedRequestId: res.headers["x-request-id"] || null,
      });

      const trimmedBody = (res.text || "").trim();
      const looksLikeJson =
        res.contentType.includes("json") || trimmedBody.startsWith("{") || trimmedBody.startsWith("[");

      if (res.status >= 500) {
        hasBug = true;
        findings.push({
          id: nextFindingId(),
          classification: "confirmed_bug",
          severity: "high",
          title: `Server error HTTP ${res.status} on GET ${pathWithQuery}`,
          endpointOrRoute: `GET ${pathWithQuery}`,
          checkMode: "status_gte_500",
          reproCommand: `curl -i ${checkUrl}`,
          evidencePaths: [relTracePath],
          verifiedOutcome: `Expected HTTP < 500, got HTTP ${res.status}`,
        });
      } else if (res.status === 0 || res.timedOut) {
        hasDegraded = true;
        findings.push({
          id: nextFindingId(),
          classification: "runtime_degraded",
          severity: "medium",
          title: `API endpoint unreachable during outcome check: ${pathWithQuery}`,
          endpointOrRoute: `GET ${pathWithQuery}`,
          checkMode: "unreachable",
          reproCommand: `curl -i ${checkUrl}`,
          evidencePaths: [relTracePath],
          verifiedOutcome: res.error || "Connection failed or timed out",
        });
        break;
      } else if (res.ok && res.parseError && looksLikeJson) {
        hasBug = true;
        findings.push({
          id: nextFindingId(),
          classification: "confirmed_bug",
          severity: "high",
          title: `Malformed JSON payload returned with HTTP ${res.status} on ${pathWithQuery}`,
          endpointOrRoute: `GET ${pathWithQuery}`,
          checkMode: "invalid_json_body",
          reproCommand: `curl -i ${checkUrl}`,
          evidencePaths: [relTracePath],
          verifiedOutcome: `JSON parse failed (${res.parseError}) for Content-Type ${res.contentType || "unknown"}`,
        });
      }
    }
    channels.api = apiResults;
  }

  // 2. Mailpit Channel
  if (mailpitUrl) {
    const mpParsed = tryParseUrl(mailpitUrl);
    if (!mpParsed) {
      hasDegraded = true;
      channels.mailpit = { status: "degraded", httpStatus: 0, error: `Invalid Mailpit URL: ${mailpitUrl}` };
      findings.push({
        id: nextFindingId(),
        fingerprint: "runtime_degraded|verify_outcomes:invalid_mailpit_url",
        classification: "runtime_degraded",
        severity: "medium",
        title: "Invalid Mailpit URL provided to verify-outcomes",
        endpointOrRoute: "/api/v1/messages",
        checkMode: "unreachable",
        reproCommand: "node scripts/verify-outcomes.mjs",
        evidencePaths: [relTracePath],
        verifiedOutcome: `Invalid Mailpit URL: ${mailpitUrl}`,
      });
    } else {
      const mpOrigin = mpParsed.origin;
      const mpBaseUrl = `${mpOrigin}/api/v1/messages`;
      const pageLimit = 200;
      let startOffset = 0;
      const allMessages = [];
      let mailpitError = null;
      let lastStatus = 0;
      endpointsChecked.push("GET /api/v1/messages");

      for (let page = 0; page < 10; page += 1) {
        const mpUrl = `${mpBaseUrl}?limit=${pageLimit}&start=${startOffset}`;
        const res = await fetchWithTimeout(mpUrl, { method: "GET" }, timeoutMs);
        requests += 1;
        lastStatus = res.status;
        if (!res.ok || !res.json) {
          mailpitError =
            res.error || (res.status >= 400 ? `Mailpit returned HTTP ${res.status}` : "Invalid Mailpit response");
          break;
        }
        const pageMessages = Array.isArray(res.json.messages) ? res.json.messages : [];
        allMessages.push(...pageMessages);
        const total = typeof res.json.total === "number" ? res.json.total : null;
        if (pageMessages.length === 0) break;
        if (total !== null && allMessages.length >= total) break;
        if (total === null && pageMessages.length < pageLimit) break;
        startOffset += pageMessages.length;
      }

      const marker = expectMailpitMarker || requestId;
      let matchedCount = 0;
      if (marker && allMessages.length > 0) {
        assertions += 1;
        for (const msg of allMessages) {
          const hay = [
            msg?.ID,
            msg?.MessageID,
            msg?.Subject,
            msg?.Snippet,
            ...(Array.isArray(msg?.To) ? msg.To.map((t) => t?.Address || "") : []),
          ]
            .filter(Boolean)
            .join(" ");
          if (hay.includes(marker)) {
            matchedCount += 1;
          }
        }
      }

      if (mailpitError) {
        hasDegraded = true;
        findings.push({
          id: nextFindingId(),
          fingerprint: `runtime_degraded|verify_outcomes:mailpit:${lastStatus}`,
          classification: "runtime_degraded",
          severity: "medium",
          title: `Mailpit pagination failed or degraded (HTTP ${lastStatus || 0})`,
          endpointOrRoute: "GET /api/v1/messages",
          checkMode: "unreachable",
          reproCommand: `curl -i "${mpBaseUrl}?limit=${pageLimit}&start=${startOffset}"`,
          evidencePaths: [relTracePath],
          verifiedOutcome: `Mailpit scan aborted after ${allMessages.length} message(s): ${mailpitError}`,
        });
        channels.mailpit = {
          status: "degraded",
          httpStatus: lastStatus,
          error: mailpitError,
          totalMessages: allMessages.length,
          markerChecked: marker || null,
          matchedCount,
        };
      } else {
        if (marker && allMessages.length === 0) {
          assertions += 1;
        }
        if (expectMailpitMarker && matchedCount === 0) {
          hasBug = true;
          findings.push({
            id: nextFindingId(),
            classification: "confirmed_bug",
            severity: "high",
            title: `Expected Mailpit downstream message missing for marker "${expectMailpitMarker}"`,
            endpointOrRoute: "GET /api/v1/messages",
            checkMode: "mailpit_marker",
            reproCommand: `node scripts/verify-outcomes.mjs --mailpit-url ${mpOrigin} --expect-mailpit-marker ${JSON.stringify(expectMailpitMarker)}`,
            evidencePaths: [relTracePath],
            verifiedOutcome: `Scanned ${allMessages.length} Mailpit message(s); zero matched "${expectMailpitMarker}"`,
          });
        }

        channels.mailpit = {
          status: "passed",
          totalMessages: allMessages.length,
          markerChecked: marker || null,
          matchedCount,
        };
      }
    }
  }

  // 3. Langfuse Channel
  if (langfuseUrl) {
    const lfParsed = tryParseUrl(langfuseUrl);
    if (!lfParsed) {
      hasDegraded = true;
      channels.langfuse = { status: "degraded", httpStatus: 0, error: `Invalid Langfuse URL: ${langfuseUrl}` };
      findings.push({
        id: nextFindingId(),
        fingerprint: "runtime_degraded|verify_outcomes:invalid_langfuse_url",
        classification: "runtime_degraded",
        severity: "medium",
        title: "Invalid Langfuse URL provided to verify-outcomes",
        endpointOrRoute: "/api/public/health",
        checkMode: "unreachable",
        reproCommand: "node scripts/verify-outcomes.mjs",
        evidencePaths: [relTracePath],
        verifiedOutcome: `Invalid Langfuse URL: ${langfuseUrl}`,
      });
    } else {
      const lfOrigin = lfParsed.origin;
      const lfHealthUrl = `${lfOrigin}/api/public/health`;
      const res = await fetchWithTimeout(lfHealthUrl, { method: "GET" }, timeoutMs);
      requests += 1;
      endpointsChecked.push("GET /api/public/health");
      if (res.ok) {
        assertions += 1;
        channels.langfuse = { status: "passed", httpStatus: res.status, body: res.json ?? null };
      } else {
        hasDegraded = true;
        channels.langfuse = { status: "degraded", httpStatus: res.status, error: res.error || "Langfuse unreachable" };
      }
    }
  }

  // 4. Postgres Channel
  if (pgDsn) {
    assertions += 1;
    const pgRes = await runPostgresCheck(pgDsn, pgQuery, timeoutMs);
    channels.postgres = pgRes;
    if (pgRes.status === "degraded") {
      hasDegraded = true;
      findings.push({
        id: nextFindingId(),
        fingerprint: "runtime_degraded|verify_outcomes:postgres",
        classification: "runtime_degraded",
        severity: "medium",
        title: "Postgres outcome verification query failed",
        endpointOrRoute: "postgres",
        checkMode: "unreachable",
        reproCommand: "node scripts/verify-outcomes.mjs",
        evidencePaths: [relTracePath],
        verifiedOutcome: pgRes.error || "Postgres query failed",
      });
    }
  }

  // 5. Redis Channel
  if (redisUrl) {
    assertions += 1;
    const rdRes = await runRedisCheck(redisUrl, timeoutMs);
    channels.redis = rdRes;
    if (rdRes.status === "degraded") {
      hasDegraded = true;
      findings.push({
        id: nextFindingId(),
        fingerprint: "runtime_degraded|verify_outcomes:redis",
        classification: "runtime_degraded",
        severity: "medium",
        title: "Redis outcome verification failed",
        endpointOrRoute: "redis",
        checkMode: "unreachable",
        reproCommand: "node scripts/verify-outcomes.mjs",
        evidencePaths: [relTracePath],
        verifiedOutcome: rdRes.error || "Redis check failed",
      });
    }
  }

  // 6. Docker Logs Channel
  if (dockerContainersValueless) {
    hasDegraded = true;
    findings.push({
      id: nextFindingId(),
      fingerprint: "runtime_degraded|docker_logs:missing_arg",
      classification: "runtime_degraded",
      severity: "medium",
      title: "Docker container log inspection missing container name (--docker-containers)",
      endpointOrRoute: "docker:",
      checkMode: "docker_logs",
      reproCommand: "node scripts/verify-outcomes.mjs --docker-containers <container>",
      evidencePaths: [relTracePath],
      verifiedOutcome: "Received --docker-containers without a container name value",
    });
    channels.dockerLogs = [];
  } else if (dockerContainers.length > 0) {
    const dockerResults = [];
    for (const name of dockerContainers) {
      assertions += 1;
      const dRes = await runDockerLogCheck(name, requestId, timeoutMs);
      dockerResults.push(dRes);
      if (dRes.status === "failed") {
        hasBug = true;
        findings.push({
          id: nextFindingId(),
          fingerprint: `confirmed_bug|docker_logs:${name}`,
          classification: "confirmed_bug",
          severity: "high",
          title: `Uncaught runtime exception in Docker container logs (${name})`,
          endpointOrRoute: `docker:${name}`,
          checkMode: "docker_logs",
          reproCommand: `docker logs --since 5m --tail 100 ${name}`,
          evidencePaths: [relTracePath],
          verifiedOutcome: `Detected unhandled exception signature in ${name} logs`,
        });
      } else if (dRes.status === "degraded") {
        hasDegraded = true;
        findings.push({
          id: nextFindingId(),
          fingerprint: `runtime_degraded|docker_logs:${name}`,
          classification: "runtime_degraded",
          severity: "medium",
          title: `Docker container log inspection failed (${name})`,
          endpointOrRoute: `docker:${name}`,
          checkMode: "docker_logs",
          reproCommand: `docker logs --since 5m --tail 100 ${name}`,
          evidencePaths: [relTracePath],
          verifiedOutcome: dRes.error || `Failed to inspect Docker logs for ${name}`,
        });
      }
    }
    channels.dockerLogs = dockerResults;
  }

  const status = hasBug ? "failed" : hasDegraded ? "degraded" : "passed";

  const output = {
    tool: "verify-outcomes",
    mode: "outcome_verification",
    status,
    startedAt,
    durationMs: Date.now() - startedMs,
    budgetConsumed: {
      requests,
      aiCalls: 0,
    },
    coverage: {
      routes: routesChecked,
      endpoints: uniqueStrings(endpointsChecked),
      roles: [],
      assertions,
    },
    findings,
    artifacts: {
      traces: [relTracePath],
      screenshots: [],
      regressionTests: [],
    },
    notes: `Verified outcome channels (${Object.keys(channels).join(", ") || "none"}); status=${status}, findings=${findings.length}.`,
  };

  writeJsonAtomic(tracePath, {
    ...output,
    requestId: requestId || null,
    entityId: opts.entityId || null,
    runId: opts.runId || null,
    channels,
  });

  if (opts.out) {
    writeJsonAtomic(path.resolve(process.cwd(), opts.out), output);
  }

  return sanitizeForOutput(output);
}

async function main() {
  const { values } = parseCliArgs(process.argv.slice(2), {
    booleanFlags: ["help"],
    multiFlags: ["docker-containers"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/verify-outcomes.mjs [--config <path>] [--target-url <url>] [--api-url <url>] [--mailpit-url <url>] [--langfuse-url <url>] [--pg-dsn <dsn>] [--redis-url <url>] [--request-id <id>] [--probe-endpoint <path>] [--expect-mailpit-marker <str>] [--memory-dir <dir>] [--trace-dir <dir>] [--out <file>]",
    );
    process.exit(0);
  }

  const out = await runVerifyOutcomes({
    config: values.config,
    runId: values["run-id"],
    entityId: values["entity-id"],
    targetUrl: values["target-url"],
    apiUrl: values["api-url"],
    pgDsn: values["pg-dsn"],
    pgUrl: values["pg-url"],
    pgQuery: values["pg-query"],
    redisUrl: values["redis-url"],
    mailpitUrl: values["mailpit-url"],
    dockerContainers: values["docker-containers"],
    langfuseUrl: values["langfuse-url"],
    apiCheckUrl: values["api-check-url"],
    requestId: values["request-id"],
    probeEndpoint: values["probe-endpoint"],
    expectMailpitMarker: values["expect-mailpit-marker"],
    timeoutMs: values["timeout-ms"],
    memoryDir: values["memory-dir"],
    traceDir: values["trace-dir"],
    out: values.out,
  });

  console.log(JSON.stringify(out, null, 2));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
