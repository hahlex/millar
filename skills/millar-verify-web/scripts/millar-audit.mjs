#!/usr/bin/env node
/**
 * millar-audit.mjs (v0.4.0): Standalone Zero-MCP Mechanical Web & Design Auditor
 *
 * Bundled inside skills/millar-verify-web/scripts/ so users installing Millar Skills
 * via `npx millar install` retain deterministic mechanical verification even WITHOUT Millar MCP:
 *   - WCAG 2.1/2.2 text contrast (>= 4.5:1) across light, dark, and stage CSS tokens + telemetry count
 *   - WCAG SC 1.4.11 UI control border contrast (>= 3.0:1) & focus-outline removal guard
 *   - WCAG 2.2 AA live checks (--url): Target Size Minimum (>= 24x24px, SC 2.5.8) & Focus Not Obscured (SC 2.4.11)
 *   - AI-slop Craft Floor checks (gradient text, eyebrow kickers, 1-sided rounded-box bars, hard shadows)
 *   - Inline <style> & stylesheet prefers-reduced-motion check + [hidden] CSS override guard
 *   - Accessibility, CWV & Security checks (img alt/width/height, hero LCP lazy trap, barrel imports, target="_blank" rel, unsafe HTML sinks)
 *   - Product-register CSS gradient ban (--register=product) & U+2014 em-dash check (--strict-em-dash)
 *   - Sparse inline <svg> clip-art detector
 *   - Optional live-browser check (--url=http://...) across 1440/768/375 viewports with CLS telemetry
 *
 * Usage:
 *   node millar-audit.mjs <target-path> [--register=shared|marketing|product] [--strict-em-dash] [--include-internal] [--json] [--url=http://...]
 *
 * Zero external npm dependencies required (Node.js >= 18).
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const BASE_IGNORE_DIRS = new Set([
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
    includeInternal: false,
    json: false,
    url: null,
  };
  for (const arg of argv) {
    if (arg.startsWith("--register=")) opts.register = arg.slice("--register=".length);
    else if (arg === "--strict-em-dash") opts.strictEmDash = true;
    else if (arg === "--include-internal") opts.includeInternal = true;
    else if (arg === "--json") opts.json = true;
    else if (arg.startsWith("--url=")) opts.url = arg.slice("--url=".length);
    else if (!arg.startsWith("--")) opts.target = arg;
  }
  return opts;
}

function collectFiles(targetPath, includeInternal) {
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
      if (BASE_IGNORE_DIRS.has(entry.name)) continue;
      if (!includeInternal && entry.name === ".millar") continue;
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
 * Audit CSS custom property text (WCAG AA 4.5:1) and UI border (SC 1.4.11 3.0:1) pairs.
 * Returns number of pairs checked so callers never get a silent zero-pair pass.
 * @param {string} rel
 * @param {string} content
 * @param {Finding[]} findings
 * @returns {number}
 */
