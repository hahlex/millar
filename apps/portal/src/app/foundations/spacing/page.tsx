"use client";

import React from "react";
import registry from "@hahlex/millar-tokens/registry";
import { DataTable } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function SpacingFoundationPage() {
  const spacingTokens = registry.tokens.base.filter((t) => t.category === "spacing");
  const radiusTokens = registry.tokens.base.filter((t) => t.category === "radius");
  const breakpointTokens = registry.tokens.base.filter((t) => t.category === "breakpoint");
  const zIndexTokens = registry.tokens.base.filter((t) => t.category === "zIndex");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Foundations"
        title="Spacing, Grid & Surface Roles"
        description="4px-base spatial scale, tactile radius ladder, named Surface Roles (single-elevation discipline: 1px border OR lifted shadow, never noisy ghost cards), breakpoints, and z-index layering."
        importPath="@hahlex/millar-tokens/tokens.css"
      />

      <SpecimenFrame
        title="Named Surface Roles (Materials)"
        description="Every container maps to one explicit surface role instead of ad-hoc background/shadow combinations."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          {[
            { name: "Base Surface", bg: "var(--bg-surface)", border: "1px solid var(--border-default)", shadow: "none", fg: "var(--fg-default)", note: "Cards, tables, inputs" },
            { name: "Inset Surface", bg: "var(--bg-surface-2)", border: "1px solid var(--border-default)", shadow: "none", fg: "var(--fg-default)", note: "Nested code/filters" },
            { name: "Raised Surface", bg: "var(--bg-elevated)", border: "none", shadow: "var(--shadow-card)", fg: "var(--fg-default)", note: "Shadow only (no border)" },
            { name: "Editorial Cream", bg: "var(--bg-editorial)", border: "1px solid var(--border-default)", shadow: "none", fg: "var(--fg-default)", note: "Marketing light canvas" },
            { name: "Deep Espresso Stage", bg: "var(--bg-stage-dark)", border: "1px solid var(--border-stage-dark)", shadow: "none", fg: "var(--fg-on-stage-dark)", note: "Marketing dark showcase" },
          ].map((role) => (
            <div
              key={role.name}
              style={{
                padding: 16,
                borderRadius: "var(--radius-lg)",
                backgroundColor: role.bg,
                border: role.border,
                boxShadow: role.shadow,
                color: role.fg,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                minHeight: 96,
              }}
            >
              <strong style={{ fontSize: "var(--text-body-sm)", fontWeight: 600 }}>{role.name}</strong>
              <span style={{ fontSize: "var(--text-micro)", opacity: 0.8 }}>{role.note}</span>
            </div>
          ))}
        </div>
      </SpecimenFrame>

      <SpecimenFrame
        title="Spacing Scale"
        description="Deterministic 4px spatial rhythm tokens compiled from spacing-layout.tokens.json."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {spacingTokens.map((t) => (
            <div key={t.path} style={{ display: "grid", gridTemplateColumns: "150px 72px minmax(0, 1fr)", alignItems: "center", gap: 12 }}>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-default)" }}>{t.cssVar}</code>
              <span className="tabular-nums" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>
                {t.value}
              </span>
              <div style={{ height: 14, display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    display: "inline-block",
                    height: 10,
                    width: t.value,
                    maxWidth: "100%",
                    borderRadius: 4,
                    backgroundColor: "var(--accent)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </SpecimenFrame>

      <SpecimenFrame
        title="Border Radius Ladder"
        description="Consistent corner radii across controls, cards, dialogs, and pill badges."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {radiusTokens.map((t) => (
            <div
              key={t.path}
              style={{
                padding: 14,
                borderRadius: t.value,
                border: "1px solid var(--border-strong)",
                backgroundColor: "var(--bg-surface-2)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 600 }}>{t.cssVar}</code>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>{t.value}</span>
            </div>
          ))}
        </div>
      </SpecimenFrame>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <DataTable
          caption="Responsive Breakpoints"
          columns={[
            { key: "cssVar", header: "Token" },
            { key: "value", header: "Width", align: "right", numeric: true },
          ]}
          rows={breakpointTokens.map((t) => ({ id: t.path, cssVar: t.cssVar, value: t.value }))}
          rowKey={(r) => r.id}
        />
        <DataTable
          caption="Z-Index Layering Stack"
          columns={[
            { key: "cssVar", header: "Layer Token" },
            { key: "value", header: "Z-Index", align: "right", numeric: true },
          ]}
          rows={zIndexTokens.map((t) => ({ id: t.path, cssVar: t.cssVar, value: t.value }))}
          rowKey={(r) => r.id}
        />
      </div>
    </div>
  );
}
