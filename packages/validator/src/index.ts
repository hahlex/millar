import { wcagContrastRatio, type MillarRegistryBundle } from "@hahlex/millar-core";
import rawRegistry from "@hahlex/millar-tokens/registry";

const registry = rawRegistry as unknown as MillarRegistryBundle;

export type ValidationRegister = "shared" | "marketing" | "product";
export type ContentSourceKind = "hahlex-ui" | "user-data" | "quoted-content" | "third-party";

export interface DeclaredColorPair {
  label?: string;
  fg: string;
  bg: string;
  isLargeText?: boolean;
}

export interface ValidateDesignInput {
  code: string;
  language?: "tsx" | "jsx" | "html" | "css";
  register: ValidationRegister;
  /** Distinguishes Hahlex-controlled UI/copy from user data, quotes, or third-party text (Q4). */
  sourceKind?: ContentSourceKind;
  colorPairs?: DeclaredColorPair[];
}

export interface AutomatedViolation {
  ruleId: string;
  severity: "error" | "warning";
  line?: number;
  message: string;
  found: string;
  suggestion: string;
  docUri: string;
}

export interface HumanReviewCriterion {
  id: string;
  axis: "composition" | "hierarchy" | "craft" | "accessibility" | "brand-voice";
  question: string;
  guidance: string;
}

export interface ValidateDesignReport {
  register: ValidationRegister;
  sourceKind: ContentSourceKind;
  /** Deterministic, machine-verifiable compliance rules ONLY. */
  automatedChecks: {
    passed: boolean;
    errorCount: number;
    warningCount: number;
    rulesEvaluated: string[];
    skippedRules: Array<{ ruleId: string; reason: string }>;
    violations: AutomatedViolation[];
  };
  /** Subjective aesthetic, editorial, and UX criteria that ALWAYS require human judgment (Q7). */
  humanReviewCriteria: {
    automated: false;
    note: string;
    criteria: HumanReviewCriterion[];
  };
}

