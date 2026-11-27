#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchWithTimeout,
  loadConfigFile,
  MEMORY_DIR,
  parseCliArgs,
  parseNonNegativeNumber,
  sanitizeForOutput,
  STAGING_ROOT,
  toStagingRelPath,
  uniqueStrings,
  writeJsonAtomic,
} from "./lib/common.mjs";

function extractHtmlLinks(html, baseOrigin) {
  const routes = [];
  const attrRe = /<(?:a|form)\b[^>]*(?:href|action)\s*=\s*["']([^"'#]+)["']/gi;
  for (const m of html.matchAll(attrRe)) {
    const raw = m[1].trim();
    if (!raw || raw.startsWith("javascript:") || raw.startsWith("mailto:")) continue;
    try {
      const resolved = new URL(raw, baseOrigin);
      if (resolved.origin === baseOrigin) {
        routes.push(`${resolved.pathname || "/"}${resolved.search || ""}`);
      }
    } catch {
      // Ignore malformed href
    }
  }
  return routes;
}

function parseViewRegistryFile(filePath) {
  if (!fs.existsSync(filePath)) return { routes: [], scopes: [] };
  const text = fs.readFileSync(filePath, "utf8");
  const routes = [];
  const scopes = [];

  for (const m of text.matchAll(/\bpath\s*:\s*["'`]([^"'`]+)["'`]/g)) {
    if (m[1].startsWith("/")) routes.push(m[1]);
  }
  for (const m of text.matchAll(/\baliases\s*:\s*\[([^\]]*)\]/g)) {
    for (const q of m[1].matchAll(/["'`]([^"'`]+)["'`]/g)) {
      if (q[1].startsWith("/")) routes.push(q[1]);
    }
  }
  const authMatch = text.match(/AUTH_PATHS\s*=\s*(?:new Set\s*\()?\s*\[([\s\S]*?)\]/);
  if (authMatch?.[1]) {
    for (const q of authMatch[1].matchAll(/["'`]([^"'`]+)["'`]/g)) {
      if (q[1].startsWith("/")) routes.push(q[1]);
    }
  }
  for (const m of text.matchAll(/\b(?:scope|orScope)\s*:\s*["'`]([^"'`]+)["'`]/g)) {
    scopes.push(m[1]);
  }
  return { routes: uniqueStrings(routes), scopes: uniqueStrings(scopes) };
}

function readStringLiteral(text, startIdx) {
  const quote = text[startIdx];
  let out = "";
  let i = startIdx + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") {
      if (i + 1 < text.length) {
        out += text[i + 1];
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    if (ch === quote) {
      return { value: out, nextIdx: i };
    }
    out += ch;
    i += 1;
  }
  return { value: out, nextIdx: text.length - 1 };
}

function extractBalancedBracketBlock(text, openBracketIdx) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = openBracketIdx; i < text.length; i += 1) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : "";

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote) {
      if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
    } else if (ch === "[") {
      depth += 1;
    } else if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(openBracketIdx + 1, i);
      }
    }
  }
  return "";
}

function extractStringLiteralsFromCode(text) {
  const results = [];
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : "";
    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      const lit = readStringLiteral(text, i);
      if (lit.value) results.push(lit.value);
      i = lit.nextIdx;
    }
  }
  return results;
}

function extractRouteScopesFromBlock(block) {
  const scopes = [];
  let braceDepth = 0;
  let bracketDepth = 0;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < block.length; i += 1) {
    const ch = block[i];
    const next = i + 1 < block.length ? block[i + 1] : "";

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      const lit = readStringLiteral(block, i);
      if (braceDepth === 0 && bracketDepth === 0 && lit.value && lit.value !== "all" && lit.value !== "any") {
        scopes.push(lit.value);
      }
      i = lit.nextIdx;
      continue;
    }
    if (ch === "{") {
      braceDepth += 1;
      continue;
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }
    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }

    const prev = i > 0 ? block[i - 1] : "";
    if (!/[A-Za-z0-9_$]/.test(prev) && block.startsWith("scopes", i)) {
      const m = block.slice(i).match(/^scopes\s*:\s*\[/);
      if (m) {
        const innerOpenIdx = i + m[0].length - 1;
        const innerBlock = extractBalancedBracketBlock(block, innerOpenIdx);
        for (const s of extractStringLiteralsFromCode(innerBlock)) {
          scopes.push(s);
        }
        i = innerOpenIdx + innerBlock.length + 1;
      }
    }
  }

  return scopes;
}

