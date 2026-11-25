import React, { useEffect, useRef } from "react";

/* ============================================================================
 * 1. Canonical Brand Marks & Wordmark Lockup (Q3 Accepted: Geist 600 Title Case)
 * ============================================================================ */

export type BrandMarkVariant = "color" | "on-light" | "on-dark" | "monochrome";

const MARK_COLORS: Record<BrandMarkVariant, { topDot: string; arch: string; endDots: string; left: string; center: string; right: string }> = {
  color: { topDot: "#E4CBAF", arch: "#D6B48A", endDots: "#D6B48A", left: "#2B1F16", center: "#E4CBAF", right: "#6B4D35" },
  "on-light": { topDot: "#6B4D35", arch: "#6B4D35", endDots: "#6B4D35", left: "#2B1F16", center: "#4A3022", right: "#2B1F16" },
  "on-dark": { topDot: "#E4CBAF", arch: "#D6B48A", endDots: "#D6B48A", left: "#FAF8F5", center: "#D6B48A", right: "#C08A4A" },
  monochrome: { topDot: "currentColor", arch: "currentColor", endDots: "currentColor", left: "currentColor", center: "currentColor", right: "currentColor" },
};

export interface HahlexMarkProps {
  variant?: BrandMarkVariant;
  size?: number;
  decorative?: boolean;
  className?: string;
}

export function HahlexMark({ variant = "color", size = 32, decorative = false, className }: HahlexMarkProps) {
  const c = MARK_COLORS[variant];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 282"
      width={size}
      height={Math.round((size * 282) / 300)}
      fill="none"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Hahlex"}
      aria-hidden={decorative || undefined}
      focusable="false"
      className={className}
    >
      <circle cx="150" cy="44" r="15" fill={c.topDot} />
      <path d="M47 185A103 103 0 0 1 253 185" stroke={c.arch} strokeWidth="11" strokeLinecap="round" />
      <circle cx="47" cy="186" r="10.5" fill={c.endDots} />
      <circle cx="253" cy="186" r="10.5" fill={c.endDots} />
      <rect x="84" y="158" width="22" height="98" rx="11" fill={c.left} />
      <rect x="138" y="122" width="24" height="134" rx="12" fill={c.center} />
      <rect x="194" y="158" width="22" height="98" rx="11" fill={c.right} />
    </svg>
  );
}

export interface HahlexLockupProps {
  variant?: BrandMarkVariant;
  size?: number;
  sublabel?: string;
  color?: string;
}

export function HahlexLockup({ variant = "color", size = 28, sublabel, color = "var(--fg-default)" }: HahlexLockupProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, color }}>
      <HahlexMark variant={variant} size={size} decorative />
      <span
        className="brand-word"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: Math.round(size * 0.78),
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        Hahlex
      </span>
      {sublabel ? (
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: Math.round(size * 0.46),
            fontWeight: 500,
            color: variant === "on-dark" ? "var(--fg-muted-on-stage-dark)" : "var(--fg-muted)",
            borderLeft: `1px solid ${variant === "on-dark" ? "var(--border-stage-dark)" : "var(--border-default)"}`,
            paddingLeft: 10,
            lineHeight: 1.2,
          }}
        >
          {sublabel}
        </span>
      ) : null}
    </span>
  );
}

/* ============================================================================
 * 2. Structural & Geometric Surfaces (Zero-Photo, Static-First)
 * ============================================================================ */

export interface CoordinateGridSurfaceProps {
  surface?: "editorial" | "stage-dark" | "base";
  showCrosshairs?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function CoordinateGridSurface({
  surface = "editorial",
  showCrosshairs = true,
  children,
  style,
}: CoordinateGridSurfaceProps) {
  const isDark = surface === "stage-dark";
  const bg = isDark ? "var(--bg-stage-dark)" : surface === "editorial" ? "var(--bg-editorial)" : "var(--bg-surface)";
  const border = isDark ? "var(--border-stage-dark)" : "var(--border-default)";
  const markColor = isDark ? "var(--fg-accent-on-stage-dark)" : "var(--border-strong)";

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: "var(--radius-lg, 16px)",
        overflow: "hidden",
        ...style,
      }}
    >
      {showCrosshairs ? (
        <>
          {(
            [
              { top: 10, left: 10 },
              { top: 10, right: 10 },
              { bottom: 10, left: 10 },
              { bottom: 10, right: 10 },
            ] as const
          ).map((pos, i) => (
            <svg
              key={i}
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              style={{ position: "absolute", pointerEvents: "none", color: markColor, ...pos }}
            >
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1" />
            </svg>
          ))}
        </>
      ) : null}
      {children}
    </div>
  );
}

