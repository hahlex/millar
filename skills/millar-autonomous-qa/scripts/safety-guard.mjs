#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadConfigFile,
  MEMORY_DIR,
  parseCliArgs,
  parseNonNegativeNumber,
  readJsonSafe,
  redactSecrets,
  sanitizeForOutput,
  STAGING_ROOT,
  writeJsonAtomic,
} from "./lib/common.mjs";

const DEFAULT_MAX_MINUTES = 30;
const DEFAULT_MAX_REQUESTS = 500;
const DEFAULT_MAX_AI_CALLS = 20;

const PROD_HOST_PATTERNS = [
  /(^|\.)hahlex\.com$/i,
  /(^|\.)(prod|production)(\.|$)/i,
  /[-.](prod|production)([-.]|$)/i,
];

function isPrivateIpv4(hostname) {
  const m = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const octets = m.slice(1).map(Number);
  if (octets.some((o) => o < 0 || o > 255)) return false;
  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isLoopbackHost(hostname) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "::1" || h === "[::1]") return true;
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

function checkUrlSafety(label, rawUrl, allowPrivateIp) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: `${label} is not a valid URL: ${redactSecrets(rawUrl)}` };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: `${label} must use http or https protocol: ${parsed.protocol}` };
  }

  const host = parsed.hostname.toLowerCase();
  for (const pat of PROD_HOST_PATTERNS) {
    if (pat.test(host)) {
      return { valid: true, reason: `${label} hostname "${host}" matches blocked production pattern` };
    }
  }

  if (isLoopbackHost(host)) {
    return { valid: true, reason: null, parsedUrl: parsed.toString() };
  }

  if (allowPrivateIp && isPrivateIpv4(host)) {
    return { valid: true, reason: null, parsedUrl: parsed.toString() };
  }

  if (isPrivateIpv4(host)) {
    return {
      valid: true,
      reason: `${label} hostname "${host}" is a private LAN IP; pass --allow-private-ip only for verified non-prod targets`,
    };
  }

  return {
    valid: true,
    reason: `${label} hostname "${host}" is not a local loopback non-production host`,
  };
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

function resolvePathWithSearchDirs(rawPath, searchDirs = [process.cwd(), STAGING_ROOT]) {
  if (!rawPath) return "";
  if (path.isAbsolute(rawPath)) return rawPath;
  for (const dir of searchDirs) {
    if (!dir) continue;
    const cand = path.resolve(dir, rawPath);
    if (fs.existsSync(cand)) return cand;
  }
  const primary = searchDirs.find(Boolean) || process.cwd();
  return path.resolve(primary, rawPath);
}