const EM_DASH = "\u2014";
const RAW_HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const GRADIENT_RE = /\b(?:linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient)\s*\(|\bbg-gradient-to-/i;
const APPROVED_GRADIENT_MARKER_RE = /data-millar-approved-gradient|WarmHorizonWash/;
const INVALID_BTN_VARIANT_RE = /<Button[^>]*\bvariant\s*=\s*["'](destructive|outline|link|violet|default|solid)["']/gi;
const ICON_ONLY_BTN_RE = /<Button\b[^>]*\biconOnly\b[^>]*>/gi;
const RAW_CONTROL_RE = /<(button|input)\b/gi;

function lineNumberAt(code: string, index: number): number {
  return code.slice(0, index).split(/\r?\n/).length;
}

function buildHumanCriteria(register: ValidationRegister): HumanReviewCriterion[] {
  const shared: HumanReviewCriterion[] = [
    {
      id: "human-brand-warmth",
      axis: "brand-voice",
      question: "Does the surface unmistakably feel like Hahlex (Measured Warmth: Warm Sand, Espresso, Bronze) without imitating Vercel, Linear, or ElevenLabs?",
      guidance: "Check material restraint, warm neutral surfaces, and absence of cold blue/purple AI clichés.",
    },
    {
      id: "human-typography-rhythm",
      axis: "hierarchy",
      question: "Do Geist 300-400 display headlines and Inter body prose establish clear visual hierarchy with comfortable 65-75ch reading measure and unclipped Vietnamese diacritics?",
      guidance: "Verify more vertical breathing room above headings than below them, and zero gratuitous eyebrows above every heading.",
    },
    {
      id: "human-at-usability",
      axis: "accessibility",
      question: "Have real keyboard-only navigation and screen reader flows (NVDA/VoiceOver) been verified end-to-end?",
      guidance: "Automated checks catch ~30-40% of barriers; manual keyboard and assistive-tech verification is required before claiming conformance.",
    },
  ];

  if (register === "marketing") {
    return [
      ...shared,
      {
        id: "human-composition-diversity",
        axis: "composition",
        question: "Does the page vary rhythm across Millar's 6 Composition Patterns rather than repeating identical architectural grids or equal 3-column icon-card rows?",
        guidance: "Alternate spatial stages, editorial magazine splits, bento mosaics, and typographic posters with purposeful transitions.",
      },
      {
        id: "human-zero-photo-craft",
        axis: "craft",
        question: "Does every section look deliberate and publication-grade at 0% scroll with zero stock photos and zero animation?",
        guidance: "Check that any approved gradient asset (e.g., WarmHorizonWash) elevates visual depth without decorating flat UI or reducing contrast.",
      },
    ];
  }

  return [
    ...shared,
    {
      id: "human-1glance-scanability",
      axis: "hierarchy",
      question: "Can an operational user scan primary status, metrics, and the single primary action within one second?",
      guidance: "Keep PageHeader to <= 1 primary CTA and <= 2 secondary buttons; fold advanced controls behind progressive disclosure.",
    },
    {
      id: "human-domain-neutrality",
      axis: "craft",
      question: "Are vertical-specific semantics (such as Education 4-skill tones) isolated in Domain Extensions rather than baked into shared primitives?",
      guidance: "Use @hahlex/millar-domain-education for IELTS/curriculum semantics.",
    },
  ];
}

export function validateDesign(input: ValidateDesignInput): ValidateDesignReport {
  const {
    code,
    language = "tsx",
    register,
    sourceKind = "hahlex-ui",
    colorPairs = [],
  } = input;

  const violations: AutomatedViolation[] = [];
  const rulesEvaluated: string[] = [];
  const skippedRules: Array<{ ruleId: string; reason: string }> = [];
  const lines = code.split(/\r?\n/);

  // 1. Zero Em-Dash on Hahlex-controlled UI/docs only (Q4 boundary)
  if (sourceKind === "hahlex-ui") {
    rulesEvaluated.push("millar/no-em-dash");
    lines.forEach((line, idx) => {
      if (line.includes(EM_DASH)) {
        violations.push({
          ruleId: "millar/no-em-dash",
          severity: "error",
          line: idx + 1,
          message: "Forbidden U+2014 em-dash in Hahlex-controlled UI or copy.",
          found: line.trim().slice(0, 90),
          suggestion: "Replace U+2014 with ':', '.', ',', '·', parentheses, or '-' (never alter user data or third-party quotes).",
          docUri: "millar://guidelines/invariants",
        });
      }
    });
  } else {
    skippedRules.push({
      ruleId: "millar/no-em-dash",
      reason: `Skipped because sourceKind is "${sourceKind}" (ADR-0002 / Q4: never alter user data, direct quotes, or third-party resources).`,
    });
  }

  // 2. Register-aware CSS gradient policy (Q2 boundary)
  rulesEvaluated.push("millar/gradient-policy");
  const hasApprovedMarker = APPROVED_GRADIENT_MARKER_RE.test(code);
  lines.forEach((line, idx) => {
    if (!GRADIENT_RE.test(line)) return;
    if (register === "product" || register === "shared") {
      violations.push({
        ruleId: "millar/gradient-policy",
        severity: "error",
        line: idx + 1,
        message: `CSS gradients are strictly forbidden in ${register} UI and foundation components.`,
        found: line.trim().slice(0, 90),
        suggestion: "Use solid Millar surface tokens (--bg-surface, --bg-surface-2, --tone-brand-soft) and 1px warm-sand borders.",
        docUri: "millar://guidelines/invariants",
      });
    } else if (!hasApprovedMarker) {
      violations.push({
        ruleId: "millar/gradient-policy",
        severity: "error",
        line: idx + 1,
        message: "Unapproved decorative CSS gradient in Marketing code.",
        found: line.trim().slice(0, 90),
        suggestion: "Use solid editorial surfaces or an explicitly approved Marketing Visual Asset (e.g., <WarmHorizonWash /> with data-millar-approved-gradient).",
        docUri: "millar://guidelines/marketing",
      });
    }
  });

  // 3. Raw hardcoded hex colors bypassing Millar tokens
  rulesEvaluated.push("millar/no-raw-color");
  lines.forEach((line, idx) => {
    if (line.trim().startsWith("//") || line.trim().startsWith("/*") || line.trim().startsWith("*")) return;
    if (APPROVED_GRADIENT_MARKER_RE.test(line)) return;
    const matches = line.match(RAW_HEX_RE);
    if (!matches) return;
    for (const hex of matches) {
      violations.push({
        ruleId: "millar/no-raw-color",
        severity: "warning",
        line: idx + 1,
        message: `Hardcoded color literal "${hex}" bypasses Millar design tokens.`,
        found: hex,
        suggestion: "Replace with a semantic Millar CSS variable (e.g., var(--bg-surface), var(--fg-default), var(--accent)).",
        docUri: "millar://tokens/resolved/light",
      });
    }
  });

  // 4. Invalid Button variant hallucinations
  if (language === "tsx" || language === "jsx") {
    rulesEvaluated.push("millar/invalid-button-variant");
    for (const match of code.matchAll(INVALID_BTN_VARIANT_RE)) {
      violations.push({
        ruleId: "millar/invalid-button-variant",
        severity: "error",
        line: lineNumberAt(code, match.index ?? 0),
        message: `Invalid Millar Button variant "${match[1]}".`,
        found: match[0],
        suggestion: "Use one of: primary, secondary, white, ghost, danger, success, row.",
        docUri: "millar://components/button",
      });
    }

    // 5. Icon-only Button missing aria-label
    rulesEvaluated.push("millar/icon-only-aria-label");
    for (const match of code.matchAll(ICON_ONLY_BTN_RE)) {
      if (!/aria-label|aria-labelledby/.test(match[0])) {
        violations.push({
          ruleId: "millar/icon-only-aria-label",
          severity: "error",
          line: lineNumberAt(code, match.index ?? 0),
          message: "Icon-only <Button iconOnly> is missing an explicit aria-label or aria-labelledby.",
          found: match[0],
          suggestion: 'Add aria-label="Describe action" to guarantee screen-reader accessible name (WCAG 4.1.2).',
          docUri: "millar://components/button",
        });
      }
    }

    // 6. Dark-mode 1.00:1 invisible toggle regression guard (Audit 01 P0)
    rulesEvaluated.push("millar/no-accent-soft-clash");
    if (code.includes("bg-accent-soft") && code.includes("text-fg-accent")) {
      violations.push({
        ruleId: "millar/no-accent-soft-clash",
        severity: "error",
        message: "Pairing bg-accent-soft with text-fg-accent produces 1.00:1 invisible text in dark mode and 3.93:1 FAIL in light mode.",
        found: "bg-accent-soft + text-fg-accent",
        suggestion: "Replace text-fg-accent with text-fg-on-accent-soft (#362218, 7.69:1 AAA in both themes).",
        docUri: "millar://components/choice-toggle",
      });
    }

    // 7. Raw HTML button/input bypassing Product primitives
    if (register === "product") {
      rulesEvaluated.push("millar/no-raw-controls");
      for (const match of code.matchAll(RAW_CONTROL_RE)) {
        violations.push({
          ruleId: "millar/no-raw-controls",
          severity: "warning",
          line: lineNumberAt(code, match.index ?? 0),
          message: `Raw <${match[1]}> detected in Product register code.`,
          found: match[0],
          suggestion: "Import accessible Button, Input, or Select primitives from @hahlex/millar-ui.",
          docUri: "millar://guidelines/product",
        });
      }
    }
  }

  // 8. Nested <footer> inside <main> landmark violation (Audit 02)
  rulesEvaluated.push("millar/no-nested-footer");
  if (/<main\b[\s\S]*?<footer\b[\s\S]*?<\/main>/i.test(code)) {
    violations.push({
      ruleId: "millar/no-nested-footer",
      severity: "error",
      message: "Site <footer> appears nested inside <main>, stripping its top-level contentinfo landmark role (WCAG 1.3.1).",
      found: "<main>...<footer>...</main>",
      suggestion: "Render site <footer> (or <MillarSiteFooter />) as a sibling immediately after </main>.",
      docUri: "millar://sections/closing-conversion-band",
    });
  }

  // 9. Animation without prefers-reduced-motion handling
  rulesEvaluated.push("millar/prefers-reduced-motion");
  if ((/@keyframes\b|animation\s*:/.test(code)) && !/prefers-reduced-motion/.test(code)) {
    violations.push({
      ruleId: "millar/prefers-reduced-motion",
      severity: "warning",
      message: "CSS animation/keyframes declared without a prefers-reduced-motion media query.",
      found: "animation / @keyframes",
      suggestion: "Add @media (prefers-reduced-motion: reduce) providing an immediate static end-state.",
      docUri: "millar://motion-presets/expressive-editorial-reveal",
    });
  }

  // 10. Deprecated token usage check against compiled SSoT registry
  rulesEvaluated.push("millar/no-deprecated-tokens");
  const allDeprecated = [...registry.tokens.base, ...registry.tokens.light, ...registry.tokens.dark].filter((t) => Boolean(t.deprecated));
  for (const dep of allDeprecated) {
    if (code.includes(dep.cssVar)) {
      violations.push({
        ruleId: "millar/no-deprecated-tokens",
        severity: "warning",
        message: `Deprecated Millar token "${dep.cssVar}" referenced.`,
        found: dep.cssVar,
        suggestion: typeof dep.deprecated === "string" ? dep.deprecated : "Migrate to the current canonical semantic token.",
        docUri: "millar://tokens/resolved/light",
      });
    }
  }

  // 11. Declared WCAG 2.1 contrast pairs check
  if (colorPairs.length > 0) {
    rulesEvaluated.push("millar/wcag-contrast-pairs");
    for (const pair of colorPairs) {
      const ratio = wcagContrastRatio(pair.fg, pair.bg);
      const min = pair.isLargeText ? 3.0 : 4.5;
      if (ratio < min) {
        violations.push({
          ruleId: "millar/wcag-contrast-pairs",
          severity: "error",
          message: `Contrast pair${pair.label ? ` "${pair.label}"` : ""} (${pair.fg} on ${pair.bg}) measures ${ratio}:1, below WCAG 2.1 AA minimum ${min}:1.`,
          found: `${pair.fg} / ${pair.bg} (${ratio}:1)`,
          suggestion: "Select a contrast-verified Millar token pair from millar://tokens/resolved/light or dark.",
          docUri: "millar://tokens/resolved/light",
        });
      }
    }
  }

  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warningCount = violations.filter((v) => v.severity === "warning").length;

  return {
    register,
    sourceKind,
    automatedChecks: {
      passed: errorCount === 0,
      errorCount,
      warningCount,
      rulesEvaluated,
      skippedRules,
      violations,
    },
    humanReviewCriteria: {
      automated: false,
      note: "Automated rules verify objective invariants only. Aesthetic composition, editorial pacing, visual hierarchy, and manual AT usability require human review.",
      criteria: buildHumanCriteria(register),
    },
  };
}