function parseRouteCatalogFile(filePath) {
  if (!fs.existsSync(filePath)) return { endpoints: [], scopes: [] };
  const text = fs.readFileSync(filePath, "utf8");
  const endpoints = [];
  const scopes = [];

  const entryRe = /method\s*:\s*['"`]([A-Za-z]+)['"`][\s\S]{0,400}?path\s*:\s*['"`]([^'"`]+)['"`]/g;
  for (const m of text.matchAll(entryRe)) {
    endpoints.push(`${m[1].toUpperCase()} ${m[2]}`);
  }
  for (const m of text.matchAll(/route_scopes\s*:\s*\[/g)) {
    const openIdx = m.index + m[0].length - 1;
    const block = extractBalancedBracketBlock(text, openIdx);
    if (!block) continue;
    for (const s of extractRouteScopesFromBlock(block)) {
      scopes.push(s);
    }
  }
  return { endpoints: uniqueStrings(endpoints), scopes: uniqueStrings(scopes) };
}

function scanGenericStaticRoutes(repoDir) {
  const endpoints = [];
  if (!fs.existsSync(repoDir)) return endpoints;
  const maxFiles = 250;
  let scanned = 0;

  function walk(dir) {
    if (scanned >= maxFiles) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (scanned >= maxFiles) return;
      if (["node_modules", ".git", ".venv", "__pycache__", "dist", "build"].includes(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (/\.(py|ts|js)$/.test(ent.name)) {
        scanned += 1;
        const src = fs.readFileSync(full, "utf8");
        for (const m of src.matchAll(/@(?:router|app)\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/gi)) {
          endpoints.push(`${m[1].toUpperCase()} ${m[2]}`);
        }
        for (const m of src.matchAll(/@(Get|Post|Put|Patch|Delete)\(\s*["'`]([^"'`]+)["'`]/g)) {
          endpoints.push(`${m[1].toUpperCase()} ${m[2]}`);
        }
      }
    }
  }

  walk(repoDir);
  return uniqueStrings(endpoints);
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

export async function runDiscovery(opts = {}) {
  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();
  const resolvedConfig = resolveConfigPath(opts.config);
  const cfg = resolvedConfig ? loadConfigFile(resolvedConfig) : {};
  const configDir = resolvedConfig ? path.dirname(resolvedConfig) : null;
  const timeoutMs = parseNonNegativeNumber(opts.timeoutMs, 3500, "--timeout-ms");

  const targetUrl = opts.targetUrl ?? cfg.targetUrl;
  const apiUrl = opts.apiUrl ?? cfg.apiUrl ?? targetUrl;
  const aiUrl = opts.aiUrl ?? cfg.aiUrl;
  const oidcUrl = opts.oidcUrl ?? cfg.oidcUrl;
  const openapiUrl = opts.openapiUrl ?? cfg.openapiUrl;

  const cliRepoPaths = (Array.isArray(opts.repoPaths) ? opts.repoPaths : []).map((rp) =>
    resolvePathCandidates(rp, [process.cwd(), configDir, STAGING_ROOT]),
  );
  const cfgRepoPaths = (Array.isArray(cfg.repoPaths) ? cfg.repoPaths : []).map((rp) =>
    resolvePathCandidates(rp, [configDir, process.cwd(), STAGING_ROOT]),
  );
  const repoPaths = uniqueStrings([...cliRepoPaths, ...cfgRepoPaths]);
  const frontendRegistryPath =
    opts.frontendRegistryPath ||
    (cfg.frontendRegistryPath
      ? resolvePathCandidates(cfg.frontendRegistryPath, [configDir, process.cwd(), STAGING_ROOT])
      : undefined);
  const routeCatalogPath =
    opts.routeCatalogPath ||
    (cfg.routeCatalogPath
      ? resolvePathCandidates(cfg.routeCatalogPath, [configDir, process.cwd(), STAGING_ROOT])
      : undefined);

  const routes = new Set();
  const endpoints = new Set();
  const roles = new Set();
  const scopes = new Set();
  const findings = [];
  const healthMatrix = {};
  const authHints = [];
  const endpointMetadata = {};
  let requests = 0;
  let assertions = 0;

  let targetReachable = false;
  let apiReachable = false;
  let openApiFound = false;
  let aiDegraded = false;
  let staticCatalogUsed = false;

  if (targetUrl) {
    const parsedTarget = new URL(targetUrl);
    const res = await fetchWithTimeout(parsedTarget.toString(), { method: "GET" }, timeoutMs);
    requests += 1;
    assertions += 1;
    healthMatrix.frontend = {
      url: parsedTarget.toString(),
      ok: res.ok,
      status: res.status,
      timedOut: res.timedOut,
      error: res.error,
      durationMs: res.durationMs,
    };
    if (res.status > 0) {
      targetReachable = true;
      routes.add(parsedTarget.pathname || "/");
      if (res.text) {
        for (const r of extractHtmlLinks(res.text, parsedTarget.origin)) {
          routes.add(r);
        }
      }
    }
  }

  if (apiUrl) {
    const parsedApi = new URL(apiUrl);
    const apiOrigin = parsedApi.origin;
    const healthChecks = {};

    for (const p of ["/healthz", "/readyz"]) {
      const probeUrl = `${apiOrigin}${p}`;
      const res = await fetchWithTimeout(probeUrl, { method: "GET" }, timeoutMs);
      requests += 1;
      assertions += 1;
      healthChecks[p] = {
        ok: res.ok,
        status: res.status,
        timedOut: res.timedOut,
        error: res.error,
        body: res.json ?? null,
      };
      if (res.status > 0) {
        apiReachable = true;
        if (res.ok) endpoints.add(`GET ${p}`);
      }
      if (res.timedOut || res.status === 0) break;
    }
    healthMatrix.api = healthChecks;

    const specCandidates = openapiUrl
      ? [openapiUrl]
      : [`${apiOrigin}/openapi.json`, `${apiOrigin}/v1/openapi.json`];

    for (const specUrl of specCandidates) {
      const res = await fetchWithTimeout(specUrl, { method: "GET" }, timeoutMs);
      requests += 1;
      assertions += 1;
      if (res.status > 0) apiReachable = true;
      if (res.ok && res.json && typeof res.json === "object" && res.json.paths) {
        openApiFound = true;
        const globalSecurity = Array.isArray(res.json.security) ? res.json.security : [];
        for (const [epPath, methodsObj] of Object.entries(res.json.paths)) {
          if (!methodsObj || typeof methodsObj !== "object") continue;
          const pathParams = Array.isArray(methodsObj.parameters) ? methodsObj.parameters : [];
          for (const methodName of Object.keys(methodsObj)) {
            const upper = methodName.toUpperCase();
            if (["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"].includes(upper)) {
              const epKey = `${upper} ${epPath}`;
              endpoints.add(epKey);
              const opObj = methodsObj[methodName];
              if (opObj && typeof opObj === "object") {
                const opSecurity = Array.isArray(opObj.security) ? opObj.security : null;
                const requiresAuth = opSecurity !== null ? opSecurity.length > 0 : globalSecurity.length > 0;
                const mergedParams = [...pathParams, ...(Array.isArray(opObj.parameters) ? opObj.parameters : [])];
                const paramSchemas = {};
                for (const pObj of mergedParams) {
                  if (!pObj || pObj.in !== "path" || !pObj.name) continue;
                  const schema = pObj.schema && typeof pObj.schema === "object" ? pObj.schema : {};
                  paramSchemas[pObj.name] = {
                    example: pObj.example ?? schema.example ?? null,
                    defaultValue: schema.default ?? null,
                    enum0: Array.isArray(schema.enum) && schema.enum.length > 0 ? schema.enum[0] : null,
                    type: schema.type || null,
                    minimum: typeof schema.minimum === "number" ? schema.minimum : null,
                  };
                }
                endpointMetadata[epKey] = {
                  requiresAuth,
                  paramSchemas,
                };
              }
            }
          }
        }
        const secSchemes = res.json.components?.securitySchemes;
        if (secSchemes && typeof secSchemes === "object") {
          for (const [name, scheme] of Object.entries(secSchemes)) {
            authHints.push({ name, type: scheme?.type || "unknown", scheme: scheme?.scheme || null });
          }
        }
        healthMatrix.openapi = { url: specUrl, status: res.status, endpointCount: endpoints.size };
        break;
      }
      healthMatrix.openapi = { url: specUrl, status: res.status, error: res.error || "OpenAPI unavailable" };
      if (res.timedOut || res.status === 0) break;
    }
  }

  if (aiUrl) {
    const parsedAi = new URL(aiUrl);
    const aiOrigin = parsedAi.origin;
    const aiPathWithSearch =
      parsedAi.pathname && parsedAi.pathname !== "/"
        ? `${parsedAi.pathname}${parsedAi.search || ""}`
        : parsedAi.search
          ? `/${parsedAi.search}`
          : null;
    const probePaths = aiPathWithSearch ? [aiPathWithSearch, "/healthz"] : ["/healthz", "/health"];
    const aiHealth = {};
    for (const p of probePaths) {
      const res = await fetchWithTimeout(`${aiOrigin}${p}`, { method: "GET" }, timeoutMs);
      requests += 1;
      aiHealth[p] = { ok: res.ok, status: res.status, timedOut: res.timedOut, error: res.error };
      if (res.timedOut || res.status === 0) {
        aiDegraded = true;
        break;
      }
      if (res.ok) break;
    }
    healthMatrix.ai = aiHealth;
  }

  if (oidcUrl) {
    const cleanBase = oidcUrl.replace(/\/+$/, "");
    const wellKnown = cleanBase.endsWith("/.well-known/openid-configuration")
      ? cleanBase
      : `${cleanBase}/.well-known/openid-configuration`;
    const res = await fetchWithTimeout(wellKnown, { method: "GET" }, timeoutMs);
    requests += 1;
    healthMatrix.oidc = {
      url: wellKnown,
      ok: res.ok,
      status: res.status,
      issuer: res.json?.issuer || null,
    };
    if (res.ok) {
      authHints.push({ name: "oidc", type: "openIdConnect", issuer: res.json?.issuer || cleanBase });
    }
  }

  if (frontendRegistryPath) {
    const reg = parseViewRegistryFile(path.resolve(frontendRegistryPath));
    for (const r of reg.routes) routes.add(r);
    for (const sc of reg.scopes) scopes.add(sc);
  }
  if (routeCatalogPath) {
    const cat = parseRouteCatalogFile(path.resolve(routeCatalogPath));
    if (cat.endpoints.length > 0) staticCatalogUsed = true;
    for (const ep of cat.endpoints) endpoints.add(ep);
    for (const sc of cat.scopes) scopes.add(sc);
  }

  for (const repo of repoPaths) {
    const absRepo = path.resolve(repo);
    const viewReg = path.join(absRepo, "apps", "web", "src", "app", "viewRegistry.ts");
    const routeCat = path.join(absRepo, "apps", "api", "src", "modules", "ai-mcp", "route-catalog.generated.ts");
    let foundKnown = false;
    if (fs.existsSync(viewReg)) {
      foundKnown = true;
      const reg = parseViewRegistryFile(viewReg);
      for (const r of reg.routes) routes.add(r);
      for (const sc of reg.scopes) scopes.add(sc);
    }
    if (fs.existsSync(routeCat)) {
      foundKnown = true;
      const cat = parseRouteCatalogFile(routeCat);
      if (cat.endpoints.length > 0) staticCatalogUsed = true;
      for (const ep of cat.endpoints) endpoints.add(ep);
      for (const sc of cat.scopes) scopes.add(sc);
    }
    if (!foundKnown) {
      for (const ep of scanGenericStaticRoutes(absRepo)) {
        endpoints.add(ep);
      }
    }
  }

  const memoryDir = path.resolve(opts.memoryDir || MEMORY_DIR);
  const traceDir = path.resolve(opts.traceDir || path.join(memoryDir, "traces"));
  const tsSlug = startedAt.replace(/[:.]/g, "-");
  const tracePath = path.join(traceDir, `discover-surface-${tsSlug}.json`);
  const relTracePath = toStagingRelPath(tracePath);

  if (apiReachable && !openApiFound) {
    findings.push({
      id: "QA-DISC-001",
      fingerprint: "spec_gap|openapi_missing",
      classification: "spec_gap",
      severity: "medium",
      title: "OpenAPI specification missing at /openapi.json",
      endpointOrRoute: "/openapi.json",
      checkMode: "status_404_spec_gap",
      reproCommand: `curl -i ${new URL(apiUrl).origin}/openapi.json`,
      evidencePaths: [relTracePath],
      verifiedOutcome: staticCatalogUsed
        ? `GET /openapi.json returned ${healthMatrix.openapi?.status ?? 404}; fell back to static route-catalog.generated.ts (no OpenAPI JSON schema)`
        : `GET /openapi.json returned ${healthMatrix.openapi?.status ?? 404} without static catalog fallback`,
    });
  }

  if (aiUrl && aiDegraded) {
    findings.push({
      id: `QA-DISC-${String(findings.length + 1).padStart(3, "0")}`,
      classification: "runtime_degraded",
      severity: "low",
      title: "Optional AI endpoint timed out or unreachable during surface discovery",
      reproCommand: `curl --max-time 4 ${aiUrl}`,
      evidencePaths: [relTracePath],
      verifiedOutcome: "AI service health probe timed out or refused connection; remaining QA phases continue",
    });
  }

  let status = "passed";
  if (!targetReachable && !apiReachable) {
    status = "failed";
  } else if ((apiReachable && !openApiFound && !staticCatalogUsed) || aiDegraded) {
    status = "degraded";
  }

  const output = {
    tool: "discover-surface",
    mode: "discovery",
    status,
    startedAt,
    durationMs: Date.now() - startedMs,
    budgetConsumed: {
      requests,
      aiCalls: 0,
    },
    coverage: {
      routes: Array.from(routes),
      endpoints: Array.from(endpoints),
      roles: Array.from(roles),
      scopes: Array.from(scopes),
      assertions,
    },
    findings,
    artifacts: {
      traces: [relTracePath],
      screenshots: [],
      regressionTests: [],
    },
    notes: `Discovered ${routes.size} route(s), ${endpoints.size} endpoint(s), and ${scopes.size} scope(s); openApiFound=${openApiFound}, staticCatalogUsed=${staticCatalogUsed}, aiDegraded=${aiDegraded}.`,
  };

  writeJsonAtomic(tracePath, {
    ...output,
    healthMatrix,
    authHints,
    endpointMetadata,
    discoveredScopes: Array.from(scopes),
    targetUrl: targetUrl || null,
    apiUrl: apiUrl || null,
    aiUrl: aiUrl || null,
  });

  if (opts.out) {
    writeJsonAtomic(path.resolve(process.cwd(), opts.out), output);
  }

  return sanitizeForOutput(output);
}

async function main() {
  const { values } = parseCliArgs(process.argv.slice(2), {
    booleanFlags: ["help"],
    multiFlags: ["repo-path"],
  });

  if (values.help) {
    console.log(
      "Usage: node scripts/discover-surface.mjs [--config <path>] --target-url <url> [--api-url <url>] [--ai-url <url>] [--oidc-url <url>] [--openapi-url <url>] [--repo-path <path>] [--timeout-ms N] [--memory-dir <dir>] [--trace-dir <dir>] [--out <file>]",
    );
    process.exit(0);
  }

  const out = await runDiscovery({
    config: values.config,
    targetUrl: values["target-url"],
    apiUrl: values["api-url"],
    aiUrl: values["ai-url"],
    oidcUrl: values["oidc-url"],
    openapiUrl: values["openapi-url"],
    repoPaths: values["repo-path"],
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