function inspectEnvFile(envFilePath, allowPrivateIp, searchDirs = [process.cwd(), STAGING_ROOT]) {
  const abs = resolvePathWithSearchDirs(envFilePath, searchDirs);
  if (!fs.existsSync(abs)) {
    return { reasons: [`Env file not found: ${envFilePath}`], foundExplicitNonProd: false };
  }
  const reasons = [];
  let foundExplicitNonProd = false;
  const lines = fs.readFileSync(abs, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["'](.*)["']$/, "$1");

    if (["NODE_ENV", "APP_ENV", "ENVIRONMENT", "RAILS_ENV", "NEXT_PUBLIC_ENV"].includes(key)) {
      if (/^(prod|production)$/i.test(val)) {
        reasons.push(`Env file ${envFilePath} declares ${key}=${val}`);
      } else if (val.length > 0) {
        foundExplicitNonProd = true;
      }
    }

    if (["DATABASE_URL", "REDIS_URL", "KEYCLOAK_ISSUER"].includes(key) && val) {
      try {
        const u = new URL(val);
        const h = u.hostname.toLowerCase();
        const hostOk = isLoopbackHost(h) || (allowPrivateIp && isPrivateIpv4(h));
        const prodMatch = PROD_HOST_PATTERNS.some((p) => p.test(h));
        if (prodMatch || !hostOk) {
          reasons.push(`Env file ${envFilePath} ${key} points to non-local host "${h}"`);
        }
      } catch {
        // Ignore non-URL formatted env entries
      }
    }
  }
  return { reasons, foundExplicitNonProd };
}

export function evaluateSafetyAndBudget(opts = {}) {
  const resolvedConfigPath = resolveConfigPath(opts.config);
  const cfg = resolvedConfigPath ? loadConfigFile(resolvedConfigPath) : {};
  const configDir = resolvedConfigPath ? path.dirname(resolvedConfigPath) : null;
  const allowPrivateIp = Boolean(opts.allowPrivateIp ?? cfg.allowPrivateIp ?? false);
  const requireNonprodEnv = Boolean(opts.requireNonprodEnv ?? false);
  const resetBudget = Boolean(opts.reset ?? opts.resetBudget ?? false);
  const ignoreAiCap = Boolean(opts.ignoreAiCap ?? false);
  const dryRun = Boolean(opts.dryRun ?? false);

  const budgetFile = path.resolve(opts.budgetFile || path.join(MEMORY_DIR, "run-budget.json"));

  const targets = {};
  const candidateTargets = {
    targetUrl: opts.targetUrl ?? cfg.targetUrl,
    apiUrl: opts.apiUrl ?? cfg.apiUrl,
    aiUrl: opts.aiUrl ?? cfg.aiUrl,
    mailpitUrl: opts.mailpitUrl ?? cfg.mailpitUrl,
    langfuseUrl: opts.langfuseUrl ?? cfg.langfuseUrl,
    oidcUrl: opts.oidcUrl ?? cfg.oidcUrl,
    openapiUrl: opts.openapiUrl ?? cfg.openapiUrl,
  };
  for (const [k, v] of Object.entries(candidateTargets)) {
    if (typeof v === "string" && v.trim().length > 0) {
      targets[k] = v.trim();
    }
  }

  let maxMinutesOverride;
  let maxRequestsOverride;
  let maxAiCallsOverride;
  let consumeRequests = 0;
  let consumeAiCalls = 0;

  try {
    if (opts.maxMinutes !== undefined) {
      maxMinutesOverride = parseNonNegativeNumber(opts.maxMinutes, DEFAULT_MAX_MINUTES, "--max-minutes");
    } else if (cfg.maxMinutes !== undefined || cfg.limits?.maxMinutes !== undefined) {
      maxMinutesOverride = parseNonNegativeNumber(
        cfg.maxMinutes ?? cfg.limits?.maxMinutes,
        DEFAULT_MAX_MINUTES,
        "config.maxMinutes",
      );
    }

    if (opts.maxRequests !== undefined) {
      maxRequestsOverride = parseNonNegativeNumber(opts.maxRequests, DEFAULT_MAX_REQUESTS, "--max-requests");
    } else if (cfg.maxRequests !== undefined || cfg.limits?.maxRequests !== undefined) {
      maxRequestsOverride = parseNonNegativeNumber(
        cfg.maxRequests ?? cfg.limits?.maxRequests,
        DEFAULT_MAX_REQUESTS,
        "config.maxRequests",
      );
    }

    if (opts.maxAiCalls !== undefined) {
      maxAiCallsOverride = parseNonNegativeNumber(opts.maxAiCalls, DEFAULT_MAX_AI_CALLS, "--max-ai-calls");
    } else if (cfg.maxAiCalls !== undefined || cfg.limits?.maxAiCalls !== undefined) {
      maxAiCallsOverride = parseNonNegativeNumber(
        cfg.maxAiCalls ?? cfg.limits?.maxAiCalls,
        DEFAULT_MAX_AI_CALLS,
        "config.maxAiCalls",
      );
    }

    consumeRequests = parseNonNegativeNumber(opts.consumeRequests, 0, "--consume-requests");
    consumeAiCalls = parseNonNegativeNumber(opts.consumeAiCalls ?? opts.consumeAi, 0, "--consume-ai-calls");
  } catch (err) {
    return {
      exitCode: 2,
      payload: {
        safe: false,
        allowed: false,
        ok: false,
        status: "invalid_input",
        targets,
        reasons: [err instanceof Error ? err.message : String(err)],
        budget: null,
      },
    };
  }

  const safetyReasons = [];
  let hasInvalidUrl = false;

  if (Object.keys(targets).length === 0) {
    hasInvalidUrl = true;
    safetyReasons.push("At least one target URL (--target-url, --api-url, or --config) is required");
  }

  for (const [label, urlVal] of Object.entries(targets)) {
    const chk = checkUrlSafety(label, urlVal, allowPrivateIp);
    if (!chk.valid) hasInvalidUrl = true;
    if (chk.reason) safetyReasons.push(chk.reason);
  }

  const envVarsToCheck = ["NODE_ENV", "APP_ENV", "ENVIRONMENT", "RAILS_ENV", "NEXT_PUBLIC_ENV"];
  let foundExplicitNonProd = false;
  for (const envName of envVarsToCheck) {
    const val = process.env[envName];
    if (!val) continue;
    if (/^(prod|production)$/i.test(val.trim())) {
      safetyReasons.push(`Environment variable ${envName}=${val} indicates production`);
    } else {
      foundExplicitNonProd = true;
    }
  }

  const hasCliEnvFiles = Array.isArray(opts.envFiles);
  const envFiles = hasCliEnvFiles
    ? opts.envFiles
    : Array.isArray(cfg.envFiles)
      ? cfg.envFiles
      : [];
  const envSearchDirs = hasCliEnvFiles
    ? [process.cwd(), configDir, STAGING_ROOT]
    : [configDir, process.cwd(), STAGING_ROOT];
  for (const ef of envFiles) {
    const efRes = inspectEnvFile(ef, allowPrivateIp, envSearchDirs);
    safetyReasons.push(...efRes.reasons);
    if (efRes.foundExplicitNonProd) foundExplicitNonProd = true;
  }

  if (requireNonprodEnv && !foundExplicitNonProd) {
    safetyReasons.push("Missing explicit non-prod environment variable (NODE_ENV/APP_ENV/ENVIRONMENT or --env-file)");
  }

  if (safetyReasons.length > 0) {
    return {
      exitCode: 2,
      payload: sanitizeForOutput({
        safe: false,
        allowed: false,
        ok: false,
        status: hasInvalidUrl ? "invalid_input" : "safety_violation",
        targets,
        reasons: safetyReasons,
        budget: null,
      }),
    };
  }

  const nowIso = new Date().toISOString();
  const existing = resetBudget ? { exists: false, data: null } : readJsonSafe(budgetFile);
  const existingData =
    existing.exists && existing.data && typeof existing.data === "object" ? existing.data : null;

  const budget = {
    startTime:
      existingData && typeof existingData.startTime === "string" && !Number.isNaN(Date.parse(existingData.startTime))
        ? existingData.startTime
        : nowIso,
    maxMinutes:
      maxMinutesOverride ??
      (typeof existingData?.maxMinutes === "number" && existingData.maxMinutes >= 0
        ? existingData.maxMinutes
        : DEFAULT_MAX_MINUTES),
    maxRequests:
      maxRequestsOverride ??
      (typeof existingData?.maxRequests === "number" && existingData.maxRequests >= 0
        ? existingData.maxRequests
        : DEFAULT_MAX_REQUESTS),
    maxAiCalls:
      maxAiCallsOverride ??
      (typeof existingData?.maxAiCalls === "number" && existingData.maxAiCalls >= 0
        ? existingData.maxAiCalls
        : DEFAULT_MAX_AI_CALLS),
    requestsUsed:
      (typeof existingData?.requestsUsed === "number" && existingData.requestsUsed >= 0
        ? existingData.requestsUsed
        : 0) + consumeRequests,
    aiCallsUsed:
      (typeof existingData?.aiCallsUsed === "number" && existingData.aiCallsUsed >= 0
        ? existingData.aiCallsUsed
        : 0) + consumeAiCalls,
    status: "active",
  };

  const budgetReasons = [];
  const elapsedMinutes = (Date.now() - Date.parse(budget.startTime)) / 60000;
  if (budget.maxMinutes === 0 || elapsedMinutes > budget.maxMinutes) {
    budgetReasons.push(
      `Runtime budget exceeded: elapsed ${elapsedMinutes.toFixed(2)}m > maxMinutes ${budget.maxMinutes}m`,
    );
  }
  if (budget.requestsUsed >= budget.maxRequests) {
    budgetReasons.push(
      `Request budget exhausted: requestsUsed ${budget.requestsUsed} >= maxRequests ${budget.maxRequests}`,
    );
  }
  if (!ignoreAiCap) {
    if (budget.maxAiCalls === 0 && budget.aiCallsUsed > 0) {
      budgetReasons.push(
        `AI call budget disabled (maxAiCalls=0) but aiCallsUsed=${budget.aiCallsUsed}`,
      );
    } else if (budget.maxAiCalls > 0 && budget.aiCallsUsed >= budget.maxAiCalls) {
      budgetReasons.push(
        `AI call budget exhausted: aiCallsUsed ${budget.aiCallsUsed} >= maxAiCalls ${budget.maxAiCalls}`,
      );
    }
  }

  budget.status = budgetReasons.length > 0 ? "budget_exceeded" : "ok";
  if (!dryRun) {
    writeJsonAtomic(budgetFile, budget);
  }

  if (budgetReasons.length > 0) {
    return {
      exitCode: 3,
      payload: sanitizeForOutput({
        safe: true,
        allowed: false,
        ok: false,
        status: "budget_exceeded",
        targets,
        reasons: budgetReasons,
        budget,
      }),
    };
  }

  return {
    exitCode: 0,
    payload: sanitizeForOutput({
      safe: true,
      allowed: true,
      ok: true,
      status: "ok",
      targets,
      reasons: [],
      budget,
    }),
  };
}

function main() {
  const { values } = parseCliArgs(process.argv.slice(2), {
    booleanFlags: [
      "check-budget",
      "require-nonprod-env",
      "reset",
      "reset-budget",
      "allow-private-ip",
      "ignore-ai-cap",
      "dry-run",
      "help",
    ],
    multiFlags: ["env-file"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/safety-guard.mjs [--config <path>] --target-url <url> [--api-url <url>] [--max-minutes N] [--max-requests N] [--max-ai-calls N] [--reset-budget] [--require-nonprod-env] [--dry-run]",
    );
    process.exit(0);
  }

  let result;
  try {
    result = evaluateSafetyAndBudget({
      config: values.config,
      targetUrl: values["target-url"],
      apiUrl: values["api-url"],
      aiUrl: values["ai-url"],
      mailpitUrl: values["mailpit-url"],
      langfuseUrl: values["langfuse-url"],
      oidcUrl: values["oidc-url"],
      openapiUrl: values["openapi-url"],
      maxMinutes: values["max-minutes"],
      maxRequests: values["max-requests"],
      maxAiCalls: values["max-ai-calls"],
      consumeRequests: values["consume-requests"],
      consumeAiCalls: values["consume-ai-calls"] ?? values["consume-ai"],
      requireNonprodEnv: Boolean(values["require-nonprod-env"]),
      budgetFile: values["budget-file"],
      reset: Boolean(values.reset || values["reset-budget"]),
      allowPrivateIp: values["allow-private-ip"],
      envFiles: values["env-file"],
      ignoreAiCap: Boolean(values["ignore-ai-cap"]),
      dryRun: Boolean(values["dry-run"]),
    });
  } catch (err) {
    result = {
      exitCode: 2,
      payload: {
        safe: false,
        allowed: false,
        ok: false,
        status: "invalid_input",
        targets: {},
        reasons: [err instanceof Error ? err.message : String(err)],
        budget: null,
      },
    };
  }

  const sanitizedPayload = sanitizeForOutput(result.payload);
  if (values.out) {
    writeJsonAtomic(path.resolve(process.cwd(), values.out), sanitizedPayload);
  }
  console.log(JSON.stringify(sanitizedPayload, null, 2));
  process.exit(result.exitCode);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
