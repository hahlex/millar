import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compileMillar,
  machadoColorBlindDeltaE,
  wcagContrastRatio,
} from "./index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("Millar Core Color Math (Independent WCAG & Machado Reference Literals)", () => {
  it("computes exact WCAG 2.1 contrast ratios against known reference pairs", () => {
    expect(wcagContrastRatio("#ffffff", "#000000")).toBeCloseTo(21.0, 2);
    expect(wcagContrastRatio("#ffffff", "#4a3022")).toBeCloseTo(12.09, 1);
    expect(wcagContrastRatio("#fff8f0", "#1a130d")).toBeCloseTo(17.44, 1);
    expect(wcagContrastRatio("#362218", "#d6b48a")).toBeCloseTo(7.69, 1);
    // Legacy failing marketing bronze pair verified in Audit 02
    expect(wcagContrastRatio("#fff8f0", "#a26a25")).toBeLessThan(4.5);
    expect(wcagContrastRatio("#fff8f0", "#c08a4a")).toBeLessThan(3.0);
  });

  it("verifies multi-series data-viz tokens stay distinguishable under protanopia & deuteranopia", () => {
    const series = ["#3d2a1c", "#965eac", "#359d87", "#304a96"];
    for (let i = 0; i < series.length; i += 1) {
      for (let j = i + 1; j < series.length; j += 1) {
        const res = machadoColorBlindDeltaE(series[i]!, series[j]!);
        expect(res.minDeltaE).toBeGreaterThanOrEqual(8);
      }
    }
  });
});

describe("Millar Deep Compiler Seam (W3C DTCG 2025.10 -> Tokens & Registry)", () => {
  it("compiles tokens with 100% WCAG AA contrast pass across Light and Dark themes", () => {
    const result = compileMillar({ rootDir: REPO_ROOT, writeFiles: false });

    expect(result.registry.dtcgSpecVersion).toBe("2025.10");
    expect(result.registry.contrastSummary.totalChecked).toBeGreaterThanOrEqual(30);
    expect(result.registry.contrastSummary.failed).toBe(0);
    expect(result.registry.colorBlindSummary.passed).toBe(true);
  });

  it("emits layered CSS with :root:lang(vi) diacritic safety and prefers-reduced-motion", () => {
    const result = compileMillar({ rootDir: REPO_ROOT, writeFiles: false });

    expect(result.outputs.tokensCss).toContain(":root {");
    expect(result.outputs.tokensCss).toContain(':root[data-theme="dark"]');
    expect(result.outputs.tokensCss).toContain(":root:lang(vi)");
    expect(result.outputs.tokensCss).toContain("--leading-display-hero: 1.2;");
    expect(result.outputs.tokensCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(result.outputs.tokensCss).toContain("--text-kpi: 1.5rem;");
  });

  it("emits Tailwind CSS v4 @theme inline block for dynamic dark-mode custom property resolution", () => {
    const result = compileMillar({ rootDir: REPO_ROOT, writeFiles: false });

    expect(result.outputs.tailwindCss).toContain("@theme inline {");
    expect(result.outputs.tailwindCss).toContain("--color-bg-app: var(--bg-app);");
    expect(result.outputs.tailwindCss).toContain("--color-fg-on-accent-soft: var(--fg-on-accent-soft);");
  });

  it("emits literal hex/rgba TypeScript mirrors for Ant Design 6 parity (never var() strings)", () => {
    const result = compileMillar({ rootDir: REPO_ROOT, writeFiles: false });

    expect(result.outputs.tokensTs).toContain("export const MILLAR_LIGHT_TOKENS =");
    expect(result.outputs.tokensTs).toContain("export const MILLAR_DARK_TOKENS =");
    expect(result.outputs.tokensTs).toContain('"accent": "#4a3022"');
    expect(result.outputs.tokensTs).toContain('"fgOnAccentSoft": "#362218"');
    expect(result.outputs.tokensTs).not.toMatch(/"accent":\s*"var\(/);
  });

  it("keeps Education 4-skill tones strictly separated in education extension output", () => {
    const result = compileMillar({ rootDir: REPO_ROOT, writeFiles: false });

    expect(result.outputs.tokensCss).not.toContain("--skill-listening");
    expect(result.outputs.educationCss).toContain("--skill-listening");
    expect(result.outputs.educationCss).toContain("--mark-learner");
  });

  it("embeds all 4 canonical Vector Brand Mark SVGs and Geist 600 wordmark spec", () => {
    const result = compileMillar({ rootDir: REPO_ROOT, writeFiles: false });

    expect(result.registry.brand.marks).toHaveLength(4);
    expect(result.registry.brand.wordmark.fontFamily).toBe("Geist");
    expect(result.registry.brand.wordmark.fontWeight).toBe(600);
  });
});
