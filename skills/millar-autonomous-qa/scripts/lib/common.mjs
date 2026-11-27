import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const STAGING_ROOT = path.resolve(import.meta.dirname, "../..");
export const SCRIPTS_DIR = path.join(STAGING_ROOT, "scripts");
export const RUNNERS_DIR = path.join(SCRIPTS_DIR, "runners");
export const MEMORY_DIR = path.join(STAGING_ROOT, "memory");
export const REFERENCES_DIR = path.join(STAGING_ROOT, "references");
export const REPORTS_DIR = path.join(STAGING_ROOT, "reports");
export const TEST_RESULTS_DIR = path.join(STAGING_ROOT, "test-results");

export const EM_DASH = "\u2014";

export function stripEmDash(text) {
  return String(text ?? "").replaceAll(EM_DASH, " -- ");
}

export function redactSecrets(text) {
  let out = String(text ?? "");
  out = out.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]");
  out = out.replace(/\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/g, "[REDACTED_JWT]");
  out = out.replace(
    /\b(https?|postgres(?:ql)?|redis|rediss|mysql|mongodb|amqp):\/\/([^:@/\s]*):([^@/\s]+)@/gi,
    "$1://$2:[REDACTED]@",
  );
  out = out.replace(
    /\b(x-api-key|x-auth-token|cookie|set-cookie|authorization)\s*:\s*(["'])([^"'\r\n]+)\2(?!\s*\+)/gi,
    "$1: $2[REDACTED]$2",
  );
  out = out.replace(
    /\b(x-api-key|x-auth-token|cookie|set-cookie|authorization)\s*:\s*([^\s"'][^\r\n"']*)/gi,
    "$1: [REDACTED]",
  );
  out = out.replace(
    /(["'](?:password|passwd|secret|api_?key|client_?secret|access_?token|refresh_?token|auth_?token|id_?token|token|cookie|set-cookie|authorization|x-api-key|x-auth-token)["']\s*:\s*)(["'])([^"'\r\n]+)\2(?!\s*\+)/gi,
    "$1$2[REDACTED]$2",
  );
  out = out.replace(
    /(\\"(?:password|passwd|secret|api_?key|client_?secret|access_?token|refresh_?token|auth_?token|id_?token|token|cookie|set-cookie|authorization|x-api-key|x-auth-token)\\"\s*:\s*\\")([^"\\]+)(\\")/gi,
    "$1[REDACTED]$3",
  );
  out = out.replace(
    /([?&]|\b)(password|passwd|secret|api_?key|client_?secret|access_?token|refresh_?token|auth_?token|id_?token|token|x-api-key|x-auth-token|cookie|set-cookie|authorization)=([^\s"',;&`]+)/gi,
    "$1$2=[REDACTED]",
  );
  return out;
}

export function sanitizeText(text) {
  return stripEmDash(redactSecrets(text));
}

export function sanitizeForOutput(value) {
  if (typeof value === "string") {
    return sanitizeText(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForOutput(item));
  }
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeForOutput(v);
    }
    return out;
  }
  return value;
}

export function escapeHtml(value) {
  return stripEmDash(String(value ?? ""))
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeTextAtomic(filePath, content, opts = {}) {
  const abs = path.resolve(filePath);
  ensureDir(path.dirname(abs));
  const sanitized = opts.skipRedact ? stripEmDash(content) : sanitizeText(content);
  const tmpPath = `${abs}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmpPath, sanitized, "utf8");
  fs.renameSync(tmpPath, abs);
}

export function writeJsonAtomic(filePath, data) {
  const sanitized = sanitizeForOutput(data);
  writeTextAtomic(filePath, JSON.stringify(sanitized, null, 2) + "\n");
}

export function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, data: null, error: null };
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return { exists: true, data: JSON.parse(raw), error: null };
  } catch (err) {
    return { exists: true, data: null, error: err };
  }
}

export function parseCliArgs(argv, options = {}) {
  const booleanFlags = new Set(options.booleanFlags || []);
  const multiFlags = new Set(options.multiFlags || []);
  const values = {};
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const eqIdx = arg.indexOf("=");
    if (eqIdx !== -1) {
      const key = arg.slice(2, eqIdx);
      const val = arg.slice(eqIdx + 1);
      if (multiFlags.has(key)) {
        if (!Array.isArray(values[key])) values[key] = [];
        values[key].push(...val.split(",").map((s) => s.trim()).filter(Boolean));
      } else {
        values[key] = booleanFlags.has(key) ? val !== "false" && val !== "0" : val;
      }
      continue;
    }

    const key = arg.slice(2);
    if (booleanFlags.has(key)) {
      values[key] = true;
      continue;
    }

    if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      const val = argv[++i];
      if (multiFlags.has(key)) {
        if (!Array.isArray(values[key])) values[key] = [];
        values[key].push(...val.split(",").map((s) => s.trim()).filter(Boolean));
      } else {
        values[key] = val;
      }
    } else {
      values[key] = true;
    }
  }

  return { values, positional };
}

export function loadConfigFile(configPath) {
  if (!configPath) return {};
  const candidates = [
    path.resolve(process.cwd(), configPath),
    path.resolve(STAGING_ROOT, configPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, "utf8");
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    }
  }
  throw new Error(`Config file not found: ${configPath}`);
}

export function parseNonNegativeNumber(raw, fallback, label) {
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw === "boolean") {
    throw new Error(`Invalid ${label}: missing numeric value (got boolean ${raw})`);
  }
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) {
    throw new Error(`Invalid ${label}: "${raw}" (must be a finite number >= 0)`);
  }
  return num;
}

export async function fetchWithTimeout(url, opts = {}, timeoutMs = 4000) {
  const startedAt = Date.now();
  try {
    const res = await fetch(url, {
      ...opts,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let json = null;
    let parseError = null;
    const contentType = String(res.headers.get("content-type") || "").toLowerCase();
    if (text.trim().length > 0 && (contentType.includes("json") || text.trim().startsWith("{") || text.trim().startsWith("["))) {
      try {
        json = JSON.parse(text);
      } catch (err) {
        parseError = err instanceof Error ? err.message : String(err);
      }
    }
    return {
      ok: res.ok,
      status: res.status,
      contentType,
      headers: Object.fromEntries(res.headers.entries()),
      text,
      json,
      parseError,
      error: null,
      timedOut: false,
      durationMs: Date.now() - startedAt,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : "";
    const timedOut = name === "TimeoutError" || name === "AbortError" || /timeout|aborted/i.test(msg);
    return {
      ok: false,
      status: 0,
      contentType: "",
      headers: {},
      text: "",
      json: null,
      parseError: null,
      error: msg,
      timedOut,
      durationMs: Date.now() - startedAt,
    };
  }
}

export function isolatedChildEnv(extraEnv = {}) {
  const hypDir = path.join(TEST_RESULTS_DIR, ".hypothesis");
  const pfDir = path.join(TEST_RESULTS_DIR, ".promptfoo");
  const pytestCache = path.join(TEST_RESULTS_DIR, ".pytest_cache");
  ensureDir(hypDir);
  ensureDir(pfDir);
  ensureDir(pytestCache);
  return {
    ...process.env,
    HYPOTHESIS_STORAGE_DIRECTORY: process.env.HYPOTHESIS_STORAGE_DIRECTORY || hypDir,
    PROMPTFOO_CONFIG_DIR: process.env.PROMPTFOO_CONFIG_DIR || pfDir,
    PYTEST_CACHE_DIR: process.env.PYTEST_CACHE_DIR || pytestCache,
    ...extraEnv,
  };
}

export function getLocalCacheTmpDir() {
  const baseDir =
    process.env.LOCALAPPDATA ||
    process.env.XDG_DATA_HOME ||
    path.join(os.homedir(), ".local", "share");
  return path.join(baseDir, "millar-autonomous-qa", "tmp");
}

export function toStagingRelPath(absOrRel) {
  const abs = path.isAbsolute(absOrRel) ? absOrRel : path.resolve(STAGING_ROOT, absOrRel);
  return path.relative(STAGING_ROOT, abs).replaceAll("\\", "/");
}

export function slugify(input, maxLen = 40) {
  return String(input || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen) || "item";
}

export function uniqueStrings(list) {
  return Array.from(new Set((list || []).filter((v) => typeof v === "string" && v.length > 0)));
}
