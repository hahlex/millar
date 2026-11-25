"use client";

import React from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Badge } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

function PatternVisualPreview({ id }: { id: string }) {
  switch (id) {
    case "editorial-split":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.35fr 1fr",
            gap: 14,
            padding: 16,
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-editorial-alt)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 300 }}>
              Calm authority without <strong style={{ color: "var(--accent-crimson)", fontWeight: 500 }}>stock photo clutter</strong>.
            </span>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                backgroundColor: "var(--bg-editorial-card)",
                borderLeft: "3px solid var(--accent-crimson)",
                fontSize: "var(--text-micro)",
                color: "var(--fg-default)",
              }}
            >
              <span style={{ color: "var(--accent-crimson)", fontWeight: 600, marginRight: 4 }}>&ldquo;</span>
              App Warm Sand + Hahlex Crimson quote framing.
            </div>
          </div>
          <div
            style={{
              borderRadius: 10,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-editorial)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 12,
            }}
          >
            <svg width="110" height="62" viewBox="0 0 110 62" aria-hidden="true">
              <path d="M12 56 A43 43 0 0 1 98 56" fill="none" stroke="var(--fg-accent)" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M24 56 A31 31 0 0 1 86 56" fill="none" stroke="var(--tone-brand)" strokeWidth="1.5" />
              <circle cx="55" cy="13" r="3" fill="var(--accent-crimson)" />
              <rect x="40" y="34" width="6" height="22" rx="3" fill="var(--fg-default)" />
              <rect x="52" y="24" width="6" height="32" rx="3" fill="var(--tone-brand)" />
              <rect x="64" y="34" width="6" height="22" rx="3" fill="var(--fg-accent)" />
            </svg>
          </div>
        </div>
      );
    case "spatial-product-stage":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr",
            gap: 14,
            padding: 16,
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-stage-dark)",
            border: "1px solid var(--border-stage-dark)",
            color: "var(--fg-on-stage-dark)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 300 }}>
              Espresso Stage + <span style={{ color: "var(--fg-accent-on-stage-dark)" }}>Soft Sand</span> highlight
            </span>
            <span
              style={{
                display: "inline-block",
                width: "fit-content",
                padding: "5px 10px",
                borderRadius: 8,
                backgroundColor: "var(--accent-on-stage-dark)",
                color: "var(--fg-on-accent)",
                fontSize: "var(--text-micro)",
                fontWeight: 500,
              }}
            >
              App Deep Sand CTA
            </span>
          </div>
          <div
            style={{
              padding: 10,
              borderRadius: 10,
              backgroundColor: "var(--bg-stage-dark-card)",
              border: "1px solid var(--border-stage-dark)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-micro)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>--fg-default</span>
              <span style={{ color: "var(--fg-accent-on-stage-dark)" }}>16.03:1</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>--accent-crimson</span>
              <span style={{ color: "var(--accent-crimson-on-stage-dark)" }}>7.88:1</span>
            </div>
          </div>
        </div>
      );
    case "architectural-grid":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            overflow: "hidden",
            fontSize: "var(--text-micro)",
          }}
        >
          {[
            { code: "DTCG 2025.10", text: "App-rooted OKLCH source" },
            { code: "WCAG 2.1 AA", text: "84/84 automated contrast pass" },
            { code: "CRIMSON <1.5%", text: "Strict tension accent budget", crimson: true },
            { code: "MCP 2026-07", text: "11 Tools · 66 Resources" },
          ].map((cell, i) => (
            <div
              key={cell.code}
              style={{
                padding: "10px 12px",
                borderRight: i % 2 === 0 ? "1px solid var(--border-default)" : "none",
                borderBottom: i < 2 ? "1px solid var(--border-default)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <code style={{ fontFamily: "var(--font-mono)", color: cell.crimson ? "var(--accent-crimson)" : "var(--fg-accent)", fontWeight: 600 }}>
                {cell.code}
              </code>
              <span style={{ color: "var(--fg-muted)" }}>{cell.text}</span>
            </div>
          ))}
        </div>
      );
    case "narrative-sequence":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            padding: 14,
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-stage-dark-deep)",
            border: "1px solid var(--border-stage-dark)",
            color: "var(--fg-on-stage-dark)",
            fontSize: "var(--text-micro)",
          }}
        >
          {["01 Audit", "02 Compile", "03 Validate", "04 Ship"].map((step, i) => (
            <div
              key={step}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                backgroundColor: "var(--bg-stage-dark-card)",
                border: `1px solid ${i === 2 ? "var(--accent-crimson-on-stage-dark)" : i === 0 ? "var(--fg-accent-on-stage-dark)" : "var(--border-stage-dark)"}`,
                fontFamily: "var(--font-mono)",
              }}
            >
              {step}
            </div>
          ))}
        </div>
      );
    case "typographic-poster":
      return (
        <div
          style={{
            padding: 16,
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-editorial-alt)",
            border: "1px solid var(--border-default)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 300 }}>
            Monumental Geist 300 + <span style={{ color: "var(--accent-crimson)", fontWeight: 500 }}>Crimson Friction Metrics</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, borderTop: "1px solid var(--border-default)", paddingTop: 10 }}>
            <div style={{ padding: "8px 10px", borderRadius: 8, backgroundColor: "var(--accent-crimson-soft)", border: "1px solid var(--accent-crimson-border)" }}>
              <div className="tabular-nums" style={{ fontWeight: 600, color: "var(--accent-crimson)", fontSize: 15 }}>1,880vh -&gt; 0</div>
              <div style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>Crimson tension</div>
            </div>
            <div style={{ padding: "8px 10px", borderRadius: 8, backgroundColor: "var(--bg-stage-dark)", color: "var(--fg-on-stage-dark)" }}>
              <div className="tabular-nums" style={{ fontWeight: 600, color: "var(--fg-accent-on-stage-dark)", fontSize: 15 }}>7.69:1</div>
              <div style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted-on-stage-dark)" }}>Espresso contrast</div>
            </div>
            <div style={{ padding: "8px 10px", borderRadius: 8, backgroundColor: "var(--bg-editorial-card)", border: "1px solid var(--border-default)" }}>
              <div className="tabular-nums" style={{ fontWeight: 600, color: "var(--fg-accent)", fontSize: 15 }}>84 / 84</div>
              <div style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>Warm Sand AA</div>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 10,
            padding: 14,
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-editorial)",
            border: "1px solid var(--border-default)",
            fontSize: "var(--text-micro)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ padding: 10, borderRadius: 8, backgroundColor: "var(--bg-editorial-card)", border: "1px solid var(--border-default)" }}>
              <strong>Unified Orbit + Warm Sand Tile</strong>
            </div>
            <div style={{ padding: 10, borderRadius: 8, backgroundColor: "var(--accent-crimson-soft)", border: "1px solid var(--accent-crimson-border)", color: "var(--accent-crimson)" }}>
              <strong>Crimson Tension Callout (&lt; 1.5%)</strong>
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, backgroundColor: "var(--bg-stage-dark)", color: "var(--fg-on-stage-dark)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <strong style={{ color: "var(--fg-accent-on-stage-dark)" }}>Espresso Counter-Weight</strong>
            <span style={{ color: "var(--fg-muted-on-stage-dark)" }}>Asymmetric scale replaces flat 3-col icon grids.</span>
          </div>
        </div>
      );
  }
}

