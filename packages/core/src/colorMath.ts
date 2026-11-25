/**
 * Pure color math for WCAG 2.1 contrast and Machado (2009) protanopia / deuteranopia
 * color-blindness simulation with CIE76 Lab Delta-E separation checks.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RgbColor {
  const clean = hex.trim().replace(/^#/, "");
  const expanded =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean.slice(0, 6);
  const num = Number.parseInt(expanded, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function srgbChannelToLinear(channel255: number): number {
  const c = channel255 / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgbChannel(linear: number): number {
  const clamped = Math.max(0, Math.min(1, linear));
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const rl = srgbChannelToLinear(r);
  const gl = srgbChannelToLinear(g);
  const bl = srgbChannelToLinear(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function wcagContrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

// Machado et al. (2009) severity 1.0 matrices in linear RGB
const PROTAN_MATRIX: readonly [number, number, number][] = [
  [0.152286, 1.052583, -0.204868],
  [0.114503, 0.786281, 0.099216],
  [-0.003882, -0.048116, 1.051998],
];

const DEUTAN_MATRIX: readonly [number, number, number][] = [
  [0.367322, 0.860646, -0.227968],
  [0.280085, 0.672501, 0.047413],
  [-0.01182, 0.04294, 0.968881],
];

function simulateCvd(hex: string, matrix: readonly [number, number, number][]): [number, number, number] {
  const { r, g, b } = hexToRgb(hex);
  const lr = srgbChannelToLinear(r);
  const lg = srgbChannelToLinear(g);
  const lb = srgbChannelToLinear(b);
  const m0 = matrix[0]!;
  const m1 = matrix[1]!;
  const m2 = matrix[2]!;
  return [
    linearToSrgbChannel(m0[0] * lr + m0[1] * lg + m0[2] * lb),
    linearToSrgbChannel(m1[0] * lr + m1[1] * lg + m1[2] * lb),
    linearToSrgbChannel(m2[0] * lr + m2[1] * lg + m2[2] * lb),
  ];
}

function srgbUnitToLab(rgb: [number, number, number]): [number, number, number] {
  const rl = rgb[0] <= 0.04045 ? rgb[0] / 12.92 : Math.pow((rgb[0] + 0.055) / 1.055, 2.4);
  const gl = rgb[1] <= 0.04045 ? rgb[1] / 12.92 : Math.pow((rgb[1] + 0.055) / 1.055, 2.4);
  const bl = rgb[2] <= 0.04045 ? rgb[2] / 12.92 : Math.pow((rgb[2] + 0.055) / 1.055, 2.4);

  // sRGB -> XYZ D65
  const x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
  const z = (rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041) / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function deltaE76(labA: [number, number, number], labB: [number, number, number]): number {
  const dl = labA[0] - labB[0];
  const da = labA[1] - labB[1];
  const db = labA[2] - labB[2];
  return Math.round(Math.sqrt(dl * dl + da * da + db * db) * 100) / 100;
}

export function machadoColorBlindDeltaE(hexA: string, hexB: string): {
  protanDeltaE: number;
  deutanDeltaE: number;
  minDeltaE: number;
} {
  const protanDeltaE = deltaE76(
    srgbUnitToLab(simulateCvd(hexA, PROTAN_MATRIX)),
    srgbUnitToLab(simulateCvd(hexB, PROTAN_MATRIX)),
  );
  const deutanDeltaE = deltaE76(
    srgbUnitToLab(simulateCvd(hexA, DEUTAN_MATRIX)),
    srgbUnitToLab(simulateCvd(hexB, DEUTAN_MATRIX)),
  );
  return {
    protanDeltaE,
    deutanDeltaE,
    minDeltaE: Math.min(protanDeltaE, deutanDeltaE),
  };
}
