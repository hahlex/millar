#!/usr/bin/env node
/**
 * millar-audit.mjs: Standalone Zero-MCP Mechanical Web & Design Auditor
 *
 * Bundled inside skills/millar-verify-web/scripts/ so users installing Millar Skills
 * via `npx skills add https://github.com/hahlex/millar` retain deterministic mechanical
 * verification (WCAG contrast, AI-slop craft floor, em-dash, reduced-motion, CLS/a11y,
 * product gradient policy, and sparse clip-art SVG detection) even WITHOUT Millar MCP.
 *
 * Usage:
 *   node millar-audit.mjs <target-path> [--register=shared|marketing|product] [--strict-em-dash] [--json] [--url=http://...]
 *
 * Zero external npm dependencies required (Node.js >= 18).
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "out",
  "build",
  "coverage",
  ".turbo",
  "playwright-report",
  "test-results",
]);

const CODE_EXTS = new Set([".html", ".htm", ".css", ".scss", ".tsx", ".jsx", ".ts", ".js", ".vue", ".svelte", ".astro"]);
const COPY_EXTS = new Set([".html", ".htm", ".tsx", ".jsx", ".md", ".mdx", ".vue", ".svelte", ".astro"]);
const EM_DASH = "\u2014";

/** @typedef {{ severity: "error" | "warn"; rule: string; file: string; line?: number; message: string }} Finding */

function parseArgs(argv) {
  const opts = {
    target: ".",
    register: "shared",
    strictEmDash: false,
    json: false,
    url: null,
  };
  for (const arg of argv) {
    if (arg.startsWith("--register=")) opts.register = arg.slice("--register=".length);
    else if (arg === "--strict-em-dash") opts.strictEmDash = true;
    else if (arg === "--json") opts.json = true;
    else if (arg.startsWith("--url=")) opts.url = arg.slice("--url=".length);
    else if (!arg.startsWith("--")) opts.target = arg;
  }
  return opts;
}

