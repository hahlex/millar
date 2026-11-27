#!/usr/bin/env node
/**
 * millar-harden-scan.mjs (v0.1.0): Zero-MCP Static Security, Performance, Secret & Live HTTP Header Auditor
 *
 * Bundled inside skills/millar-diagnose-and-harden/scripts/ (zero external npm dependencies, Node >= 18).
 * Scans source files (or only git-changed files via --diff-base) for OWASP Web/API security hazards,
 * hardcoded credentials, Vercel Priority 1-3 performance/waterfall/N+1 killers, and leftover debug markers,
 * plus optional live HTTP security header, cookie, and adversarial CORS reflection probing (--url=http://...).
 *
 * Usage:
 *   node millar-harden-scan.mjs <target-path> [--url=http://...] [--diff-base=HEAD~1] [--include-tests] [--strict-warnings] [--json] [--report-md=<path>]
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "out",
  "build",
  "coverage",
  ".turbo",
  "__pycache__",
  ".venv",
  "venv",
  ".pytest_cache",
  ".hypothesis",
  "playwright-report",
  "test-results",
]);

const TEST_DIR_RE = /(?:^|\/)(?:__tests__|tests?|spec|e2e|fixtures?|mocks?|__mocks__)(?:\/|$)/i;
const TEST_FILE_RE = /\.(?:test|spec)\.[a-z0-9]+$/i;
const SCAN_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".html",
  ".htm",
  ".vue",
  ".svelte",
  ".astro",
  ".sql",
  ".yml",
  ".yaml",
  ".json",
]);

function parseArgs(argv) {
  const opts = {
    target: ".",
    url: null,
    diffBase: null,
    includeTests: false,
    strictWarnings: false,
    json: false,
    reportMd: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--include-tests") opts.includeTests = true;
    else if (arg === "--strict-warnings") opts.strictWarnings = true;
    else if (arg === "--json") opts.json = true;
    else if (arg.startsWith("--url=")) opts.url = arg.slice("--url=".length);
    else if (arg === "--url" && argv[i + 1]) opts.url = argv[++i];
    else if (arg.startsWith("--diff-base=")) opts.diffBase = arg.slice("--diff-base=".length);
    else if (arg === "--diff-base" && argv[i + 1]) opts.diffBase = argv[++i];
    else if (arg.startsWith("--report-md=")) opts.reportMd = arg.slice("--report-md=".length);
    else if (arg === "--report-md" && argv[i + 1]) opts.reportMd = argv[++i];
    else if (!arg.startsWith("--")) opts.target = arg;
  }
  return opts;
}

function isSuppressed(line, ruleId) {
  const m = String(line || "").match(/millar-harden-ok(?:\s*:\s*([a-z0-9/_,-]+))?/i);
  if (!m) return false;
  if (!m[1]) return true;
  return m[1]
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .includes(ruleId.toLowerCase());
}

function collectFilesFromGitDiff(absTarget, diffBase) {
  const repoRoot = fs.statSync(absTarget).isDirectory() ? absTarget : path.dirname(absTarget);
  const raw = execFileSync("git", ["-C", repoRoot, "diff", "--name-only", "--diff-filter=ACMR", diffBase], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 8000,
  });
  const files = [];
  for (const rel of raw.split(/\r?\n/)) {
    const trimmed = rel.trim();
    if (!trimmed) continue;
    const full = path.resolve(repoRoot, trimmed);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      files.push(full);
    }
  }
  return files;
}

function collectFiles(targetPath, opts) {
  const abs = path.resolve(process.cwd(), targetPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Target path does not exist: ${abs}`);
  }
  if (opts.diffBase) {
    return collectFilesFromGitDiff(abs, opts.diffBase);
  }
  const stat = fs.statSync(abs);
  if (stat.isFile()) return [abs];

  const files = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else {
        files.push(full);
      }
    }
  }
  walk(abs);
  return files;
}

function isPlaceholderSecret(line) {
  return /(?:REDACTED|EXAMPLE|DUMMY|FAKE|PLACEHOLDER|YOUR_|<[^>]+>|test[-_]?(?:key|token|secret)|mock[-_]?(?:key|token|secret)|changeme|xxxx)/i.test(
    line,
  );
}

function auditFile(absFile, opts, findings) {
  const ext = path.extname(absFile).toLowerCase();
  const baseName = path.basename(absFile);
  if (!SCAN_EXTS.has(ext) && !baseName.startsWith(".env")) return false;

  const rel = path.relative(process.cwd(), absFile).replaceAll("\\", "/");
  if (!opts.includeTests && (TEST_DIR_RE.test(rel) || TEST_FILE_RE.test(baseName))) {
    return false;
  }

  let stat;
  try {
    stat = fs.statSync(absFile);
    if (stat.size > 1024 * 1024) return false;
  } catch {
    return false;
  }

  const content = fs.readFileSync(absFile, "utf8");
  const lines = content.split(/\r?\n/);
  const isJsTs = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext);
  const isPy = ext === ".py";
  const isMarkup = [".html", ".htm", ".tsx", ".jsx", ".vue", ".svelte", ".astro"].includes(ext);
  const isHandlerFile = /(?:^|\/)(?:routes?|routers?|controllers?|handlers?|api|endpoints?)(?:\/|\.|-|_)/i.test(rel);

  const push = (severity, category, rule, lineNo, message) => {
    const rawLine = lineNo ? lines[lineNo - 1] || "" : "";
    if (isSuppressed(rawLine, rule)) return;
    findings.push({ severity, category, rule, file: rel, ...(lineNo ? { line: lineNo } : {}), message });
  };

  // --- 1. Hardcoded Secrets & Credential Leaks (NEVER emit raw secret text!) ---
  const secretPatterns = [
    { re: /\bAKIA[0-9A-Z]{16}\b/, label: "AWS access key ID" },
    { re: /\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/, label: "GitHub personal access token" },
    { re: /\b(?:sk-proj-[A-Za-z0-9_-]{20,}|sk-ant-[A-Za-z0-9_-]{20,}|sk_live_[A-Za-z0-9]{16,})\b/, label: "Live API secret key" },
    { re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, label: "Private key material" },
    { re: /\beyJ[A-Za-z0-9_-]{12,}\.eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/, label: "Literal JWT token" },
    {
      re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/[^:@/\s]+:([^@/\s]{6,})@(?!localhost\b|127\.0\.0\.1\b|postgres\b|redis\b|db\b|host\.docker\.internal\b)[A-Za-z0-9.-]+/i,
      label: "Non-local database/cache DSN with embedded password",
    },
  ];

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("#")) {
      // Still catch leftover debug markers in comments? No, skip normal doc comments for code patterns
      if (/\[DEBUG-[a-z0-9_-]+\]/i.test(line)) {
        push("error", "reliability", "reliability/leftover-debug", lineNo, "Stray [DEBUG-...] marker found; remove temporary instrumentation before shipping.");
      }
      return;
    }

    // Secrets
    if (!isPlaceholderSecret(line)) {
      for (const sp of secretPatterns) {
        if (sp.re.test(line)) {
          push("error", "security", "sec/hardcoded-secret", lineNo, `Possible hardcoded ${sp.label} detected (move credential to runtime environment variable).`);
          break;
        }
      }
    }

    // Client-exposed secret env vars (NEXT_PUBLIC_* / VITE_*)
    if (/\b(?:NEXT_PUBLIC|VITE)_[A-Z0-9_]*(?:SECRET|PRIVATE_KEY|PASSWORD|SERVICE_ROLE|DATABASE_URL)\b/.test(line)) {
      push("error", "security", "sec/client-env-secret", lineNo, "Client-exposed env prefix (NEXT_PUBLIC_/VITE_) paired with sensitive secret name risks browser bundle leakage.");
    }

    // Leftover debug instrumentation
    if (/\[DEBUG-[a-z0-9_-]+\]/i.test(line) || /^\s*debugger\s*;?\s*$/.test(line)) {
      push("error", "reliability", "reliability/leftover-debug", lineNo, "Leftover debug statement (`debugger` or `[DEBUG-...]`) found in shipping code.");
    }

    // SQL string interpolation
    if (
      (isJsTs && /\.(?:query|execute|raw)\s*\(\s*`[^`]*(?:SELECT|INSERT|UPDATE|DELETE)\b[^`]*\$\{/i.test(line)) ||
      (isPy && /\.(?:execute|executemany)\s*\(\s*f["'][^"']*(?:SELECT|INSERT|UPDATE|DELETE)\b[^"']*\{/i.test(line))
    ) {
      push("error", "security", "sec/sql-string-interpolation", lineNo, "Interpolated SQL query string detected (OWASP injection hazard: use parameterized placeholders).");
    }

    // Command injection sinks
    if (
      (isJsTs && /\b(?:exec|execSync)\s*\(\s*(?:`[^`]*\$\{|[^,)]*\+)/.test(line)) ||
      (isPy && (/\bos\.system\s*\(/.test(line) || /\bsubprocess\.(?:run|Popen|call|check_output)\s*\([^)]*shell\s*=\s*True/.test(line)))
    ) {
      push("error", "security", "sec/command-injection-sink", lineNo, "Shell command execution with dynamic string or shell=True detected (use execFile/argument array instead).");
    }

    // Unsafe eval / HTML sinks
    if (isJsTs && (/\beval\s*\(/.test(line) || /\bnew\s+Function\s*\(/.test(line))) {
      push("error", "security", "sec/unsafe-eval", lineNo, "Dynamic code execution (`eval` or `new Function`) detected.");
    }
    if (
      (isJsTs || isMarkup) &&
      (/(?:dangerouslySetInnerHTML|\.innerHTML\s*=|\bdocument\.write\s*\()/.test(line)) &&
      !/(?:DOMPurify|sanitize)/i.test(line)
    ) {
      push("warn", "security", "sec/unsafe-html-sink", lineNo, "Raw HTML sink detected without visible sanitization (XSS risk).");
    }

    // SSRF unvalidated user URL sink
    if (
      (isJsTs && /\b(?:fetch|axios\.(?:get|post|request))\s*\(\s*(?:req\.(?:query|body|params)|request\.(?:query|body)|urlParam)/i.test(line)) ||
      (isPy && /\b(?:requests|httpx)\.(?:get|post|request)\s*\(\s*(?:request\.|payload\.|body\.|query\.)/i.test(line))
    ) {
      push("warn", "security", "sec/ssrf-unvalidated-url", lineNo, "Outbound HTTP call takes user-controlled request input directly (OWASP API7 SSRF: validate against an explicit allowlist and block private IPs).");
    }

    // JWT alg:none / unverified decode
    if (
      /algorithms\s*[:=]\s*\[[^\]]*["']none["']/i.test(line) ||
      /verify_signature["']?\s*[:=]\s*False/i.test(line) ||
      (isJsTs && /\bjwt\.decode\s*\(/.test(line) && !/verify/i.test(line))
    ) {
      push("error", "security", "sec/jwt-unverified-or-alg-none", lineNo, "Unverified JWT decode or `alg: none` configuration detected (OWASP API2).");
    }

    // Insecure cookie flags
    if (/\b(?:res\.cookie|set_cookie)\s*\(/.test(line) && !/(?:httpOnly|httponly)/i.test(line)) {
      push("warn", "security", "sec/insecure-cookie", lineNo, "Cookie set without explicit HttpOnly flag on this line (verify HttpOnly, Secure, and SameSite flags).");
    }

    // Mass assignment sink
    if (
      (isJsTs && /\.(?:create|update|updateMany|findOneAndUpdate)\s*\(\s*(?:\{\s*data\s*:\s*)?req\.body\b/.test(line)) ||
      (isPy && /\*\*\s*(?:req|request|payload)\.(?:dict|model_dump)\s*\(\s*\)/.test(line))
    ) {
      push("warn", "security", "sec/mass-assignment-sink", lineNo, "Unfiltered request payload passed directly into model mutation (OWASP API3 BOPLA: pick an explicit allowlisted DTO).");
    }

    // Vercel Priority 2: Heavy barrel imports
    if (
      isJsTs &&
      /^\s*import\s+(?:\*\s+as\s+\w+\s+from\s+["'](?:lucide-react|@mui\/icons-material|lodash)["']|\w+\s+from\s+["'](?:lodash|moment)["'])/.test(
        line,
      )
    ) {
      push("warn", "performance", "perf/barrel-import", lineNo, "Heavy wholesale barrel import hurts tree-shaking, client bundle size, and INP.");
    }

    // Blocking sync I/O inside server route handlers
    if (isJsTs && isHandlerFile && /\b(?:readFileSync|writeFileSync|appendFileSync|execSync)\s*\(/.test(line)) {
      push("warn", "performance", "perf/sync-io-in-handler", lineNo, "Blocking synchronous filesystem/process call inside a route handler stalls the Node.js event loop.");
    }

    // Empty silent catch blocks
    if (isJsTs && /\bcatch\s*(?:\([^)]*\))?\s*\{\s*\}/.test(line)) {
      push("warn", "reliability", "reliability/empty-catch", lineNo, "Silent empty catch block swallows errors without logging, recovery, or explicit rationale.");
    }
  });

  // --- 2. File-Level Multi-Line Patterns ---
  // CORS wildcard/reflection + credentials
  const hasCorsCreds =
    /Access-Control-Allow-Credentials['"]?\s*[:=]\s*['"]?true/i.test(content) ||
    /\b(?:credentials\s*:\s*true|allow_credentials\s*=\s*True)\b/.test(content);
  const hasCorsWildcardOrReflect =
    /Access-Control-Allow-Origin['"]?\s*[:=]\s*(?:['"]\*['"]|req\.headers\.origin)/i.test(content) ||
    /\ballow_origins\s*=\s*\[\s*["']\*["']\s*\]/.test(content) ||
    /\borigin\s*:\s*(?:true|["']\*["'])/.test(content);
  if (hasCorsCreds && hasCorsWildcardOrReflect) {
    push(
      "error",
      "security",
      "sec/cors-wildcard-credentials",
      null,
      "CORS credentials enabled alongside wildcard `*` or blind origin reflection (OWASP API8: enforce an explicit trusted-origin allowlist).",
    );
  }

  // Vercel Priority 1 / N+1: sequential await inside for/while loop (bounded single-level heuristic)
  if (isJsTs) {
    const loopAwaitRe = /\b(?:for|while)\s*\([^)\n]{1,120}\)\s*\{[^}]{0,360}\bawait\s+(?:fetch|axios|db\.|prisma\.|tx\.|client\.|pool\.)/g;
    for (const m of content.matchAll(loopAwaitRe)) {
      const lineNo = content.slice(0, m.index).split(/\r?\n/).length;
      push(
        "warn",
        "performance",
        "perf/await-in-loop",
        lineNo,
        "Sequential `await` I/O call inside loop (waterfall / N+1 query hazard: batch query or parallelize with bounded Promise.all).",
      );
    }
  }
  if (isPy) {
    const pyLoopAwaitRe = /\bfor\s+[^\n:]{1,80}:\s*\n(?:[ \t]+[^\n]+\n){0,4}[ \t]+(?:await\s+(?:session|db|client|httpx)\.|(?:requests|httpx)\.(?:get|post)\()/g;
    for (const m of content.matchAll(pyLoopAwaitRe)) {
      const lineNo = content.slice(0, m.index).split(/\r?\n/).length;
      push(
        "warn",
        "performance",
        "perf/await-in-loop",
        lineNo,
        "Sequential I/O inside Python loop (waterfall / N+1 hazard: batch query or use asyncio.gather).",
      );
    }
  }

  // Server-side outbound fetch without timeout in handlers
  if (isJsTs && isHandlerFile) {
    for (const m of content.matchAll(/\bfetch\s*\(([^;]{1,220})\)/g)) {
      const callText = m[1] || "";
      if (!/(?:signal|AbortSignal|timeout)/i.test(callText)) {
        const lineNo = content.slice(0, m.index).split(/\r?\n/).length;
        push(
          "warn",
          "performance",
          "perf/fetch-no-timeout",
          lineNo,
          "Server-side fetch() without AbortSignal.timeout/signal can hang request workers indefinitely.",
        );
      }
    }
  }

  return true;
}

async function auditLiveHttpSecurity(rawUrl, findings) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    findings.push({
      severity: "error",
      category: "security",
      rule: "live/invalid-url",
      file: rawUrl,
      message: `Invalid --url supplied: ${rawUrl}`,
    });
    return null;
  }

  const evilOrigin = "https://evil-audit.example";
  const started = Date.now();
  let res;
  try {
    res = await fetch(parsed.toString(), {
      method: "GET",
      headers: { Origin: evilOrigin },
      signal: AbortSignal.timeout(6000),
    });
  } catch (err) {
    findings.push({
      severity: "warn",
      category: "reliability",
      rule: "live/unreachable",
      file: rawUrl,
      message: `Unable to reach ${rawUrl} for live header audit: ${err instanceof Error ? err.message : String(err)}`,
    });
    return null;
  }

  const ttfbMs = Date.now() - started;
  const h = (name) => res.headers.get(name) || "";
  const acao = h("access-control-allow-origin");
  const acac = h("access-control-allow-credentials");
  const csp = h("content-security-policy");
  const xcto = h("x-content-type-options");
  const xfo = h("x-frame-options");
  const hsts = h("strict-transport-security");
  const xpb = h("x-powered-by");
  const setCookie = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : h("set-cookie") ? [h("set-cookie")] : [];

  if (acao === evilOrigin && acac.toLowerCase() === "true") {
    findings.push({
      severity: "error",
      category: "security",
      rule: "sec/live-cors-origin-reflection",
      file: rawUrl,
      message: "CRITICAL: Server reflected untrusted Origin with Access-Control-Allow-Credentials: true.",
    });
  } else if (acao === "*" && acac.toLowerCase() === "true") {
    findings.push({
      severity: "error",
      category: "security",
      rule: "sec/live-cors-wildcard-credentials",
      file: rawUrl,
      message: "Server returned Access-Control-Allow-Origin: * alongside Access-Control-Allow-Credentials: true.",
    });
  }

  if (xcto.toLowerCase() !== "nosniff") {
    findings.push({
      severity: "warn",
      category: "security",
      rule: "sec/missing-x-content-type-options",
      file: rawUrl,
      message: "Response missing `X-Content-Type-Options: nosniff` header.",
    });
  }
  if (!csp && !xfo) {
    findings.push({
      severity: "warn",
      category: "security",
      rule: "sec/missing-csp-and-frame-guard",
      file: rawUrl,
      message: "Response missing both `Content-Security-Policy` and `X-Frame-Options` clickjacking/XSS headers.",
    });
  }
  if (parsed.protocol === "https:" && !hsts) {
    findings.push({
      severity: "warn",
      category: "security",
      rule: "sec/missing-hsts",
      file: rawUrl,
      message: "HTTPS endpoint missing `Strict-Transport-Security` header.",
    });
  }
  if (xpb) {
    findings.push({
      severity: "warn",
      category: "security",
      rule: "sec/server-banner-disclosure",
      file: rawUrl,
      message: `Response discloses framework header \`X-Powered-By: ${xpb}\` (strip in production).`,
    });
  }
  for (const ck of setCookie) {
    const ckName = ck.split("=")[0]?.trim() || "cookie";
    if (!/;\s*httponly\b/i.test(ck) || !/;\s*samesite=/i.test(ck)) {
      findings.push({
        severity: "warn",
        category: "security",
        rule: "sec/live-insecure-cookie",
        file: rawUrl,
        message: `Set-Cookie "${ckName}" missing HttpOnly or SameSite attribute.`,
      });
    }
  }
  if (ttfbMs > 800) {
    findings.push({
      severity: "warn",
      category: "performance",
      rule: "perf/live-ttfb-slow",
      file: rawUrl,
      message: `Live TTFB measured ${ttfbMs}ms (> 800ms Core Web Vitals good threshold).`,
    });
  }

  return { status: res.status, ttfbMs, headersChecked: true, setCookieCount: setCookie.length };
}

function buildMarkdownReport(summary) {
  const lines = [
    "# Millar Harden Scan Report",
    "",
    `- Generated at: \`${new Date().toISOString()}\``,
    `- Target: \`${summary.target}\`${summary.diffBase ? ` (diff-base: \`${summary.diffBase}\`)` : ""}`,
    `- Scanned files: **${summary.scannedFiles}** | Errors: **${summary.errorCount}** | Warnings: **${summary.warningCount}** | Passed: **${summary.passed}**`,
    "",
  ];
  if (summary.findings.length === 0) {
    lines.push("No security, performance, or reliability issues detected.");
  } else {
    lines.push("| Severity | Category | Rule | Location | Message |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const f of summary.findings) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      lines.push(`| ${f.severity.toUpperCase()} | ${f.category} | \`${f.rule}\` | \`${loc}\` | ${f.message.replaceAll("|", "\\|")} |`);
    }
  }
  return lines.join("\n").replaceAll("\u2014", " -- ") + "\n";
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(
      "Usage: node scripts/millar-harden-scan.mjs <target-path> [--url=http://...] [--diff-base=<git-ref>] [--include-tests] [--strict-warnings] [--json] [--report-md=<path>]",
    );
    process.exit(0);
  }

  const files = collectFiles(opts.target, opts);
  const findings = [];
  let scannedFiles = 0;
  for (const file of files) {
    if (auditFile(file, opts, findings)) scannedFiles += 1;
  }

  let liveSummary = null;
  if (opts.url) {
    liveSummary = await auditLiveHttpSecurity(opts.url, findings);
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warn");
  const passed = errors.length === 0 && (!opts.strictWarnings || warnings.length === 0);

  const summary = {
    tool: "millar-harden-scan",
    version: "0.1.0",
    target: opts.target,
    diffBase: opts.diffBase,
    scannedFiles,
    liveSummary,
    passed,
    errorCount: errors.length,
    warningCount: warnings.length,
    byCategory: {
      security: findings.filter((f) => f.category === "security").length,
      performance: findings.filter((f) => f.category === "performance").length,
      reliability: findings.filter((f) => f.category === "reliability").length,
    },
    findings,
  };

  if (opts.reportMd) {
    const absMd = path.resolve(process.cwd(), opts.reportMd);
    fs.mkdirSync(path.dirname(absMd), { recursive: true });
    fs.writeFileSync(absMd, buildMarkdownReport(summary), "utf8");
  }

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    const label = passed ? "PASS" : "FAIL";
    console.log(
      `${label}: millar-harden-scan v0.1 scanned ${scannedFiles} file(s) -> ${errors.length} error(s), ${warnings.length} warning(s) [security=${summary.byCategory.security}, perf=${summary.byCategory.performance}, reliability=${summary.byCategory.reliability}].`,
    );
    for (const f of findings) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      console.log(`  [${f.severity.toUpperCase()}] ${f.rule} (${loc}): ${f.message}`);
    }
  }

  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error(`millar-harden-scan fatal error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(2);
});
