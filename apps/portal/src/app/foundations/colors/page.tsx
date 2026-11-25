"use client";

import React, { useMemo, useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Badge, ChoiceToggle, DataTable, IconCheck, IconCopy } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

const COLOR_GROUPS = [
  { id: "surfaces", label: "Surfaces & Canvas", match: (cssVar: string) => cssVar.startsWith("--bg-") },
  { id: "foreground", label: "Foreground & Ink", match: (cssVar: string) => cssVar.startsWith("--fg-") },
  { id: "brand", label: "Brand, Accent & Focus", match: (cssVar: string) => cssVar.startsWith("--accent") || cssVar.startsWith("--focus") || cssVar.startsWith("--tone-") },
  { id: "borders", label: "Borders & Hairlines", match: (cssVar: string) => cssVar.startsWith("--border-") },
  { id: "status", label: "Semantic Status (Moss / Ochre / Crimson)", match: (cssVar: string) => cssVar.startsWith("--status-") },
  { id: "charts", label: "Data Visualization (CVD-Safe)", match: (cssVar: string) => cssVar.startsWith("--chart-") },
] as const;

export default function ColorsFoundationPage() {
  const [polarity, setPolarity] = useState<"light" | "dark">("light");
  const [copied, setCopied] = useState<string | null>(null);

  const tokens = useMemo(() => {
    const src = polarity === "dark" ? registry.tokens.dark : registry.tokens.light;
    return src.filter((t) => t.category === "color");
  }, [polarity]);

  const copyVar = async (cssVar: string) => {
    try {
      await navigator.clipboard.writeText(`var(${cssVar})`);
      setCopied(cssVar);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Foundations"
        title="Colors & Themes"
        description="OKLCH-calibrated Warm Sand, Bronze, Deep Espresso, Warm Obsidian, Status, and Machado CVD-verified Data-Viz color tokens. Every foreground/background pair clears WCAG 2.1 AA at compile time."
        badges={[
          { label: `${registry.contrastSummary.passed}/${registry.contrastSummary.totalChecked} AA Pass`, tone: "success" },
          { label: `CVD Delta-E ${registry.colorBlindSummary.minDeltaE}`, tone: "sage" },
        ]}
        importPath="@hahlex/millar-tokens/tokens.css"
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
          Click any color swatch to copy its semantic CSS custom property.
        </span>
        <ChoiceToggle
          label="Color palette polarity"
          value={polarity}
          onChange={setPolarity}
          options={[
            { value: "light", label: "Light Theme" },
            { value: "dark", label: "Dark Theme" },
          ]}
        />
      </div>

      {COLOR_GROUPS.map((group) => {
        const items = tokens.filter((t) => group.match(t.cssVar));
        if (items.length === 0) return null;
        return (
          <section key={group.id} aria-labelledby={`color-group-${group.id}`} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2
              id={`color-group-${group.id}`}
              style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}
            >
              {group.label}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 10 }}>
              {items.map((tok) => {
                const check = tok.contrastChecks?.[0];
                const isCopied = copied === tok.cssVar;
                return (
                  <button
                    key={tok.path}
                    type="button"
                    onClick={() => copyVar(tok.cssVar)}
                    className="millar-focus"
                    style={{
                      textAlign: "left",
                      padding: 12,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--bg-surface)",
                      color: "var(--fg-default)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 8,
                          backgroundColor: tok.value,
                          border: "1px solid var(--border-strong)",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                          <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {tok.cssVar}
                          </code>
                          <span style={{ color: "var(--fg-accent)", flexShrink: 0 }}>
                            {isCopied ? <IconCheck size="sm" /> : <IconCopy size="sm" />}
                          </span>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-subtle)" }}>
                          {tok.value}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>{tok.description.slice(0, 56)}</span>
                      {check ? (
                        <Badge tone={check.pass ? "success" : "error"} dot={false}>
                          {check.ratio}:1
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <SpecimenFrame
        title="Critical Contrast Guardrails"
        description="Verified pairs preventing audited dark-mode and legacy bronze failures."
      >
        <DataTable
          caption="Color safety rules enforced across Millar"
          columns={[
            { key: "surface", header: "Surface" },
            { key: "ink", header: "Required Foreground" },
            { key: "ratio", header: "Verified Ratio", align: "right", numeric: true },
            { key: "note", header: "Rule" },
          ]}
          rows={[
            { id: "1", surface: "--accent-soft (#D9BFA1)", ink: "--fg-on-accent-soft (#362218)", ratio: "7.69:1 AAA", note: "Fixes 1.00:1 dark-mode invisible toggle defect" },
            { id: "2", surface: "--accent-editorial (#7A4E16)", ink: "--fg-on-accent (#FFFFFF)", ratio: "7.17:1 AAA", note: "Fixes legacy #A26A25 (4.31:1) and #C08A4A (2.86:1)" },
            { id: "3", surface: "--bg-surface (Dark #1C1917)", ink: "--status-error (#F0857F)", ratio: "6.97:1 AA+", note: "Always use outlined Danger button in dark mode" },
            { id: "4", surface: "--bg-stage-dark (#1A130D)", ink: "--fg-on-stage-dark (#FFF8F0)", ratio: "17.44:1 AAA", note: "Deep Espresso marketing showcase stages" },
          ]}
          rowKey={(r) => r.id}
        />
      </SpecimenFrame>
    </div>
  );
}
