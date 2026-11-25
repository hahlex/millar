import fs from "node:fs";
import path from "node:path";
import { machadoColorBlindDeltaE, wcagContrastRatio } from "./colorMath.js";
import { MILLAR_GUIDELINES, MILLAR_MOTION_PRESETS } from "./guidelines.js";
import type {
  ComponentSpec,
  CompositionPatternSpec,
  DtcgColorValue,
  DtcgDimensionValue,
  DtcgDurationValue,
  DtcgTokenValue,
  MillarRegistryBundle,
  MillarTheme,
  ResolvedToken,
  SectionSpec,
  TemplateSpec,
  VisualAssetSpec,
} from "./types.js";

interface RawDtcgNode {
  $value?: DtcgTokenValue;
  $type?: string;
  $description?: string;
  $deprecated?: boolean | string;
  $extensions?: Record<string, unknown>;
  [key: string]: unknown;
}

interface FlatRawToken {
  path: string;
  type: string;
  rawValue: DtcgTokenValue;
  description: string;
  deprecated?: boolean | string;
  extensions?: Record<string, unknown>;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function flattenDtcg(
  node: RawDtcgNode,
  prefix: string[] = [],
  inheritedType?: string,
  out: FlatRawToken[] = [],
): FlatRawToken[] {
  const currentType = typeof node.$type === "string" ? node.$type : inheritedType;
  if ("$value" in node && node.$value !== undefined) {
    out.push({
      path: prefix.join("."),
      type: currentType ?? "string",
      rawValue: node.$value,
      description: typeof node.$description === "string" ? node.$description : "",
      deprecated: node.$deprecated,
      extensions: node.$extensions,
    });
    return out;
  }

  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      flattenDtcg(val as RawDtcgNode, [...prefix, key], currentType, out);
    }
  }
  return out;
}

function isColorObj(val: unknown): val is DtcgColorValue {
  return (
    typeof val === "object" &&
    val !== null &&
    "colorSpace" in val &&
    "hex" in val &&
    "components" in val
  );
}

function isDimensionObj(val: unknown): val is DtcgDimensionValue {
  return typeof val === "object" && val !== null && "value" in val && "unit" in val;
}

function formatCssValue(type: string, val: DtcgTokenValue): { css: string; hex?: string; oklch?: string; alpha?: number } {
  if (type === "color" && isColorObj(val)) {
    const alpha = val.alpha ?? 1;
    if (val.colorSpace === "srgb" && alpha < 1) {
      const [r, g, b] = val.components.map((c) => Math.round(c * 255));
      return { css: `rgba(${r}, ${g}, ${b}, ${alpha})`, hex: val.hex, alpha };
    }
    const [l, c, h] = val.components;
    const oklch =
      val.colorSpace === "oklch"
        ? `oklch(${l} ${c} ${h}${alpha < 1 ? ` / ${alpha}` : ""})`
        : undefined;
    return { css: val.hex, hex: val.hex, oklch, alpha };
  }
  if ((type === "dimension" || type === "duration") && isDimensionObj(val)) {
    return { css: `${val.value}${val.unit}` };
  }
  if (type === "fontFamily" && Array.isArray(val)) {
    const formatted = (val as string[])
      .map((f) => (/[\s]/.test(f) ? `"${f}"` : f))
      .join(", ");
    return { css: formatted };
  }
  if (type === "cubicBezier" && Array.isArray(val)) {
    return { css: `cubic-bezier(${(val as number[]).join(", ")})` };
  }
  return { css: String(val) };
}

