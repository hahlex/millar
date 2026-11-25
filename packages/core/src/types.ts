export type LifecycleStatus = "draft" | "approved" | "deprecated";
export type MillarRegister = "shared" | "marketing" | "product";
export type MillarTheme = "light" | "dark";
export type GradientPolicy = "none" | "approved-visual-asset";

export interface LifecycleMetadata {
  status: LifecycleStatus;
  sinceVersion: string;
  approvedBy?: string;
  approvedAt?: string;
  deprecatedSince?: string;
  migrationNote?: string;
}

export interface DtcgColorValue {
  colorSpace: string;
  components: [number, number, number];
  alpha?: number;
  hex: string;
}

export interface DtcgDimensionValue {
  value: number;
  unit: string;
}

export interface DtcgDurationValue {
  value: number;
  unit: "ms" | "s";
}

export type DtcgTokenValue =
  | string
  | number
  | string[]
  | number[]
  | DtcgColorValue
  | DtcgDimensionValue
  | DtcgDurationValue;

export interface ResolvedToken {
  path: string;
  cssVar: string;
  category: "color" | "typography" | "spacing" | "breakpoint" | "radius" | "zIndex" | "motion" | "shadow" | "meta";
  type: string;
  value: string;
  rawValue: DtcgTokenValue;
  hex?: string;
  oklch?: string;
  alpha?: number;
  aliasOf?: string;
  description: string;
  tailwindUtility?: string;
  deprecated?: boolean | string;
  contrastChecks?: Array<{
    against: string;
    againstHex: string;
    ratio: number;
    minRequired: number;
    pass: boolean;
  }>;
}

export interface ComponentPropSpec {
  name: string;
  type: string;
  defaultValue?: string;
  required?: boolean;
  description: string;
}

export interface A11yKeyboardSpec {
  key: string;
  behavior: string;
}

export interface ComponentSpec extends LifecycleMetadata {
  id: string;
  name: string;
  category: "actions" | "forms" | "navigation" | "data-display" | "feedback" | "layout";
  register: "shared" | "product";
  summary: string;
  importPath: string;
  props: ComponentPropSpec[];
  validVariants?: string[];
  invalidPropGuardrails: string[];
  tokenDependencies: string[];
  usageGuidelines: {
    whenToUse: string[];
    whenNotToUse: string[];
  };
  responsiveBehavior: string;
  accessibility: {
    wcagTarget: string;
    apgPattern?: string;
    rolesAndAttributes: string[];
    keyboard: A11yKeyboardSpec[];
  };
  exampleCode: string;
  sourcePath: string;
}

export interface CompositionPatternSpec extends LifecycleMetadata {
  id: string;
  name: string;
  register: "marketing";
  summary: string;
  spatialGrammar: string;
  bestFor: string[];
  avoidWhen: string[];
  pairedAssets: string[];
  responsiveBehavior: string;
  photoFree: true;
  staticFirst: true;
  exampleCode: string;
}

export interface VisualAssetSpec extends LifecycleMetadata {
  id: string;
  name: string;
  kind: "brand" | "grid" | "pattern" | "texture" | "atmosphere" | "diagram" | "product-viz";
  register: "shared" | "marketing";
  summary: string;
  technology: "svg" | "css" | "canvas" | "react";
  gradientPolicy: GradientPolicy;
  photoFree: true;
  staticFirst: true;
  props: ComponentPropSpec[];
  usageGuidelines: string[];
  responsiveBehavior: string;
  importPath: string;
  exampleCode: string;
  sourcePath: string;
}

export interface SectionSpec extends LifecycleMetadata {
  id: string;
  name: string;
  goal: "hero" | "proof" | "features" | "editorial" | "product-showcase" | "workflow" | "architecture" | "metrics" | "pricing" | "faq" | "cta";
  compositionPattern: string;
  register: "marketing";
  summary: string;
  photoFree: true;
  staticFirst: true;
  visualAssetsUsed: string[];
  usageGuidelines: string[];
  responsiveBehavior: string;
  reducedMotionFallback: string;
  accessibilityNotes: string[];
  importPath: string;
  exampleCode: string;
  sourcePath: string;
}

export interface TemplateSpec extends LifecycleMetadata {
  id: string;
  name: string;
  register: "marketing" | "product";
  summary: string;
  photoFree: boolean;
  visualAssetsUsed: string[];
  compositionPatternsUsed: string[];
  sectionsOrRegions: string[];
  usageGuidelines: string[];
  responsiveBehavior: string;
  reducedMotionFallback: string;
  importPath: string;
  exampleCode: string;
  sourcePath: string;
}

export interface MotionPresetSpec extends LifecycleMetadata {
  id: string;
  name: string;
  motionRegister: "productive" | "expressive";
  durationMs: number;
  easingCss: string;
  easingTuple: [number, number, number, number];
  summary: string;
  useCases: string[];
  reducedMotionFallback: string;
  cssSnippet: string;
  reactSnippet: string;
}

export interface GuidelineSpec extends LifecycleMetadata {
  id: string;
  title: string;
  register: MillarRegister;
  topic: string;
  summary: string;
  rules: string[];
  doItems: string[];
  dontItems: string[];
}

export interface MillarRegistryBundle {
  version: string;
  generatedAt: string;
  dtcgSpecVersion: "2025.10";
  invariants: {
    typography: string;
    gradientPolicy: {
      productAndFoundations: "forbidden";
      marketing: "approved-visual-assets-only";
    };
    zeroEmDashScope: string;
    accessibilityTarget: string;
    lifecycleRule: string;
  };
  brand: {
    name: "Hahlex";
    systemName: "Millar";
    wordmark: {
      text: "Hahlex";
      fontFamily: "Geist";
      fontWeight: 600;
      letterSpacing: "-0.02em";
      casingRule: "Title Case always (text-transform: none)";
    };
    marks: Array<{
      id: string;
      variant: "color" | "on-light" | "on-dark" | "monochrome";
      path: string;
      svg: string;
    }>;
  };
  tokens: {
    base: ResolvedToken[];
    light: ResolvedToken[];
    dark: ResolvedToken[];
    localeVi: ResolvedToken[];
    registers: {
      product: ResolvedToken[];
      marketing: ResolvedToken[];
    };
    educationExtension: {
      light: ResolvedToken[];
      dark: ResolvedToken[];
    };
  };
  contrastSummary: {
    totalChecked: number;
    passed: number;
    failed: number;
    failures: Array<{ theme: MillarTheme; token: string; against: string; ratio: number; minRequired: number }>;
  };
  colorBlindSummary: {
    pairsChecked: number;
    minDeltaE: number;
    passed: boolean;
  };
  guidelines: GuidelineSpec[];
  compositionPatterns: CompositionPatternSpec[];
  components: ComponentSpec[];
  visualAssets: VisualAssetSpec[];
  sections: SectionSpec[];
  templates: TemplateSpec[];
  motionPresets: MotionPresetSpec[];
}
