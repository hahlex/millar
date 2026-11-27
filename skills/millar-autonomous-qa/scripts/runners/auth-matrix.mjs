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

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function makeUniqueTag() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = crypto.randomBytes(3).toString("hex");
  return `${ts}-${process.pid}-${rand}`;
}

function buildOutput(fields) {
  return sanitizeForOutput({
    tool: "node",
    mode: "authorization",
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

function resolveRoleContext(rc) {
  const roleName = String(rc.role || rc.name || "role");
  const tenantId = String(rc.tenantId || "");
  const campusId = String(rc.campusId || "");
  const departmentId = String(rc.departmentId || "");
  const isCustomRole = Boolean(rc.isCustomRole || /^custom/i.test(roleName) || rc.customRoleKey);
  const customRoleKey = rc.customRoleKey ? String(rc.customRoleKey) : isCustomRole ? roleName : "";
  const tokenEnv = rc.tokenEnv ? String(rc.tokenEnv) : "";
  const rawToken = rc.token || (tokenEnv ? process.env[tokenEnv] : null);
  const token = rawToken ? String(rawToken).trim() : "";

  const headers = {};
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
      // ignore invalid json
    }
  }
  if (token && !Object.keys(headers).some((k) => k.toLowerCase() === "authorization")) {
    headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  const hasAuth = Object.keys(headers).length > 0;
  return {
    role: roleName,
    tenantId,
    campusId,
    departmentId,
    isCustomRole,
    customRoleKey,
    tier: String(rc.tier || (/(?:owner|admin|super)/i.test(roleName) && !/campus/i.test(roleName) ? "privileged" : "restricted")),
    tokenEnv,
    headersEnv,
    headers,
    hasAuth,
    forbiddenResponsePatterns: Array.isArray(rc.forbiddenResponsePatterns) ? rc.forbiddenResponsePatterns : [],
    forbiddenEntityIds: Array.isArray(rc.forbiddenEntityIds) ? rc.forbiddenEntityIds : [],
    allowedEndpoints: Array.isArray(rc.allowedEndpoints) ? rc.allowedEndpoints : [],
  };
}

function buildAuthMatrixReproScript(finding, { apiOrigin, method, reqPath, body, roleCtx, checkType, forbiddenPattern }) {
  const safeId = stripEmDash(String(finding.id || "QA-AUTH-001")).replace(/[\r\n]+/g, " ");
  const safeTitle = stripEmDash(String(finding.title || "Authorization Defect")).replace(/[\r\n]+/g, " ");
  const safeHeaders = {};
  for (const [k, v] of Object.entries(roleCtx.headers || {})) {
    if (/^(?:authorization|cookie|x-api-key|x-auth-token)$/i.test(k)) continue;
    safeHeaders[k] = sanitizeText(v);
  }
  return `#!/usr/bin/env node
// Reproducer for ${safeId}: ${safeTitle}
const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return fallback;
}
const baseUrl = getFlag("--api-url", getFlag("--target-url", ${JSON.stringify(apiOrigin)}));
const url = new URL(${JSON.stringify(reqPath)}, baseUrl).toString();
const method = ${JSON.stringify(method)};
const tokenEnv = getFlag("--token-env", ${JSON.stringify(roleCtx.tokenEnv || "")});
const headersEnv = getFlag("--headers-env", ${JSON.stringify(roleCtx.headersEnv || "")});
const checkType = ${JSON.stringify(checkType)};
const forbiddenPattern = ${JSON.stringify(forbiddenPattern || "")};
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
const reqBody = ${body !== undefined && body !== null ? JSON.stringify(JSON.stringify(body)) : "undefined"};
if (reqBody !== undefined) headers["Content-Type"] = "application/json";
try {
  const res = await fetch(url, { method, headers, body: reqBody, signal: AbortSignal.timeout(5000) });
  const text = await res.text();
  let stillFails = false;
  if (checkType === "semantic_leak") {
    stillFails = res.status === 200 && Boolean(forbiddenPattern) && text.toLowerCase().includes(forbiddenPattern.toLowerCase());
  } else if (checkType === "custom_role_422") {
    stillFails = res.status === 422 || res.status >= 500;
  } else if (checkType === "status_gte_500") {
    stillFails = res.status >= 500;
  } else {
    stillFails = res.status >= 200 && res.status < 300 && text.trim().length > 0;
  }
  if (stillFails) {
    console.error("STILL_REPRODUCES", ${JSON.stringify(safeId)}, "status=" + res.status, "url=" + url);
    process.exit(1);
  }
  console.log("RESOLVED", ${JSON.stringify(safeId)}, "status=" + res.status, "url=" + url);
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
    multiFlags: ["repo-path"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/runners/auth-matrix.mjs [--config <path>] --api-url <url> [--max-requests N] [--memory-dir <dir>] [--trace-dir <dir>] [--out <file>] [--dry-run]",
    );
    process.exit(0);
  }

  const cfg = values.config ? loadConfigFile(values.config) : {};
  const apiUrl = values["api-url"] ?? cfg.apiUrl ?? values["target-url"] ?? cfg.targetUrl;
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
        notes: "No --api-url provided; skipping 4-axis authorization matrix.",
      }),
      values.out,
      0,
    );
  }

  const safetyCheck = evaluateSafetyAndBudget({
    config: values.config,
    apiUrl,
    allowPrivateIp,
    budgetFile: path.join(TEST_RESULTS_DIR, `.guard-authm-${process.pid}-${Date.now()}.json`),
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
            id: "QA-AUTH-SAFETY-001",
            classification: "runtime_degraded",
            severity: "critical",
            title: "Safety guard rejected target API URL",
            reproCommand: `node scripts/safety-guard.mjs --api-url ${apiUrl}`,
            evidencePaths: [],
            verifiedOutcome: (safetyCheck.payload?.reasons || []).join("; ") || "Safety violation",
          },
        ],
        notes: "Safety guard blocked auth matrix runner.",
      }),
      values.out,
      2,
    );
  }

  const rawRoles = Array.isArray(cfg.roles) ? cfg.roles : Array.isArray(cfg.accounts) ? cfg.accounts : [];
  const roles = rawRoles.filter((r) => r && typeof r === "object").map(resolveRoleContext).filter((r) => r.hasAuth);
  if (dryRun || roles.length === 0) {
    emitAndExit(
      buildOutput({
        status: "skipped_non_applicable",
        startedAt,
        startedMs,
        notes: dryRun
          ? "Dry run enabled; skipped 4-axis authorization matrix."
          : "No authenticated roles configured; skipped 4-axis authorization matrix.",
      }),
      values.out,
      0,
    );
  }

  ensureDir(traceDir);
  ensureDir(regDir);
  const uniqueTag = makeUniqueTag();
  const tracePath = path.join(traceDir, `auth-matrix-${uniqueTag}.json`);
  const relTracePath = toStagingRelPath(tracePath);
  const apiOrigin = new URL(apiUrl).origin;

  const obsRes = readJsonSafe(path.join(traceDir, "observed-api-traffic.json"));
  const observedRecords = Array.isArray(obsRes.data?.records) ? obsRes.data.records : [];

  const findings = [];
  const regressionTests = [];
  const endpointsCovered = [];
  const rolesCovered = [];
  const traceRecords = [];
  const seenFps = new Set();
  let requestsUsed = 0;
  let assertions = 0;
  const softDeadlineMs = startedMs + 28000;

  const recordFinding = ({
    fp,
    severity,
    title,
    endpointOrRoute,
    checkMode,
    verifiedOutcome,
    method,
    reqPath,
    body,
    roleCtx,
    checkType,
    forbiddenPattern,
  }) => {
    if (seenFps.has(fp)) return;
    seenFps.add(fp);
    const finding = {
      id: `QA-AUTH-${String(findings.length + 1).padStart(3, "0")}`,
      fingerprint: fp,
      classification: "confirmed_bug",
      severity,
      title,
      endpointOrRoute,
      checkMode,
      role: roleCtx.role,
      authRequired: true,
      ...(roleCtx.tokenEnv ? { tokenEnv: roleCtx.tokenEnv } : {}),
      ...(roleCtx.headersEnv ? { headersEnv: roleCtx.headersEnv } : {}),
      reproCommand: `curl -i -X ${method} ${new URL(reqPath, apiOrigin).toString()}`,
      evidencePaths: [relTracePath],
      verifiedOutcome: sanitizeText(verifiedOutcome),
    };
    const regAbs = path.join(regDir, `auth-${slugify(finding.id, 14)}-${uniqueTag}.mjs`);
    writeTextAtomic(
      regAbs,
      buildAuthMatrixReproScript(finding, {
        apiOrigin,
        method,
        reqPath,
        body,
        roleCtx,
        checkType,
        forbiddenPattern,
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
    findings.push(finding);
  };

  const canSend = () => requestsUsed < maxRequests && Date.now() < softDeadlineMs;

  const sendProbe = async (roleCtx, method, reqPath, body = undefined) => {
    requestsUsed += 1;
    assertions += 1;
    rolesCovered.push(roleCtx.role);
    endpointsCovered.push(`${method} ${reqPath.split("?")[0]}`);
    const url = new URL(reqPath, apiOrigin).toString();
    const hdrs = { ...roleCtx.headers };
    if (body !== undefined) hdrs["Content-Type"] = "application/json";
    return fetchWithTimeout(
      url,
      {
        method,
        headers: hdrs,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      4000,
    );
  };

  // --- AXIS 1: Cross-Tenant BOLA (Tenant A entities replayed with Tenant B credentials) ---
  const rolesByTenant = new Map();
  for (const r of roles) {
    if (r.tenantId && !rolesByTenant.has(r.tenantId)) rolesByTenant.set(r.tenantId, r);
  }
  const crossTenantProbes = Array.isArray(cfg.authMatrix?.crossTenantProbes) ? cfg.authMatrix.crossTenantProbes : [];
  if (rolesByTenant.size >= 2) {
    const tenantEntries = Array.from(rolesByTenant.entries());
    // Auto-harvest entity URLs with UUIDs from observed GET 200 traffic per tenant
    for (const rec of observedRecords) {
      if (!canSend()) break;
      if (rec.method !== "GET" || rec.status !== 200 || !rec.tenantId || !UUID_RE.test(rec.pathname)) continue;
      const otherTenant = tenantEntries.find(([tid]) => tid !== rec.tenantId);
      if (!otherTenant) continue;
      const [otherTid, attackerRole] = otherTenant;
      const reqPath = `${rec.pathname}${rec.search || ""}`;
      const res = await sendProbe(attackerRole, "GET", reqPath);
      traceRecords.push({ axis: 1, probe: "observed_cross_tenant", sourceTenant: rec.tenantId, attackerRole: attackerRole.role, attackerTenant: otherTid, path: reqPath, status: res.status });
      if (res.status >= 500) {
        recordFinding({
          fp: `confirmed_bug|auth_axis1_500:${attackerRole.role}:GET ${rec.pathname}`,
          severity: "high",
          title: `Cross-tenant replay caused HTTP ${res.status} on GET ${rec.pathname}`,
          endpointOrRoute: `GET ${rec.pathname}`,
          checkMode: "status_gte_500",
          verifiedOutcome: `Tenant ${otherTid} (${attackerRole.role}) replayed tenant ${rec.tenantId} URL ${reqPath} and received HTTP ${res.status}`,
          method: "GET",
          reqPath,
          roleCtx: attackerRole,
          checkType: "status_gte_500",
        });
      } else if (res.status === 200 && (res.text || "").trim().length > 2) {
        recordFinding({
          fp: `confirmed_bug|auth_axis1_bola:${attackerRole.role}:GET ${rec.pathname}`,
          severity: "critical",
          title: `Cross-tenant BOLA leak: ${attackerRole.role} (tenant=${otherTid}) accessed tenant=${rec.tenantId} resource GET ${rec.pathname}`,
          endpointOrRoute: `GET ${rec.pathname}`,
          checkMode: "unauth_protected_200",
          verifiedOutcome: `Expected 403/404 for cross-tenant GET ${reqPath} by tenant=${otherTid}, got HTTP 200`,
          method: "GET",
          reqPath,
          roleCtx: attackerRole,
          checkType: "bola_200",
        });
      }
    }
  }
  for (const probe of crossTenantProbes) {
    if (!canSend() || !probe?.path || !probe?.attackerRole) continue;
    const attacker = roles.find((r) => r.role === probe.attackerRole);
    if (!attacker) continue;
    const method = String(probe.method || "GET").toUpperCase();
    const res = await sendProbe(attacker, method, probe.path, probe.body);
    traceRecords.push({ axis: 1, probe: "configured_cross_tenant", attackerRole: attacker.role, method, path: probe.path, status: res.status });
    if (res.status >= 200 && res.status < 300) {
      recordFinding({
        fp: `confirmed_bug|auth_axis1_cfg:${attacker.role}:${method} ${probe.path}`,
        severity: "critical",
        title: `Cross-tenant BOLA bypass on ${method} ${probe.path} as ${attacker.role}`,
        endpointOrRoute: `${method} ${probe.path}`,
        checkMode: "unauth_protected_200",
        verifiedOutcome: `Expected 403/404 for cross-tenant probe ${method} ${probe.path} by ${attacker.role}, got HTTP ${res.status}`,
        method,
        reqPath: probe.path,
        body: probe.body,
        roleCtx: attacker,
        checkType: "bola_200",
      });
    }
  }

  // --- AXIS 2: Cross-Campus / Sub-Tenant BOLA Read & Write ---
  const crossCampusProbes = Array.isArray(cfg.authMatrix?.crossCampusProbes) ? cfg.authMatrix.crossCampusProbes : [];
  const campusRoles = roles.filter((r) => r.campusId);
  if (campusRoles.length >= 2) {
    for (const rec of observedRecords) {
      if (!canSend()) break;
      if (rec.method !== "GET" || rec.status !== 200 || !rec.campusId || !UUID_RE.test(rec.pathname)) continue;
      const otherCampusRole = campusRoles.find((r) => r.tenantId === rec.tenantId && r.campusId !== rec.campusId);
      if (!otherCampusRole) continue;
      const reqPath = `${rec.pathname}${rec.search || ""}`;
      const res = await sendProbe(otherCampusRole, "GET", reqPath);
      traceRecords.push({ axis: 2, probe: "observed_cross_campus", sourceCampus: rec.campusId, attackerRole: otherCampusRole.role, attackerCampus: otherCampusRole.campusId, path: reqPath, status: res.status });
      if (res.status === 200 && (res.text || "").trim().length > 2) {
        recordFinding({
          fp: `confirmed_bug|auth_axis2_campus_bola:${otherCampusRole.role}:GET ${rec.pathname}`,
          severity: "critical",
          title: `Cross-campus BOLA leak: ${otherCampusRole.role} (campus=${otherCampusRole.campusId}) accessed campus=${rec.campusId} resource GET ${rec.pathname}`,
          endpointOrRoute: `GET ${rec.pathname}`,
          checkMode: "unauth_protected_200",
          verifiedOutcome: `Expected 403/404 for cross-campus GET ${reqPath}, got HTTP 200`,
          method: "GET",
          reqPath,
          roleCtx: otherCampusRole,
          checkType: "bola_200",
        });
      }
    }
  }
  for (const probe of crossCampusProbes) {
    if (!canSend() || !probe?.path || !probe?.attackerRole) continue;
    const attacker = roles.find((r) => r.role === probe.attackerRole);
    if (!attacker) continue;
    const method = String(probe.method || "GET").toUpperCase();
    const res = await sendProbe(attacker, method, probe.path, probe.body);
    traceRecords.push({ axis: 2, probe: "configured_cross_campus", attackerRole: attacker.role, method, path: probe.path, status: res.status });
    if (res.status >= 200 && res.status < 300) {
      recordFinding({
        fp: `confirmed_bug|auth_axis2_cfg:${attacker.role}:${method} ${probe.path}`,
        severity: "critical",
        title: `Cross-campus ${method} BOLA bypass on ${probe.path} as ${attacker.role}`,
        endpointOrRoute: `${method} ${probe.path}`,
        checkMode: "unauth_protected_200",
        verifiedOutcome: `Expected 403/404 for cross-campus ${method} ${probe.path} by ${attacker.role} (campus=${attacker.campusId || "scoped"}), got HTTP ${res.status}`,
        method,
        reqPath: probe.path,
        body: probe.body,
        roleCtx: attacker,
        checkType: "bola_200",
      });
    }
  }

  // --- AXIS 3: Vertical & Custom Roles (ALL roles, zero [:3] cap + custom role filter parity) ---
  const privilegedPaths = uniqueStrings([
    ...(Array.isArray(cfg.authMatrix?.privilegedPaths) ? cfg.authMatrix.privilegedPaths : []),
    ...observedRecords
      .filter((r) => r.method === "GET" && r.status === 200 && /(?:payroll|platform|finance\/overview|reports\/enrollment|audit|settings)/i.test(r.pathname))
      .map((r) => r.pathname),
  ]).slice(0, 6);

  const restrictedRoles = roles.filter(
    (r) => r.tier === "restricted" || r.isCustomRole || /^(?:student|guardian|teacher|viewer|custom)/i.test(r.role),
  );
  for (const lr of restrictedRoles) {
    for (const gp of privilegedPaths) {
      if (!canSend()) break;
      if (lr.allowedEndpoints.some((allow) => gp.includes(allow))) continue;
      if (lr.role === "viewer" && /finance|reports/i.test(gp)) continue;
      const res = await sendProbe(lr, "GET", gp);
      traceRecords.push({ axis: 3, probe: "vertical_rbac", role: lr.role, path: gp, status: res.status });
      if (res.status >= 500) {
        recordFinding({
          fp: `confirmed_bug|auth_axis3_500:${lr.role}:GET ${gp}`,
          severity: "high",
          title: `Vertical RBAC probe triggered HTTP ${res.status} for ${lr.role} on GET ${gp}`,
          endpointOrRoute: `GET ${gp}`,
          checkMode: "status_gte_500",
          verifiedOutcome: `GET ${gp} as role=${lr.role} returned HTTP ${res.status}`,
          method: "GET",
          reqPath: gp,
          roleCtx: lr,
          checkType: "status_gte_500",
        });
      } else if (
        /^(?:student|guardian)/i.test(lr.role) &&
        res.status === 200 &&
        (res.text || "").trim().length > 2
      ) {
        recordFinding({
          fp: `confirmed_bug|auth_axis3_esc:${lr.role}:GET ${gp}`,
          severity: "critical",
          title: `Privilege escalation: ${lr.role} accessed privileged endpoint GET ${gp} with HTTP 200`,
          endpointOrRoute: `GET ${gp}`,
          checkMode: "unauth_protected_200",
          verifiedOutcome: `Expected 401/403 for ${lr.role} on ${gp}, got HTTP 200`,
          method: "GET",
          reqPath: gp,
          roleCtx: lr,
          checkType: "bola_200",
        });
      }
    }

    // Custom role filter parity check (catches 422 PATTERN_MISMATCH on ?role=custom_...)
    const customFilterPath = cfg.authMatrix?.customRoleFilterPath;
    if (lr.isCustomRole && lr.customRoleKey && customFilterPath && canSend()) {
      const ownerRole = roles.find((r) => r.tier === "privileged") || lr;
      const sep = customFilterPath.includes("?") ? "&" : "?";
      const reqPath = `${customFilterPath}${sep}role=${encodeURIComponent(lr.customRoleKey)}`;
      const res = await sendProbe(ownerRole, "GET", reqPath);
      traceRecords.push({ axis: 3, probe: "custom_role_filter_parity", customRoleKey: lr.customRoleKey, path: reqPath, status: res.status });
      if (res.status === 422 || res.status >= 500) {
        recordFinding({
          fp: `confirmed_bug|auth_axis3_custom_filter:${lr.customRoleKey}:${res.status}`,
          severity: "high",
          title: `Custom role key "${lr.customRoleKey}" rejected with HTTP ${res.status} on ${customFilterPath}`,
          endpointOrRoute: `GET ${customFilterPath}`,
          checkMode: "custom_role_422",
          verifiedOutcome: `GET ${reqPath} returned HTTP ${res.status}: ${sanitizeText((res.text || "").slice(0, 220))}`,
          method: "GET",
          reqPath,
          roleCtx: ownerRole,
          checkType: "custom_role_422",
        });
      }
    }
  }

  // --- AXIS 4: Semantic Body Leak Diffing (even when HTTP status is 200) ---
  const semanticProbes = Array.isArray(cfg.authMatrix?.semanticLeakProbes) ? cfg.authMatrix.semanticLeakProbes : [];
  for (const sp of semanticProbes) {
    if (!canSend() || !sp?.path || !sp?.role) continue;
    const roleCtx = roles.find((r) => r.role === sp.role);
    if (!roleCtx) continue;
    const patterns = uniqueStrings([
      ...(Array.isArray(sp.forbiddenPatterns) ? sp.forbiddenPatterns : []),
      ...roleCtx.forbiddenResponsePatterns,
      ...roleCtx.forbiddenEntityIds,
    ]);
    if (patterns.length === 0) continue;
    const res = await sendProbe(roleCtx, String(sp.method || "GET").toUpperCase(), sp.path);
    const bodyText = String(res.text || "");
    const lowerBody = bodyText.toLowerCase();
    const matched = res.status === 200 ? patterns.filter((pat) => lowerBody.includes(String(pat).toLowerCase())) : [];
    traceRecords.push({ axis: 4, probe: "semantic_body_leak", role: roleCtx.role, path: sp.path, status: res.status, matched });
    for (const hit of matched) {
      recordFinding({
        fp: `confirmed_bug|auth_axis4_leak:${roleCtx.role}:${sp.path}:${hit}`,
        severity: "high",
        title: `Semantic data leak: HTTP 200 on ${sp.path} exposed forbidden token "${hit}" to role=${roleCtx.role}`,
        endpointOrRoute: `${String(sp.method || "GET").toUpperCase()} ${sp.path}`,
        checkMode: "semantic_leak",
        verifiedOutcome: `GET ${sp.path} as role=${roleCtx.role} returned HTTP 200 containing forbidden pattern/entity "${hit}"`,
        method: String(sp.method || "GET").toUpperCase(),
        reqPath: sp.path,
        roleCtx,
        checkType: "semantic_leak",
        forbiddenPattern: hit,
      });
    }
  }

  // Also run semantic leak checks passively against observed records if a role configured forbiddenResponsePatterns/forbiddenEntityIds
  for (const r of roles) {
    const pats = uniqueStrings([...r.forbiddenResponsePatterns, ...r.forbiddenEntityIds]);
    if (pats.length === 0) continue;
    for (const rec of observedRecords) {
      if (rec.role !== r.role || rec.status !== 200 || !rec.responseSample) continue;
      const sampleStr = JSON.stringify(rec.responseSample).toLowerCase();
      for (const hit of pats) {
        if (sampleStr.includes(String(hit).toLowerCase())) {
          recordFinding({
            fp: `confirmed_bug|auth_axis4_obs:${r.role}:${rec.pathname}:${hit}`,
            severity: "high",
            title: `Observed semantic leak: ${rec.method} ${rec.pathname} exposed forbidden "${hit}" to role=${r.role}`,
            endpointOrRoute: `${rec.method} ${rec.pathname}`,
            checkMode: "semantic_leak",
            verifiedOutcome: `Observed HTTP 200 response for role=${r.role} on ${rec.pathname} contained forbidden token "${hit}"`,
            method: rec.method,
            reqPath: `${rec.pathname}${rec.search || ""}`,
            roleCtx: r,
            checkType: "semantic_leak",
            forbiddenPattern: hit,
          });
        }
      }
    }
  }

  const status = findings.some((f) => f.classification === "confirmed_bug") ? "failed" : assertions === 0 ? "skipped_non_applicable" : "passed";
  const output = buildOutput({
    status,
    startedAt,
    startedMs,
    requests: requestsUsed,
    endpoints: endpointsCovered,
    roles: rolesCovered.length > 0 ? rolesCovered : roles.map((r) => r.role),
    assertions,
    findings,
    traces: [relTracePath],
    regressionTests,
    notes: `Executed 4-axis differential authorization matrix across ${roles.length} role(s) (${requestsUsed} probe(s), ${assertions} assertion(s), ${findings.length} finding(s)).`,
  });

  writeJsonAtomic(tracePath, {
    ...output,
    apiOrigin,
    rolesEvaluated: roles.map((r) => ({ role: r.role, tenantId: r.tenantId, campusId: r.campusId, isCustomRole: r.isCustomRole })),
    records: traceRecords,
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