function tokenPathToCssVar(tokenPath: string): string {
  if (tokenPath.startsWith("semantic.color.")) {
    return `--${tokenPath.slice("semantic.color.".length)}`;
  }
  if (tokenPath.startsWith("semantic.shadow.")) {
    return `--shadow-${tokenPath.slice("semantic.shadow.".length)}`;
  }
  if (tokenPath.startsWith("color.brand.")) {
    return `--hah-${tokenPath.slice("color.brand.".length)}`;
  }
  if (tokenPath.startsWith("color.neutral.")) {
    return `--millar-neutral-${tokenPath.slice("color.neutral.".length)}`;
  }
  if (tokenPath.startsWith("color.status.")) {
    return `--millar-status-${tokenPath.slice("color.status.".length)}`;
  }
  if (tokenPath.startsWith("color.categorical.")) {
    return `--millar-cat-${tokenPath.slice("color.categorical.".length)}`;
  }
  if (tokenPath.startsWith("font.family.")) {
    return `--font-${tokenPath.slice("font.family.".length)}`;
  }
  if (tokenPath.startsWith("font.size.")) {
    return `--text-${tokenPath.slice("font.size.".length)}`;
  }
  if (tokenPath.startsWith("font.weight.")) {
    return `--weight-${tokenPath.slice("font.weight.".length)}`;
  }
  if (tokenPath.startsWith("font.leading.")) {
    return `--leading-${tokenPath.slice("font.leading.".length)}`;
  }
  if (tokenPath.startsWith("font.tracking.")) {
    return `--tracking-${tokenPath.slice("font.tracking.".length)}`;
  }
  if (tokenPath.startsWith("space.")) {
    const rest = tokenPath.slice("space.".length);
    return /^\d+$/.test(rest) ? `--space-${rest}` : `--${rest}`;
  }
  if (tokenPath.startsWith("breakpoint.")) {
    return `--breakpoint-${tokenPath.slice("breakpoint.".length)}`;
  }
  if (tokenPath.startsWith("radius.")) {
    return `--radius-${tokenPath.slice("radius.".length)}`;
  }
  if (tokenPath.startsWith("zIndex.")) {
    return `--z-${tokenPath.slice("zIndex.".length)}`;
  }
  if (tokenPath.startsWith("motion.duration.")) {
    return `--motion-${tokenPath.slice("motion.duration.".length)}`;
  }
  if (tokenPath.startsWith("motion.easing.")) {
    return `--ease-${tokenPath.slice("motion.easing.".length)}`;
  }
  if (tokenPath.startsWith("education.light.") || tokenPath.startsWith("education.dark.")) {
    return `--${tokenPath.split(".").slice(2).join("-")}`;
  }
  return `--${tokenPath.replaceAll(".", "-")}`;
}

function classifyCategory(tokenPath: string): ResolvedToken["category"] {
  if (tokenPath.includes("color.") || tokenPath.startsWith("education.")) return "color";
  if (tokenPath.startsWith("font.")) return "typography";
  if (tokenPath.startsWith("space.")) return "spacing";
  if (tokenPath.startsWith("breakpoint.")) return "breakpoint";
  if (tokenPath.startsWith("radius.")) return "radius";
  if (tokenPath.startsWith("zIndex.")) return "zIndex";
  if (tokenPath.startsWith("motion.")) return "motion";
  if (tokenPath.includes("shadow.")) return "shadow";
  return "meta";
}

