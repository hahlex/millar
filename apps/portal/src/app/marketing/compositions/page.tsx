"use client";

import React from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Badge } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function CompositionsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Marketing"
        title="Composition Patterns"
        description="Six distinct spatial grammars engineered so AI coding agents and designers build varied, editorial-grade Hahlex pages without falling back to repetitive 3-column card grids or a single architectural layout."
        badges={[{ label: `${registry.compositionPatterns.length} Patterns`, tone: "brand" }, { label: "Photo-Free", tone: "success" }]}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