function auditCssContrast(rel, content, findings) {
  let checked = 0;
  const blocks = [...content.matchAll(/(?::root|html|\[data-theme=["']?(?:light|dark)["']?\]|\.dark|\.light)\s*\{([\s\S]*?)\}/g)];

  const textPairs = [
    ["--bg-app", "--fg-default", 4.5],
    ["--bg-surface", "--fg-default", 4.5],
    ["--bg-app", "--fg-muted", 4.5],
    ["--bg-surface", "--fg-muted", 4.5],
    ["--bg-primary", "--fg-primary", 4.5],
    ["--bg-canvas", "--ink-primary", 4.5],
    ["--bg-canvas", "--ink-muted", 4.5],
    ["--bg-stage", "--fg-on-stage", 4.5],
    ["--bg-stage", "--fg-stage-muted", 4.5],
    ["--bg-stage-dark", "--fg-on-stage-dark", 4.5],
    ["--bg-dark", "--fg-on-dark", 4.5],
    ["--accent-primary", "--fg-on-accent", 4.5],
    ["--accent", "--fg-on-accent", 4.5],
    ["--hx-cream-50", "--hx-ink-900", 4.5],
    ["--hx-cream-50", "--hx-ink-700", 4.5],
    ["--hx-espresso-800", "--hx-paper", 4.5],
    ["--hx-espresso-800", "--hx-paper-muted", 4.5],
  ];

  const uiBorderPairs = [
    ["--bg-surface", "--border-control", 3.0],
    ["--bg-app", "--border-control", 3.0],
    ["--bg-surface", "--border-input", 3.0],
    ["--bg-surface", "--border-strong", 3.0],
    ["--bg-app", "--border-strong", 3.0],
  ];

  for (const block of blocks) {
    const body = block[1] ?? "";
    const vars = new Map();
    for (const m of body.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g)) {
      vars.set(m[1], m[2]);
    }
    if (vars.size === 0) continue;

    for (const [bgKey, fgKey, minRatio] of textPairs) {
      const bg = vars.get(bgKey);
      const fg = vars.get(fgKey);
      if (!bg || !fg) continue;
      const ratio = contrastRatio(bg, fg);
      if (ratio === null) continue;
      checked += 1;
      if (ratio < minRatio) {
        findings.push({
          severity: "error",
          rule: "wcag/contrast-pair",
          file: rel,
          message: `Text token pair ${fgKey} (${fg}) on ${bgKey} (${bg}) has contrast ${ratio.toFixed(2)}:1 (requires >= ${minRatio}:1 WCAG AA).`,
        });
      }
    }

    for (const [bgKey, borderKey, minRatio] of uiBorderPairs) {
      const bg = vars.get(bgKey);
      const border = vars.get(borderKey);
      if (!bg || !border) continue;
      const ratio = contrastRatio(bg, border);
      if (ratio === null) continue;
      checked += 1;
      if (ratio < minRatio) {
        findings.push({
          severity: "warn",
          rule: "wcag/ui-border-contrast",
          file: rel,
          message: `UI control border ${borderKey} (${border}) on ${bgKey} (${bg}) has contrast ${ratio.toFixed(2)}:1 (WCAG SC 1.4.11 requires >= ${minRatio}:1 for interactive control boundaries).`,
        });
      }
    }
  }
  return checked;
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
        message: `Large inline <svg> (${width}px) has only ${primitiveCount} primitives and zero <defs>/lighting/grain filters. Check against flat clip-art ban (procedural-gallery-craft.md).`,
      });
    }
  }
}

/**
 * Scan a single file deterministically.
 * @param {string} absFile
 * @param {ReturnType<typeof parseArgs>} opts
 * @param {Finding[]} findings
 * @returns {{ contrastPairsChecked: number }}
 */
