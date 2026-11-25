"use client";

import React, { useMemo, useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Badge, ChoiceToggle, DataTable, IconCheck, IconCopy } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

const APP_ROOT_RAMP = [
  { name: "Charcoal", token: "--hah-charcoal", hex: "#2b1f16", role: "Primary ink" },
  { name: "Espresso", token: "--hah-espresso", hex: "#3d2a1c", role: "Dark anchor & chart" },
  { name: "CTA Brown", token: "--hah-cta-brown", hex: "#4a3022", role: "Primary CTA (12.1:1)" },
  { name: "Deep Sand", token: "--hah-deep-sand", hex: "#6b4d35", role: "Logo & dark CTA" },
  { name: "Bronze", token: "--hah-bronze", hex: "#a56b23", role: "Brand accent & icons" },
  { name: "Caramel", token: "--hah-caramel", hex: "#d1a068", role: "Highlights & glow" },
  { name: "Soft Sand", token: "--hah-soft-sand", hex: "#d6b48a", role: "Dark accent & focus" },
  { name: "Tan", token: "--hah-tan", hex: "#e4cbaf", role: "Borders & center pillar" },
  { name: "Sand", token: "--hah-sand", hex: "#f2e6cd", role: "Editorial cards" },
  { name: "Cream", token: "--hah-cream", hex: "#faf3ea", role: "Editorial alt & wash" },
  { name: "Hahlex Crimson", token: "--hah-crimson", hex: "#b3121b", role: "Tension, quotes & errors" },
] as const;

const COLOR_GROUPS = [
  { id: "surfaces", label: "Surfaces & Canvas", match: (cssVar: string) => cssVar.startsWith("--bg-") },
  { id: "foreground", label: "Foreground & Ink", match: (cssVar: string) => cssVar.startsWith("--fg-") },
  { id: "brand", label: "Brand, Editorial Crimson & Focus", match: (cssVar: string) => cssVar.startsWith("--accent") || cssVar.startsWith("--focus") || cssVar.startsWith("--tone-") },
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
      await navigator.clipboard.writeText(cssVar.startsWith("--") ? `var(${cssVar})` : cssVar);
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
        description="Unified OKLCH palette anchored directly to the Hahlex App (hahlex-edu) Warm Sand + Crimson root ramp. Both Product and Marketing derive every surface, ink, and Crimson tension accent from this single source."
        badges={[
          { label: `${registry.contrastSummary.passed}/${registry.contrastSummary.totalChecked} AA Pass`, tone: "success" },
          { label: `CVD Delta-E ${registry.colorBlindSummary.minDeltaE}`, tone: "sage" },
        ]}
        importPath="@hahlex/millar-tokens/tokens.css"
      />

      {/* Canonical App Brand Deck Root Ramp (Warm Sand + Hahlex Crimson) */}
      <SpecimenFrame
        title="Hahlex App Root Ramp (Warm Sand + Crimson)"
        description="The canonical 11-step brand ramp from hahlex-edu (base.css). Marketing Cream, Sand, Espresso stages, Caramel horizon lighting, and Hahlex Crimson (#B3121B / #F0857F) all derive directly from these exact anchors."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {APP_ROOT_RAMP.map((item) => (
            <button
              key={item.token}
              type="button"
              onClick={() => copyVar(item.hex)}
              className="millar-focus"
              style={{
                textAlign: "left",
                padding: 10,
                borderRadius: "var(--radius-md)",
                border: item.token === "--hah-crimson" ? "1px solid var(--accent-crimson-border)" : "1px solid var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--fg-default)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  height: 36,
                  width: "100%",
                  borderRadius: 8,
                  backgroundColor: item.hex,
                  border: "1px solid var(--border-default)",
                  display: "block",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <strong style={{ fontSize: "var(--text-meta)", fontWeight: 600 }}>{item.name}</strong>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-accent)" }}>
                  {copied === item.hex ? "Copied!" : item.hex}
                </code>
                <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>{item.role}</span>
              </div>
            </button>
          ))}
        </div>
      </SpecimenFrame>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
          Semantic tokens switch automatically across Light and Dark polarity. Click any swatch to copy its CSS variable.
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
        description="Verified App-rooted pairs ensuring zero WCAG AA regressions across Product and Marketing."
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
            { id: "1", surface: "--accent-soft (#D6B48A)", ink: "--fg-on-accent-soft (#362218)", ratio: "7.69:1 AAA", note: "Fixes 1.00:1 dark-mode invisible toggle defect" },
            { id: "2", surface: "--accent-editorial (#4A3022)", ink: "--fg-on-accent (#FFFFFF)", ratio: "12.09:1 AAA", note: "Unified App CTA Brown replacing low-contrast legacy bronze" },
            { id: "3", surface: "--bg-editorial-alt (#FAF3EA)", ink: "--accent-crimson (#B3121B)", ratio: "6.34:1 AA+", note: "App Hahlex Crimson tension & editorial quote accent (< 1.5% area)" },
            { id: "4", surface: "--bg-stage-dark (#1A130D)", ink: "--accent-crimson-on-stage-dark (#F0857F)", ratio: "7.88:1 AAA", note: "Dark-stage Hahlex Crimson highlight on Deep Espresso" },
            { id: "5", surface: "--bg-stage-dark (#1A130D)", ink: "--fg-on-stage-dark (#FAFAFA)", ratio: "17.8+:1 AAA", note: "Deep Espresso marketing showcase stages anchored to App dark ink" },
          ]}
          rowKey={(r) => r.id}
        />
      </SpecimenFrame>
    </div>
  );
}