export default function CompositionsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Marketing"
        title="Composition Patterns"
        description="Six distinct spatial grammars rooted in the Hahlex App Warm Sand + Espresso + Crimson triad so designers and AI coding agents never collapse marketing pages into equal 3-column card grids."
        badges={[
          { label: `${registry.compositionPatterns.length} Patterns`, tone: "brand" },
          { label: "Warm Sand · Espresso · Crimson", tone: "error" },
          { label: "Photo-Free", tone: "success" },
        ]}
        importPath="@hahlex/millar-marketing"
      />

      {registry.compositionPatterns.map((pat, index) => (
        <SpecimenFrame
          key={pat.id}
          title={`${String(index + 1).padStart(2, "0")}. ${pat.name}`}
          description={pat.summary}
          code={pat.exampleCode}
          codeTitle={`Pattern ID: ${pat.id}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PatternVisualPreview id={pat.id} />

            <div style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-default)", lineHeight: 1.6 }}>
              <strong>Spatial grammar:</strong> {pat.spatialGrammar}
            </div>
            <div style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.6 }}>
              <strong>Responsive behavior:</strong> {pat.responsiveBehavior}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div style={{ padding: 12, borderRadius: "var(--radius-sm)", backgroundColor: "var(--bg-surface-2)", display: "flex", flexDirection: "column", gap: 6 }}>
                <strong style={{ fontSize: "var(--text-micro)", color: "var(--status-success)" }}>Best for</strong>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {pat.bestFor.map((b) => (
                    <Badge key={b} tone="sand" dot={false}>
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: "var(--radius-sm)", backgroundColor: "var(--bg-surface-2)", display: "flex", flexDirection: "column", gap: 6 }}>
                <strong style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>Paired Visual Assets</strong>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {pat.pairedAssets.map((a) => (
                    <code
                      key={a}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-micro)",
                        padding: "2px 6px",
                        borderRadius: 6,
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-soft)",
                      }}
                    >
                      {a}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SpecimenFrame>
      ))}
    </div>
  );
}