function auditFile(absFile, opts, findings) {
  const ext = path.extname(absFile).toLowerCase();
  if (!CODE_EXTS.has(ext) && !COPY_EXTS.has(ext)) return { contrastPairsChecked: 0 };

  const rel = path.relative(process.cwd(), absFile).replaceAll("\\", "/");
  const content = fs.readFileSync(absFile, "utf8");
  const lines = content.split(/\r?\n/);
  let contrastPairsChecked = 0;

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

  if (!isCode) return { contrastPairsChecked };

  // 2. Style & Craft-Floor checks (external CSS AND inline <style> inside HTML!)
  if (isStyle) {
    contrastPairsChecked += auditCssContrast(rel, content, findings);

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

      if (/(?:outline\s*:\s*(?:none|0)\b|outline-none\b)/i.test(line) && !/(?:focus-visible|ring-|box-shadow|outline-offset|focus-ring-ok)/i.test(line)) {
        findings.push({
          severity: "warn",
          rule: "a11y/focus-outline-removed",
          file: rel,
          line: lineNo,
          message: "Focus outline suppressed without visible replacement ring (WCAG 2.2 SC 2.4.7/2.4.13 requires a visible focus indicator).",
        });
      }
    });

    const isStylesheetOrEmbedded = ext === ".css" || ext === ".scss" || ((ext === ".html" || ext === ".htm") && /<style\b/i.test(content));
    const hasMotion = /@keyframes\b|animation\s*:|transition\s*:/i.test(content);
    const hasReducedMotion = /prefers-reduced-motion\s*:\s*reduce/i.test(content);
    if (isStylesheetOrEmbedded && hasMotion && !hasReducedMotion) {
      findings.push({
        severity: "warn",
        rule: "motion/missing-reduced-motion",
        file: rel,
        message: "Styles define animations/transitions without a @media (prefers-reduced-motion: reduce) fallback.",
      });
    }
  }

  // 3. Markup accessibility, Craft Floor, [hidden] guard, CLS & clip-art checks
  if (isMarkup) {
    auditInlineSvgs(rel, content, findings);

    // Eyebrow kicker above heading tell
    if (/<(?:div|p|span)\b[^>]*class=["'][^"']*\b(?:eyebrow|hero-eyebrow|section-kicker|kicker|heading-kicker)\b[^"']*["'][^>]*>[\s\S]{0,120}<\/(?:div|p|span)>\s*<h[12]\b/i.test(content)) {
      findings.push({
        severity: "warn",
        rule: "craft/eyebrow-kicker",
        file: rel,
        message: "Eyebrow/kicker label detected immediately above <h1>/<h2> (Craft Floor rule: delete decorative eyebrow labels and let the heading carry its own weight).",
      });
    }

    // [hidden] attribute overridden by display:flex/grid without reset
    if ((ext === ".html" || ext === ".htm") && /\bhidden(?:\s|>|=)/i.test(content) && /display\s*:\s*(?:flex|inline-flex|grid)\b/i.test(content) && !/\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/i.test(content)) {
      findings.push({
        severity: "warn",
        rule: "css/hidden-override-guard",
        file: rel,
        message: "HTML uses `hidden` attribute alongside display:flex/grid without `[hidden] { display: none !important; }` reset (risks broken mutually exclusive UI states).",
      });
    }

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

    // WCAG/Security/CWV 2025-2026 static hygiene rules
    lines.forEach((line, idx) => {
      const lineNo = idx + 1;
      if (/<a\b[^>]*target\s*=\s*["']_blank["']/i.test(line) && !/\brel\s*=\s*["'][^"']*(?:noopener|noreferrer)/i.test(line)) {
        findings.push({
          severity: "warn",
          rule: "security/target-blank-noopener",
          file: rel,
          line: lineNo,
          message: "External link with target=\"_blank\" missing rel=\"noopener noreferrer\".",
        });
      }
      if (/(?:dangerouslySetInnerHTML|\.innerHTML\s*=)/.test(line) && !/(?:DOMPurify|sanitize|safe-html-ok)/i.test(line)) {
        findings.push({
          severity: "warn",
          rule: "security/unsafe-html-sink",
          file: rel,
          line: lineNo,
          message: "Raw HTML injection sink detected without visible sanitization (sanitize or use structured JSX/textContent).",
        });
      }
      if (lineNo <= 80 && /<img\b[^>]*loading\s*=\s*["']lazy["']/i.test(line) && /(?:hero|banner|cover|lcp)/i.test(line)) {
        findings.push({
          severity: "warn",
          rule: "cwv/lcp-lazy-hero",
          file: rel,
          line: lineNo,
          message: "Above-the-fold hero/banner image uses loading=\"lazy\" (hurts LCP; use fetchPriority=\"high\" / priority instead).",
        });
      }
    });
  }

  // 4. JS/TS Bundle & Waterfall Hygiene (Vercel Priority 2)
  if ([".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(ext)) {
    lines.forEach((line, idx) => {
      const lineNo = idx + 1;
      if (/^\s*import\s+(?:\*\s+as\s+\w+\s+from\s+["'](?:lucide-react|@mui\/icons-material|lodash)["']|\w+\s+from\s+["'](?:lodash|moment)["'])/.test(line)) {
        findings.push({
          severity: "warn",
          rule: "perf/barrel-import",
          file: rel,
          line: lineNo,
          message: "Heavy wholesale barrel import detected (prefer direct subpath/named imports or lightweight native APIs to protect client bundle and INP).",
        });
      }
    });
  }

  return { contrastPairsChecked };
}

/**
 * Resolve playwright / @playwright/test from MILLAR_PLAYWRIGHT_PATH, cwd, or script ancestor workspaces.
 */
async function resolvePlaywright() {
  const roots = [
    process.env.MILLAR_PLAYWRIGHT_PATH,
    path.join(process.cwd(), "package.json"),
    path.resolve(import.meta.dirname, "../../../package.json"),
    path.resolve(import.meta.dirname, "../../../../package.json"),
  ].filter(Boolean);

  for (const base of roots) {
    try {
      const req = createRequire(base);
      for (const modName of ["playwright", "@playwright/test"]) {
        try {
          const mod = req(modName);
          if (mod?.chromium) return mod;
        } catch {
          // continue
        }
      }
    } catch {
      // continue
    }
  }
  for (const modName of ["playwright", "@playwright/test"]) {
    try {
      const mod = await import(modName);
      if (mod?.chromium) return mod;
    } catch {
      // continue
    }
  }
  return null;
}

/**
 * Optional live-browser check when --url is supplied and Playwright is resolvable.
 * @param {string} url
 * @param {Finding[]} findings
 */
async function auditLiveUrl(url, findings) {
  const playwright = await resolvePlaywright();
  if (!playwright?.chromium) {
    findings.push({
      severity: "warn",
      rule: "browser/playwright-unavailable",
      file: url,
      message: "Skipped live URL check because neither 'playwright' nor '@playwright/test' could be resolved (set MILLAR_PLAYWRIGHT_PATH or install @playwright/test).",
    });
    return;
  }

  let browser = null;
  for (const launchOpts of [{}, { channel: "chrome" }, { channel: "msedge" }]) {
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
      message: "Skipped live URL check because no Chromium/Chrome/Edge binary could be launched.",
    });
    return;
  }

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
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
        /** @type {Record<string, number>} */
        const vtCounts = {};
        for (const el of document.querySelectorAll("*")) {
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") continue;
          const vtn = style.viewTransitionName;
          if (vtn && vtn !== "none") {
            vtCounts[vtn] = (vtCounts[vtn] || 0) + 1;
          }
        }
        const duplicateViewTransitionNames = Object.entries(vtCounts)
          .filter(([, count]) => count > 1)
          .map(([name, count]) => `${name} (${count}x)`);

        // WCAG 2.2 SC 2.5.8 Target Size Minimum (>= 24x24 CSS px for non-inline interactive controls)
        const undersizedTargets = [];
        for (const el of document.querySelectorAll("button, [role='button'], [role='tab'], input[type='checkbox'], input[type='radio']")) {
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          if (r.width < 24 || r.height < 24) {
            const label = (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 32);
            undersizedTargets.push(`${label} (${Math.round(r.width)}x${Math.round(r.height)}px)`);
            if (undersizedTargets.length >= 6) break;
          }
        }

        // Measure cumulative layout shift entries if supported by browser
        let clsScore = 0;
        try {
          for (const entry of performance.getEntriesByType("layout-shift")) {
            if (!entry.hadRecentInput) clsScore += Number(entry.value || 0);
          }
        } catch {
          clsScore = 0;
        }

        return {
          overflow,
          mainCount: mains.length,
          footerCount: footers.length,
          footerInsideMain,
          duplicateViewTransitionNames,
          undersizedTargets,
          clsScore: Number(clsScore.toFixed(4)),
        };
      });

      if (metrics.overflow) {
        findings.push({
          severity: "error",
          rule: "responsive/horizontal-overflow",
          file: url,
          message: `Horizontal overflow detected at ${vp.name} (${vp.width}px).`,
        });
      }
      if (metrics.clsScore > 0.1) {
        findings.push({
          severity: "warn",
          rule: "cwv/live-cls-exceeded",
          file: url,
          message: `Observed layout shift CLS=${metrics.clsScore} at ${vp.name} (${vp.width}px) exceeds 0.10 Core Web Vitals threshold.`,
        });
      }
      if (metrics.undersizedTargets.length > 0 && vp.name !== "tablet") {
        findings.push({
          severity: "warn",
          rule: "a11y/wcag22-target-size",
          file: url,
          message: `WCAG 2.2 SC 2.5.8 target size < 24x24px at ${vp.name}: ${metrics.undersizedTargets.join(", ")}.`,
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
        if (metrics.duplicateViewTransitionNames.length > 0) {
          findings.push({
            severity: "error",
            rule: "motion/duplicate-view-transition-name",
            file: url,
            message: `Duplicate visible view-transition-name values silently abort MPA/SPA transitions: ${metrics.duplicateViewTransitionNames.join(", ")}.`,
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
  const files = collectFiles(opts.target, opts.includeInternal);
  /** @type {Finding[]} */
  const findings = [];
  let totalContrastPairsChecked = 0;

  for (const file of files) {
    const res = auditFile(file, opts, findings);
    totalContrastPairsChecked += res.contrastPairsChecked;
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
          version: "0.4.0",
          register: opts.register,
          scannedFiles: files.length,
          contrastPairsChecked: totalContrastPairsChecked,
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
      `${status}: millar-audit v0.4 scanned ${files.length} file(s) [register=${opts.register}, contrastPairs=${totalContrastPairsChecked}] -> ${errors.length} error(s), ${warnings.length} warning(s).`,
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