function resolveRawList(
  list: FlatRawToken[],
  lookupMap: Map<string, FlatRawToken>,
): ResolvedToken[] {
  const resolveValue = (
    token: FlatRawToken,
    depth = 0,
  ): { raw: DtcgTokenValue; aliasOf?: string } => {
    if (depth > 8) {
      throw new Error(`Circular token alias detected at ${token.path}`);
    }
    if (typeof token.rawValue === "string" && /^\{[^}]+\}$/.test(token.rawValue)) {
      const targetPath = token.rawValue.slice(1, -1);
      const target = lookupMap.get(targetPath);
      if (!target) {
        throw new Error(`Unresolved DTCG token alias "${token.rawValue}" referenced by "${token.path}"`);
      }
      const deeper = resolveValue(target, depth + 1);
      return { raw: deeper.raw, aliasOf: targetPath };
    }
    return { raw: token.rawValue };
  };

  return list.map((rawToken) => {
    // Reject forbidden gradient token types in core tokens (ADR-0002)
    if (rawToken.type === "gradient") {
      throw new Error(`Forbidden DTCG gradient token "${rawToken.path}" inside core tokens (ADR-0002)`);
    }
    const { raw, aliasOf } = resolveValue(rawToken);
    const formatted = formatCssValue(rawToken.type, raw);
    const cssVar = tokenPathToCssVar(rawToken.path);
    const category = classifyCategory(rawToken.path);

    let tailwindUtility: string | undefined;
    if (rawToken.path.startsWith("semantic.color.")) {
      const name = rawToken.path.slice("semantic.color.".length);
      if (name.startsWith("bg-")) tailwindUtility = `bg-${name}`;
      else if (name.startsWith("fg-")) tailwindUtility = `text-${name}`;
      else if (name.startsWith("border-")) tailwindUtility = `border-${name}`;
      else tailwindUtility = `text-${name} / bg-${name}`;
    } else if (rawToken.path.startsWith("radius.")) {
      tailwindUtility = `rounded-${rawToken.path.slice("radius.".length)}`;
    } else if (rawToken.path.startsWith("font.size.")) {
      tailwindUtility = `text-${rawToken.path.slice("font.size.".length)}`;
    }

    return {
      path: rawToken.path,
      cssVar,
      category,
      type: rawToken.type,
      value: formatted.css,
      rawValue: raw,
      hex: formatted.hex,
      oklch: formatted.oklch,
      alpha: formatted.alpha,
      aliasOf,
      description: rawToken.description,
      tailwindUtility,
      deprecated: rawToken.deprecated,
    };
  });
}