export interface DotMatrixFieldProps {
  tone?: "light" | "dark";
  spacing?: number;
  height?: number;
  children?: React.ReactNode;
}

export function DotMatrixField({ tone = "light", spacing = 22, height = 220, children }: DotMatrixFieldProps) {
  const dotColor = tone === "dark" ? "rgba(214, 180, 138, 0.24)" : "rgba(107, 77, 53, 0.18)";
  const bg = tone === "dark" ? "var(--bg-stage-dark)" : "var(--bg-editorial-alt)";
  const border = tone === "dark" ? "var(--border-stage-dark)" : "var(--border-default)";

  return (
    <div
      style={{
        position: "relative",
        minHeight: height,
        borderRadius: "var(--radius-lg, 16px)",
        border: `1px solid ${border}`,
        backgroundColor: bg,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <defs>
          <pattern id={`millar-dot-${tone}-${spacing}`} width={spacing} height={spacing} patternUnits="userSpaceOnUse">
            <circle cx={spacing / 2} cy={spacing / 2} r="1.25" fill={dotColor} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#millar-dot-${tone}-${spacing})`} />
      </svg>
      <div style={{ position: "relative", zIndex: 1, width: "100%" }}>{children}</div>
    </div>
  );
}

/**
 * Code-native HTML5 Canvas + deterministic vector fallback rendering Hahlex's subtle
 * shelter-arch and three ascending proportions in Measured Warmth style.
 * Static-first: draws one crisp DPR-calibrated frame without burning continuous rAF CPU.
 */
export interface ConcentricArcCanvasProps {
  tone?: "light" | "dark";
  height?: number;
  caption?: string;
}

export function ConcentricArcCanvas({ tone = "light", height = 240, caption }: ConcentricArcCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || 560;
    const h = canvas.clientHeight || height;
    canvas.width = width * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, h);
    const cx = width * 0.5;
    const cy = h * 0.88;
    const baseR = Math.min(width * 0.42, h * 0.78);
    const strokePrimary = tone === "dark" ? "rgba(214, 180, 138, 0.36)" : "rgba(107, 77, 53, 0.24)";
    const strokeAccent = tone === "dark" ? "rgba(209, 160, 104, 0.78)" : "rgba(165, 107, 35, 0.62)";
    const crimsonAccent = tone === "dark" ? "#F0857F" : "#B3121B";

    // Concentric shelter arcs with calibrated radial spacing
    const rings = [0.35, 0.52, 0.68, 0.84, 1.0];
    rings.forEach((factor, idx) => {
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseR * factor, Math.PI, 0, false);
      ctx!.strokeStyle = idx === 2 ? strokeAccent : strokePrimary;
      ctx!.lineWidth = idx === 2 ? 1.5 : 1;
      ctx!.setLineDash(idx === 1 || idx === 3 ? [3, 5] : []);
      ctx!.stroke();
    });
    ctx.setLineDash([]);

    // Calibrated tick marks along the outer measuring arc (zenith meridian marked in Hahlex Crimson)
    for (let deg = 180; deg <= 360; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const isZenith = deg === 270;
      const rIn = baseR * (isZenith ? 0.92 : 0.96);
      const rOut = baseR * (isZenith ? 1.07 : deg % 45 === 0 ? 1.05 : 1.02);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * rIn, cy + Math.sin(rad) * rIn);
      ctx.lineTo(cx + Math.cos(rad) * rOut, cy + Math.sin(rad) * rOut);
      ctx.strokeStyle = isZenith ? crimsonAccent : deg % 45 === 0 ? strokeAccent : strokePrimary;
      ctx.lineWidth = isZenith ? 2 : deg % 45 === 0 ? 1.5 : 1;
      ctx.stroke();
    }

    // Precision Hahlex Crimson focal registration dot at zenith (< 1% surface budget)
    ctx.beginPath();
    ctx.arc(cx, cy - baseR * 0.68, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = crimsonAccent;
    ctx.fill();

    // Subtle three-pillar Hahlex proportion echo anchored strictly to App Warm Sand constants
    const barW = 8;
    const bars = [
      { dx: -24, height: baseR * 0.34, fill: tone === "dark" ? "#FAFAFA" : "#2B1F16" },
      { dx: 0, height: baseR * 0.50, fill: tone === "dark" ? "#D6B48A" : "#A56B23" },
      { dx: 24, height: baseR * 0.34, fill: tone === "dark" ? "#D1A068" : "#6B4D35" },
    ];
    for (const b of bars) {
      ctx.fillStyle = b.fill;
      ctx.beginPath();
      ctx.roundRect(cx + b.dx - barW / 2, cy - b.height, barW, b.height, 4);
      ctx.fill();
    }
  }, [tone, height]);

  const bg = tone === "dark" ? "var(--bg-stage-dark)" : "var(--bg-editorial)";
  const border = tone === "dark" ? "var(--border-stage-dark)" : "var(--border-default)";

  return (
    <figure
      style={{
        margin: 0,
        position: "relative",
        borderRadius: "var(--radius-lg, 16px)",
        border: `1px solid ${border}`,
        backgroundColor: bg,
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label={caption ?? "Hahlex concentric measurement arcs"}
        style={{ display: "block", width: "100%", height }}
      />
      {caption ? (
        <figcaption
          style={{
            padding: "8px 14px",
            borderTop: `1px solid ${border}`,
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-micro, 0.75rem)",
            color: tone === "dark" ? "var(--fg-muted-on-stage-dark)" : "var(--fg-subtle)",
          }}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * Procedural torn-paper SVG boundary connecting Editorial Cream and Deep Espresso surfaces.
 * Preserves Hahlex's tactile classroom/paper heritage with zero raster overhead.
 */
export interface PaperTearDividerProps {
  topColor?: string;
  bottomColor?: string;
  height?: number;
}

export function PaperTearDivider({
  topColor = "var(--bg-editorial)",
  bottomColor = "var(--bg-stage-dark)",
  height = 44,
}: PaperTearDividerProps) {
  return (
    <div aria-hidden="true" style={{ width: "100%", height, backgroundColor: topColor, lineHeight: 0, overflow: "hidden" }}>
      <svg viewBox="0 0 1440 48" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
        <path
          d="M0,18 L64,22 L128,13 L196,25 L268,16 L342,26 L418,14 L496,21 L574,11 L652,24 L732,16 L810,27 L892,13 L976,22 L1054,15 L1132,26 L1214,14 L1296,23 L1372,15 L1440,20 L1440,48 L0,48 Z"
          fill={bottomColor}
        />
      </svg>
    </div>
  );
}

/**
 * Explicitly Approved Purposeful Marketing Visual Asset (ADR-0002 / Q2).
 * gradientPolicy = "approved-visual-asset".
 * Provides a restrained, calibrated warm bronze horizon wash on Deep Espresso marketing stages,
 * keeping text foreground contrast >= 14:1 across the entire reading plane.
 */
export interface WarmHorizonWashProps {
  children: React.ReactNode;
  intensity?: "subtle" | "editorial";
  style?: React.CSSProperties;
}

export function WarmHorizonWash({ children, intensity = "subtle", style }: WarmHorizonWashProps) {
  const alpha = intensity === "editorial" ? 0.22 : 0.14;
  return (
    <div
      data-millar-approved-gradient="warm-horizon-wash"
      style={{
        position: "relative",
        backgroundColor: "var(--bg-stage-dark)",
        color: "var(--fg-on-stage-dark)",
        borderRadius: "var(--radius-xl, 22px)",
        border: "1px solid var(--border-stage-dark)",
        overflow: "hidden",
        backgroundImage: `radial-gradient(ellipse 75% 55% at 50% 0%, rgba(209, 160, 104, ${alpha}), transparent 70%)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