function collectFiles(targetPath) {
  const abs = path.resolve(process.cwd(), targetPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Target path does not exist: ${abs}`);
  }
  const stat = fs.statSync(abs);
  if (stat.isFile()) return [abs];

  /** @type {string[]} */
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(full);
    }
  }
  walk(abs);
  return files;
}

function parseHexColor(hex) {
  const clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    return clean.split("").map((c) => parseInt(c + c, 16));
  }
  if (clean.length === 6) {
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
  }
  return null;
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA, hexB) {
  const a = parseHexColor(hexA);
  const b = parseHexColor(hexB);
  if (!a || !b) return null;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Audit CSS custom property background/foreground pairs declared in stylesheets.
 * @param {string} rel
 * @param {string} content
 * @param {Finding[]} findings
 */
function auditCssContrast(rel, content, findings) {
  const blocks = [...content.matchAll(/(?::root|\[data-theme=["']?(?:light|dark)["']?\])\s*\{([\s\S]*?)\}/g)];
  for (const block of blocks) {
    const body = block[1] ?? "";
    const vars = new Map();
    for (const m of body.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g)) {
      vars.set(m[1], m[2]);
    }
    const bgPairs = [
      ["--bg-app", "--fg-default", 4.5],
      ["--bg-surface", "--fg-default", 4.5],
      ["--bg-app", "--fg-muted", 4.5],
      ["--bg-surface", "--fg-muted", 4.5],
      ["--bg-primary", "--fg-primary", 4.5],
      ["--accent-primary", "--fg-on-accent", 4.5],
    ];
    for (const [bgKey, fgKey, minRatio] of bgPairs) {
      const bg = vars.get(bgKey);
      const fg = vars.get(fgKey);
      if (!bg || !fg) continue;
      const ratio = contrastRatio(bg, fg);
      if (ratio !== null && ratio < minRatio) {
        findings.push({
          severity: "error",
          rule: "wcag/contrast-pair",
          file: rel,
          message: `Token pair ${fgKey} (${fg}) on ${bgKey} (${bg}) has contrast ${ratio.toFixed(2)}:1 (requires >= ${minRatio}:1 WCAG AA).`,
        });
      }
    }
  }
}

/**
 * Audit inline editorial SVGs for flat low-primitive clip-art tells.
 * @param {string} rel
 * @param {string} content
 * @param {Finding[]} findings
 */
function auditInlineSvgs(rel, content, findings) {
  const svgs = [...content.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/gi)];
  for (const match of svgs) {
    const attrs = match[1] ?? "";
    const inner = match[2] ?? "";
    // Skip small UI icons (<= 64px)
    const widthMatch = attrs.match(/\bwidth\s*=\s*["']?(\d+)/i);
    const viewBoxMatch = attrs.match(/viewBox\s*=\s*["']?\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/i);
    const width = widthMatch ? Number(widthMatch[1]) : viewBoxMatch ? Number(viewBoxMatch[1]) : 0;
    if (width < 180) continue;

    const primitiveCount = (inner.match(/<(?:path|circle|ellipse|rect|polygon|polyline|line)\b/gi) ?? []).length;
    const hasDepthDefs = /<(?:defs|filter|linearGradient|radialGradient|pattern|feTurbulence)\b/i.test(inner);
    if (primitiveCount > 0 && primitiveCount < 15 && !hasDepthDefs) {
      findings.push({
        severity: "warn",
        rule: "craft/sparse-svg-clipart",
        file: rel,
        message: `Large inline <svg> (${width}px) has only ${primitiveCount} primitives and zero <defs>/lighting/grain filters. Check against flat clip-art ban (millar-create-image procedural-gallery-craft.md).`,
      });
    }
  }
}

/**
 * Scan a single file deterministically.
 * @param {string} absFile
 * @param {ReturnType<typeof parseArgs>} opts
 * @param {Finding[]} findings
 */
function auditFile(absFile, opts, findings) {
  const ext = path.extname(absFile).toLowerCase();
  if (!CODE_EXTS.has(ext) && !COPY_EXTS.has(ext)) return;

  const rel = path.relative(process.cwd(), absFile).replaceAll("\\", "/");
  const content = fs.readFileSync(absFile, "utf8");
  const lines = content.split(/\r?\n/);

  const isCode = CODE_EXTS.has(ext);
  const isMarkup = [".html", ".htm", ".tsx", ".jsx", ".vue", ".svelte", ".astro"].includes(ext);
  const isStyle = [".css", ".scss", ".html", ".htm", ".tsx", ".jsx"].includes(ext);

  // 1. Em-dash check
  if (COPY_EXTS.has(ext) || isCode) {
    lines.forEach((line, idx) => {
      if (!line.includes(EM_DASH) || line.includes("em-dash-fixture-ok")) return;
      findings.push({
        severity: opts.strictEmDash ? "error" : "warn",
        rule: "copy/em-dash",
        file: rel,
        line: idx + 1,
        message: "Contains U+2014 em-dash character (replace with colon, comma, parentheses, or hyphen).",
      });
    });
  }

  if (!isCode) return;

  // 2. Style & Craft-Floor checks
  if (isStyle) {
    auditCssContrast(rel, content, findings);

    lines.forEach((line, idx) => {
      const lineNo = idx + 1;

      if (/(?:background-clip\s*:\s*text|bg-clip-text)/i.test(line)) {
        findings.push({
          severity: "error",
          rule: "craft/no-gradient-text",
          file: rel,
          line: lineNo,
          message: "Gradient text detected (craft floor ban: use weight, scale, or contrast instead).",
        });
      }

      if (opts.register === "product" && /(?:linear-gradient|radial-gradient|conic-gradient)\s*\(/i.test(line) && !line.includes("approved-visual-asset")) {
        findings.push({
          severity: "error",
          rule: "product/no-css-gradients",
          file: rel,
          line: lineNo,
          message: "CSS gradient detected in Product UI register (forbidden on operational chrome).",
        });
      }

      if (/box-shadow\s*:[^;]*\b[3-8]px\s+[3-8]px\s+0(?:px)?\b/i.test(line) && !line.includes("neobrutalist-ok")) {
        findings.push({
          severity: "warn",
          rule: "craft/hard-offset-shadow",
          file: rel,
          line: lineNo,
          message: "Zero-blur hard offset box-shadow detected (only valid in an intentional neobrutalist system).",
        });
      }

      if (/border-left\s*:\s*[3-6]px\s+solid\b/i.test(line)) {
        findings.push({
          severity: "warn",
          rule: "craft/one-sided-border-strip",
          file: rel,
          line: lineNo,
          message: "Thick 1-sided border-left strip detected (avoid on rounded cards; prefer full hairline border, surface tint, or leading icon).",
        });
      }

      if (/font-size\s*:\s*(?:[6-9]|10)px\b/i.test(line)) {
        findings.push({
          severity: "warn",
          rule: "a11y/undersized-text",
          file: rel,
          line: lineNo,
          message: "Text size <= 10px detected (fails readability floor; keep UI micro labels >= 11-12px and body >= 14-16px).",
        });
      }
    });

    const hasMotion = /@keyframes\b|animation\s*:|transition\s*:/i.test(content);
    const hasReducedMotion = /prefers-reduced-motion\s*:\s*reduce/i.test(content);
    if ((ext === ".css" || ext === ".scss") && hasMotion && !hasReducedMotion) {
      findings.push({
        severity: "warn",
        rule: "motion/missing-reduced-motion",
        file: rel,
        message: "Stylesheet defines animations/transitions without a @media (prefers-reduced-motion: reduce) fallback.",
      });
    }
  }

  // 3. Markup accessibility, CLS & clip-art checks
  if (isMarkup) {
    auditInlineSvgs(rel, content, findings);

    for (const imgMatch of content.matchAll(/<img\b([^>]*)>/gi)) {
      const attrs = imgMatch[1] ?? "";
      if (!/\balt\s*=/i.test(attrs)) {
        findings.push({
          severity: "error",
          rule: "a11y/img-missing-alt",
          file: rel,
          message: "<img> element missing alt attribute.",
        });
      }
      if (!/\bwidth\s*=/i.test(attrs) && !/\baspect-ratio\b/i.test(attrs)) {
        findings.push({
          severity: "warn",
          rule: "cwv/img-missing-dimensions",
          file: rel,
          message: "<img> missing explicit width/height (risks Cumulative Layout Shift).",
        });
      }
    }

    if (/(?:opacity:\s*0\b|opacity-0\b)/.test(content) && /(?:IntersectionObserver|data-reveal|scroll)/i.test(content) && !/prefers-reduced-motion/i.test(content)) {
      findings.push({
        severity: "warn",
        rule: "motion/potential-scroll-trap",
        file: rel,
        message: "Potential opacity: 0 scroll-reveal trap detected without explicit prefers-reduced-motion visible fallback.",
      });
    }
  }
}

/**
 * Optional live-browser check when --url is supplied and Playwright is installed.
 * @param {string} url
 * @param {Finding[]} findings
 */
async function auditLiveUrl(url, findings) {
  let playwright = null;
  const cwdRequire = createRequire(path.join(process.cwd(), "package.json"));
  for (const modName of ["playwright", "@playwright/test"]) {
    try {
      playwright = cwdRequire(modName);
      if (playwright?.chromium) break;
    } catch {
      try {
        playwright = await import(modName);
        if (playwright?.chromium) break;
      } catch {
        playwright = null;
      }
    }
  }
  if (!playwright?.chromium) {
    findings.push({
      severity: "warn",
      rule: "browser/playwright-unavailable",
      file: url,
      message: "Skipped live URL check because neither 'playwright' nor '@playwright/test' is installed in the current workspace.",
    });
    return;
  }

  let browser = null;
  const launchAttempts = [{}, { channel: "chrome" }, { channel: "msedge" }];
  for (const launchOpts of launchAttempts) {
    try {
      browser = await playwright.chromium.launch(launchOpts);
      break;
    } catch {
      browser = null;
    }
  }
  if (!browser) {
    findings.push({
      severity: "warn",
      rule: "browser/launch-unavailable",
      file: url,
      message: "Skipped live URL check because no Chromium/Chrome/Edge binary could be launched (run `npx playwright install chromium` or install Chrome/Edge).",
    });
    return;
  }
  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    const httpErrors = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("response", (res) => {
      if (res.status() >= 400) httpErrors.push(`${res.status()} ${res.url()}`);
    });

    for (const vp of [
      { name: "desktop", width: 1440, height: 900 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "mobile", width: 375, height: 812 },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });

      const metrics = await page.evaluate(() => {
        const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
        const mains = document.querySelectorAll("main");
        const footers = document.querySelectorAll("footer");
        const footerInsideMain = Boolean(mains[0] && footers[0] && mains[0].contains(footers[0]));
        return { overflow, mainCount: mains.length, footerCount: footers.length, footerInsideMain };
      });

      if (metrics.overflow) {
        findings.push({
          severity: "error",
          rule: "responsive/horizontal-overflow",
          file: url,
          message: `Horizontal overflow detected at ${vp.name} (${vp.width}px).`,
        });
      }
      if (vp.name === "desktop") {
        if (metrics.mainCount !== 1) {
          findings.push({
            severity: "error",
            rule: "a11y/landmark-main",
            file: url,
            message: `Expected exactly 1 <main> landmark, found ${metrics.mainCount}.`,
          });
        }
        if (metrics.footerInsideMain) {
          findings.push({
            severity: "error",
            rule: "a11y/footer-outside-main",
            file: url,
            message: "Top-level <footer> must sit outside <main>.",
          });
        }
      }
    }

    for (const err of consoleErrors) {
      findings.push({ severity: "error", rule: "browser/console-error", file: url, message: err });
    }
    for (const err of httpErrors) {
      findings.push({ severity: "error", rule: "browser/http-error", file: url, message: err });
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const files = collectFiles(opts.target);
  /** @type {Finding[]} */
  const findings = [];

  for (const file of files) {
    auditFile(file, opts, findings);
  }
  if (opts.url) {
    await auditLiveUrl(opts.url, findings);
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warn");

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          tool: "millar-audit",
          version: "0.2.0",
          register: opts.register,
          scannedFiles: files.length,
          passed: errors.length === 0,
          errorCount: errors.length,
          warningCount: warnings.length,
          findings,
        },
        null,
        2,
      ),
    );
  } else {
    const status = errors.length === 0 ? "PASS" : "FAIL";
    console.log(
      `${status}: millar-audit scanned ${files.length} file(s) [register=${opts.register}] -> ${errors.length} error(s), ${warnings.length} warning(s).`,
    );
    for (const f of findings) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      console.log(`  [${f.severity.toUpperCase()}] ${f.rule} (${loc}): ${f.message}`);
    }
  }

  process.exit(errors.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(`millar-audit fatal error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(2);
});