function camelKey(kebab: string): string {
  return kebab.replace(/-([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());
}

function loadOptionalRegistryFragments<T>(rootDir: string, relativePath: string): T[] {
  const full = path.join(rootDir, relativePath);
  if (!fs.existsSync(full)) return [];
  return readJson<T[]>(full);
}

export interface CompileMillarOptions {
  rootDir: string;
  writeFiles?: boolean;
  components?: ComponentSpec[];
  compositionPatterns?: CompositionPatternSpec[];
  visualAssets?: VisualAssetSpec[];
  sections?: SectionSpec[];
  templates?: TemplateSpec[];
}

export interface CompileMillarOutput {
  registry: MillarRegistryBundle;
  outputs: {
    tokensCss: string;
    tailwindCss: string;
    tailwindPresetCjs: string;
    tokensTs: string;
    tokensJs: string;
    educationCss: string;
    dtcgJson: string;
    registryJson: string;
  };
}

export function compileMillar(options: CompileMillarOptions): CompileMillarOutput {
  const { rootDir, writeFiles = false } = options;
  const tokensDir = path.join(rootDir, "tokens");

  const baseRaw = [
    ...flattenDtcg(readJson<RawDtcgNode>(path.join(tokensDir, "base/color.tokens.json"))),
    ...flattenDtcg(readJson<RawDtcgNode>(path.join(tokensDir, "base/typography.tokens.json"))),
    ...flattenDtcg(readJson<RawDtcgNode>(path.join(tokensDir, "base/spacing-layout.tokens.json"))),
    ...flattenDtcg(readJson<RawDtcgNode>(path.join(tokensDir, "base/motion.tokens.json"))),
  ];
  const lightRaw = flattenDtcg(readJson<RawDtcgNode>(path.join(tokensDir, "semantic/light.tokens.json")));
  const darkRaw = flattenDtcg(readJson<RawDtcgNode>(path.join(tokensDir, "semantic/dark.tokens.json")));
  const localeViRaw = flattenDtcg(readJson<RawDtcgNode>(path.join(tokensDir, "semantic/locale-vi.tokens.json")));
  const productRegisterRaw = flattenDtcg(readJson<RawDtcgNode>(path.join(tokensDir, "semantic/register-product.tokens.json")));
  const marketingRegisterRaw = flattenDtcg(readJson<RawDtcgNode>(path.join(tokensDir, "semantic/register-marketing.tokens.json")));
  const motionReducedRaw = flattenDtcg(readJson<RawDtcgNode>(path.join(tokensDir, "semantic/motion-reduced.tokens.json")));
  const educationRaw = flattenDtcg(readJson<RawDtcgNode>(path.join(tokensDir, "extensions/education.tokens.json")));

  const baseMap = new Map<string, FlatRawToken>(baseRaw.map((t) => [t.path, t]));
  const lightLookup = new Map<string, FlatRawToken>([...baseMap, ...lightRaw.map((t) => [t.path, t] as const)]);
  const darkLookup = new Map<string, FlatRawToken>([...baseMap, ...darkRaw.map((t) => [t.path, t] as const)]);
  const eduLookup = new Map<string, FlatRawToken>([...baseMap, ...educationRaw.map((t) => [t.path, t] as const)]);

  const baseTokens = resolveRawList(baseRaw, baseMap);
  const lightTokens = resolveRawList(lightRaw, lightLookup);
  const darkTokens = resolveRawList(darkRaw, darkLookup);
  const localeViTokens = resolveRawList(localeViRaw, baseMap);
  const productRegisterTokens = resolveRawList(productRegisterRaw, baseMap);
  const marketingRegisterTokens = resolveRawList(marketingRegisterRaw, baseMap);
  const motionReducedTokens = resolveRawList(motionReducedRaw, baseMap);

  const eduLightTokens = resolveRawList(
    educationRaw.filter((t) => t.path.startsWith("education.light.")),
    eduLookup,
  );
  const eduDarkTokens = resolveRawList(
    educationRaw.filter((t) => t.path.startsWith("education.dark.")),
    eduLookup,
  );

  // Verify declared WCAG contrast pairs across both light and dark themes
  const contrastFailures: MillarRegistryBundle["contrastSummary"]["failures"] = [];
  let totalContrastChecked = 0;

  const verifyThemeContrast = (theme: MillarTheme, rawList: FlatRawToken[], resolvedList: ResolvedToken[]) => {
    const resolvedByPath = new Map(resolvedList.map((t) => [t.path, t]));
    for (const raw of rawList) {
      const millarExt = raw.extensions?.["com.hahlex.millar"] as
        | { contrastWith?: string[]; minContrast?: number }
        | undefined;
      if (!millarExt?.contrastWith?.length) continue;
      const fgToken = resolvedByPath.get(raw.path);
      if (!fgToken?.hex) continue;
      const minRequired = millarExt.minContrast ?? 4.5;
      fgToken.contrastChecks = [];

      for (const bgPath of millarExt.contrastWith) {
        const bgToken = resolvedByPath.get(bgPath);
        if (!bgToken?.hex) {
          throw new Error(`Contrast target "${bgPath}" missing in ${theme} theme for "${raw.path}"`);
        }
        const ratio = wcagContrastRatio(fgToken.hex, bgToken.hex);
        const pass = ratio >= minRequired;
        totalContrastChecked += 1;
        fgToken.contrastChecks.push({
          against: bgPath,
          againstHex: bgToken.hex,
          ratio,
          minRequired,
          pass,
        });
        if (!pass) {
          contrastFailures.push({
            theme,
            token: raw.path,
            against: bgPath,
            ratio,
            minRequired,
          });
        }
      }
    }
  };

  verifyThemeContrast("light", lightRaw, lightTokens);
  verifyThemeContrast("dark", darkRaw, darkTokens);

  // Verify Machado protanopia/deuteranopia separation on categorical data-viz series
  const chartKeys = ["semantic.color.chart-brand", "semantic.color.chart-1", "semantic.color.chart-2", "semantic.color.chart-3"];
  let pairsChecked = 0;
  let globalMinDeltaE = Number.POSITIVE_INFINITY;
  for (const themeTokens of [lightTokens, darkTokens]) {
    const hexes = chartKeys
      .map((k) => themeTokens.find((t) => t.path === k)?.hex)
      .filter((h): h is string => Boolean(h));
    for (let i = 0; i < hexes.length; i += 1) {
      for (let j = i + 1; j < hexes.length; j += 1) {
        pairsChecked += 1;
        const { minDeltaE } = machadoColorBlindDeltaE(hexes[i]!, hexes[j]!);
        if (minDeltaE < globalMinDeltaE) globalMinDeltaE = minDeltaE;
      }
    }
  }
  const colorBlindPassed = pairsChecked > 0 && globalMinDeltaE >= 8;

  // Load canonical Vector Brand Marks from assets/brand/
  const brandVariants: Array<{ id: string; variant: "color" | "on-light" | "on-dark" | "monochrome"; file: string }> = [
    { id: "hahlex-mark-color", variant: "color", file: "assets/brand/hahlex-mark-color.svg" },
    { id: "hahlex-mark-on-light", variant: "on-light", file: "assets/brand/hahlex-mark-on-light.svg" },
    { id: "hahlex-mark-on-dark", variant: "on-dark", file: "assets/brand/hahlex-mark-on-dark.svg" },
    { id: "hahlex-mark-monochrome", variant: "monochrome", file: "assets/brand/hahlex-mark-monochrome.svg" },
  ];
  const marks = brandVariants.map((m) => ({
    id: m.id,
    variant: m.variant,
    path: m.file,
    svg: fs.readFileSync(path.join(rootDir, m.file), "utf8").trim(),
  }));

  // Load registry catalogs (either injected or from packages/*/registry/*.json)
  const components =
    options.components ?? loadOptionalRegistryFragments<ComponentSpec>(rootDir, "packages/ui/src/registry.json");
  const compositionPatterns =
    options.compositionPatterns ??
    loadOptionalRegistryFragments<CompositionPatternSpec>(rootDir, "packages/marketing/src/composition-patterns.registry.json");
  const visualAssets =
    options.visualAssets ??
    loadOptionalRegistryFragments<VisualAssetSpec>(rootDir, "packages/marketing/src/visual-assets.registry.json");
  const sections =
    options.sections ??
    loadOptionalRegistryFragments<SectionSpec>(rootDir, "packages/marketing/src/sections.registry.json");
  const templates =
    options.templates ??
    loadOptionalRegistryFragments<TemplateSpec>(rootDir, "packages/marketing/src/templates.registry.json");

  // Build layered CSS output
  const formatDecls = (tokens: ResolvedToken[]) =>
    tokens.map((t) => `  ${t.cssVar}: ${t.value};`).join("\n");

  const tokensCss = [
    "/* =============================================================================",
    " * Millar Design Tokens (Generated from W3C DTCG 2025.10 SSoT - DO NOT EDIT)",
    " * ============================================================================= */",
    "@layer base {",
    "  :root {",
    "    color-scheme: light;",
    formatDecls(baseTokens).replace(/^/gm, "  "),
    formatDecls(lightTokens).replace(/^/gm, "  "),
    "    --font-body: var(--font-sans);",
    "    --font-brand-display: var(--font-display);",
    "    --ring-shadow: 0 0 0 1px var(--border-default);",
    "    --ring-shadow-active: 0 0 0 1px var(--border-strong);",
    "  }",
    "",
    '  :root[data-theme="dark"],',
    '  [data-theme="dark"] {',
    "    color-scheme: dark;",
    formatDecls(darkTokens).replace(/^/gm, "  "),
    "  }",
    "",
    '  [data-register="product"] {',
    formatDecls(productRegisterTokens).replace(/^/gm, "  "),
    "  }",
    "",
    '  [data-register="marketing"] {',
    formatDecls(marketingRegisterTokens).replace(/^/gm, "  "),
    "  }",
    "",
    "  :root:lang(vi) {",
    formatDecls(localeViTokens).replace(/^/gm, "  "),
    "  }",
    "",
    "  :root:lang(vi) .line-mask {",
    "    padding-top: 0.16em;",
    "    margin-top: -0.16em;",
    "  }",
    "",
    "  @media (prefers-reduced-motion: reduce) {",
    "    :root {",
    formatDecls(motionReducedTokens).replace(/^/gm, "    "),
    "    }",
    "  }",
    "",
    "  .millar-focus:focus-visible,",
    "  .hhx-focus:focus-visible,",
    "  .millar-checkbox-input:focus-visible + .millar-checkbox-box {",
    "    outline: 2px solid var(--focus-ring);",
    "    outline-offset: 2px;",
    "    box-shadow: none;",
    "  }",
    "",
    "  .brand-word {",
    "    text-transform: none;",
    "  }",
    "",
    "  :where(.tabular-nums) {",
    "    font-variant-numeric: tabular-nums lining-nums;",
    "    letter-spacing: 0;",
    "  }",
    "",
    "  /* Browser surface polish (impeccable craft-floor): selection, caret, underline, scrollbars */",
    "  ::selection {",
    "    background-color: var(--accent-soft);",
    "    color: var(--fg-on-accent-soft);",
    "  }",
    "",
    "  :where(input, textarea, [contenteditable]) {",
    "    caret-color: var(--fg-accent);",
    "  }",
    "",
    "  :where(a) {",
    "    text-underline-offset: 0.18em;",
    "  }",
    "",
    "  * {",
    "    scrollbar-color: var(--border-strong) transparent;",
    "    scrollbar-width: thin;",
    "  }",
    "}",
    "",
  ].join("\n");

  // Build Tailwind v4 @theme inline block (CRITICAL: inline ensures dark-mode var() resolves on scoped subtrees)
  const tailwindColorEntries = lightTokens
    .filter((t) => t.category === "color")
    .map((t) => `  --color-${t.cssVar.slice(2)}: var(${t.cssVar});`);
  const tailwindRadiusEntries = baseTokens
    .filter((t) => t.category === "radius")
    .map((t) => `  --radius-${t.cssVar.slice("--radius-".length)}: var(${t.cssVar});`);
  const tailwindFontSizeEntries = baseTokens
    .filter((t) => t.path.startsWith("font.size."))
    .map((t) => `  --text-${t.path.slice("font.size.".length)}: var(${t.cssVar});`);

  const tailwindCss = [
    "/* Millar Tailwind CSS v4 Bridge (@theme inline ensures [data-theme='dark'] resolves dynamically) */",
    '@import "./tokens.css";',
    "",
    "@theme inline {",
    "  --font-display: var(--font-display);",
    "  --font-sans: var(--font-sans);",
    "  --font-mono: var(--font-mono);",
    ...tailwindColorEntries,
    ...tailwindRadiusEntries,
    ...tailwindFontSizeEntries,
    "  --shadow-card: var(--shadow-card);",
    "  --shadow-popover: var(--shadow-popover);",
    "}",
    "",
  ].join("\n");

  // Build Tailwind v3 compatibility preset
  const tw3Colors: Record<string, string> = {};
  for (const t of lightTokens.filter((tok) => tok.category === "color")) {
    tw3Colors[t.cssVar.slice(2)] = `var(${t.cssVar})`;
  }
  const tailwindPresetCjs = `// Millar Tailwind CSS v3 Compatibility Preset (Generated)\nmodule.exports = ${JSON.stringify(
    {
      theme: {
        extend: {
          colors: tw3Colors,
          fontFamily: {
            display: ["var(--font-display)"],
            sans: ["var(--font-sans)"],
            mono: ["var(--font-mono)"],
          },
        },
      },
    },
    null,
    2,
  )};\n`;

  // Build literal TypeScript & JS mirrors (for Ant Design 6 / runtime JS without var() collapse)
  const buildLiteralMap = (tokens: ResolvedToken[]) => {
    const map: Record<string, string> = {};
    for (const t of tokens) {
      map[camelKey(t.cssVar.slice(2))] = t.value;
    }
    return map;
  };
  const lightLiterals = buildLiteralMap(lightTokens);
  const darkLiterals = buildLiteralMap(darkTokens);
  const zIndexMap: Record<string, number> = {};
  for (const t of baseTokens.filter((tok) => tok.category === "zIndex")) {
    zIndexMap[camelKey(t.cssVar.slice("--z-".length))] = Number(t.rawValue);
  }
  const motionDurations: Record<string, number> = {};
  for (const t of baseTokens.filter((tok) => tok.path.startsWith("motion.duration."))) {
    const dur = t.rawValue as DtcgDurationValue;
    motionDurations[camelKey(t.path.slice("motion.duration.".length))] = dur.value;
  }
  const motionEasings: Record<string, [number, number, number, number]> = {};
  for (const t of baseTokens.filter((tok) => tok.path.startsWith("motion.easing."))) {
    motionEasings[camelKey(t.path.slice("motion.easing.".length))] = t.rawValue as [number, number, number, number];
  }

  const tokensTs = [
    "// Generated from Millar W3C DTCG 2025.10 SSoT (Literal hex/rgba mirrors for Ant Design 6 & JS runtimes)",
    `export const MILLAR_LIGHT_TOKENS = ${JSON.stringify(lightLiterals, null, 2)} as const;`,
    "",
    `export const MILLAR_DARK_TOKENS = ${JSON.stringify(darkLiterals, null, 2)} as const;`,
    "",
    `export const MILLAR_Z_INDEX = ${JSON.stringify(zIndexMap, null, 2)} as const;`,
    "",
    `export const MILLAR_MOTION_DURATION_MS = ${JSON.stringify(motionDurations, null, 2)} as const;`,
    "",
    `export const MILLAR_MOTION_EASING = ${JSON.stringify(motionEasings, null, 2)} as const;`,
    "",
    "export type MillarThemeTokens = typeof MILLAR_LIGHT_TOKENS;",
    "",
  ].join("\n");

  const tokensJs = [
    "// Generated from Millar W3C DTCG 2025.10 SSoT",
    `export const MILLAR_LIGHT_TOKENS = ${JSON.stringify(lightLiterals, null, 2)};`,
    `export const MILLAR_DARK_TOKENS = ${JSON.stringify(darkLiterals, null, 2)};`,
    `export const MILLAR_Z_INDEX = ${JSON.stringify(zIndexMap, null, 2)};`,
    `export const MILLAR_MOTION_DURATION_MS = ${JSON.stringify(motionDurations, null, 2)};`,
    `export const MILLAR_MOTION_EASING = ${JSON.stringify(motionEasings, null, 2)};`,
    "",
  ].join("\n");

  // Build Education Extension CSS (strictly separate from Shared Foundations!)
  const educationCss = [
    "/* Millar Optional Domain Extension: @hahlex/millar-domain-education (Generated) */",
    "@layer base {",
    "  :root {",
    formatDecls(eduLightTokens).replace(/^/gm, "  "),
    "  }",
    '  :root[data-theme="dark"],',
    '  [data-theme="dark"] {',
    formatDecls(eduDarkTokens).replace(/^/gm, "  "),
    "  }",
    "}",
    "",
  ].join("\n");

  const registry: MillarRegistryBundle = {
    version: "0.1.0",
    generatedAt: "2026-11-25T00:00:00.000Z",
    dtcgSpecVersion: "2025.10",
    invariants: {
      typography: "Geist Sans (300-400 display, 500-600 operational headings) + Inter (body/UI) + Geist Mono (code) with :root:lang(vi) diacritic safety",
      gradientPolicy: {
        productAndFoundations: "forbidden",
        marketing: "approved-visual-assets-only",
      },
      zeroEmDashScope: "Forbidden in Hahlex-controlled UI, docs, and brand copy. Never alter user data, direct quotes, or third-party content.",
      accessibilityTarget: "WCAG 2.1/2.2 Level AA (exceeding Section 508 WCAG 2.0 AA legal floor)",
      lifecycleRule: "AI agents may author Draft proposals only; promoting Draft -> Approved requires human sign-off.",
    },
    brand: {
      name: "Hahlex",
      systemName: "Millar",
      wordmark: {
        text: "Hahlex",
        fontFamily: "Geist",
        fontWeight: 600,
        letterSpacing: "-0.02em",
        casingRule: "Title Case always (text-transform: none)",
      },
      marks,
    },
    tokens: {
      base: baseTokens,
      light: lightTokens,
      dark: darkTokens,
      localeVi: localeViTokens,
      registers: {
        product: productRegisterTokens,
        marketing: marketingRegisterTokens,
      },
      educationExtension: {
        light: eduLightTokens,
        dark: eduDarkTokens,
      },
    },
    contrastSummary: {
      totalChecked: totalContrastChecked,
      passed: totalContrastChecked - contrastFailures.length,
      failed: contrastFailures.length,
      failures: contrastFailures,
    },
    colorBlindSummary: {
      pairsChecked,
      minDeltaE: Number.isFinite(globalMinDeltaE) ? globalMinDeltaE : 0,
      passed: colorBlindPassed,
    },
    guidelines: MILLAR_GUIDELINES,
    compositionPatterns,
    components,
    visualAssets,
    sections,
    templates,
    motionPresets: MILLAR_MOTION_PRESETS,
  };

  const dtcgJson = JSON.stringify(
    {
      resolver: readJson(path.join(tokensDir, "millar.resolver.json")),
      base: {
        color: readJson(path.join(tokensDir, "base/color.tokens.json")),
        typography: readJson(path.join(tokensDir, "base/typography.tokens.json")),
        spacingLayout: readJson(path.join(tokensDir, "base/spacing-layout.tokens.json")),
        motion: readJson(path.join(tokensDir, "base/motion.tokens.json")),
      },
      semantic: {
        light: readJson(path.join(tokensDir, "semantic/light.tokens.json")),
        dark: readJson(path.join(tokensDir, "semantic/dark.tokens.json")),
        localeVi: readJson(path.join(tokensDir, "semantic/locale-vi.tokens.json")),
        product: readJson(path.join(tokensDir, "semantic/register-product.tokens.json")),
        marketing: readJson(path.join(tokensDir, "semantic/register-marketing.tokens.json")),
        motionReduced: readJson(path.join(tokensDir, "semantic/motion-reduced.tokens.json")),
      },
      extensions: {
        education: readJson(path.join(tokensDir, "extensions/education.tokens.json")),
      },
    },
    null,
    2,
  );
  const registryJson = JSON.stringify(registry, null, 2);

  if (writeFiles) {
    const outDir = path.join(rootDir, "packages/tokens/dist");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "tokens.css"), tokensCss, "utf8");
    fs.writeFileSync(path.join(outDir, "tailwind.css"), tailwindCss, "utf8");
    fs.writeFileSync(path.join(outDir, "tailwind.preset.cjs"), tailwindPresetCjs, "utf8");
    fs.writeFileSync(path.join(outDir, "tokens.ts"), tokensTs, "utf8");
    fs.writeFileSync(path.join(outDir, "tokens.js"), tokensJs, "utf8");
    fs.writeFileSync(path.join(outDir, "education.css"), educationCss, "utf8");
    fs.writeFileSync(path.join(outDir, "dtcg.json"), dtcgJson, "utf8");
    fs.writeFileSync(path.join(outDir, "millar-registry.json"), registryJson, "utf8");
  }

  return {
    registry,
    outputs: {
      tokensCss,
      tailwindCss,
      tailwindPresetCjs,
      tokensTs,
      tokensJs,
      educationCss,
      dtcgJson,
      registryJson,
    },
  };
}
