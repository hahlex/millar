"use client";

import React, { useState } from "react";
import Link from "next/link";
import registry from "@hahlex/millar-tokens/registry";
import { Badge, Button, Card, IconArrowRight, IconCode, IconLayers, IconPalette, IconShield } from "@hahlex/millar-ui";
import {
  BentoNarrativeMosaic,
  ConcentricArcCanvas,
  CoordinateGridSurface,
  DataTableSpecimenFrame,
  PaperTearDivider,
  ProductStageShowcase,
  WarmHorizonWash,
} from "@hahlex/millar-marketing";

export default function MillarHomePage() {
  const [heroRegister, setHeroRegister] = useState<"marketing" | "product">("marketing");

  return (
    <div>
      {/* Signature Opening: Measured Warmth Spatial Stage */}
      <section style={{ padding: "clamp(28px, 4vw, 56px) clamp(16px, 4vw, 48px)", backgroundColor: "var(--bg-editorial)" }}>
        <WarmHorizonWash intensity="editorial" style={{ maxWidth: 1320, margin: "0 auto", padding: "clamp(28px, 5vw, 60px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "clamp(28px, 4vw, 56px)", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.4rem, 5vw, 4rem)",
                  fontWeight: 300,
                  lineHeight: "var(--leading-display-hero, 1.08)",
                  letterSpacing: "var(--tracking-display, -0.02em)",
                  color: "var(--fg-on-stage-dark)",
                }}
              >
                Millar is Hahlex&apos;s measured language for craft, clarity, and AI builders.
              </h1>
              <p
                style={{
                  margin: 0,
                  maxWidth: 560,
                  fontSize: "var(--text-lead, 1.125rem)",
                  lineHeight: 1.55,
                  color: "var(--fg-muted-on-stage-dark)",
                }}
              >
                One W3C DTCG 2025.10 Single Source of Truth powering Shared Foundations, photo-free Marketing visual systems, accessible Product primitives, and the Millar MCP Server.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", paddingTop: 4 }}>
                <Link href="/foundations" style={{ textDecoration: "none" }}>
                  <Button variant="primary" size="lg" style={{ backgroundColor: "#6B4D35", borderColor: "#6B4D35", color: "#FFFFFF" }}>
                    Explore Foundations
                    <IconArrowRight size="md" />
                  </Button>
                </Link>
                <Link href="/marketing" style={{ textDecoration: "none" }}>
                  <Button variant="ghost" size="lg" style={{ color: "var(--fg-on-stage-dark)", borderColor: "var(--border-stage-dark)" }}>
                    Visual Asset Gallery
                  </Button>
                </Link>
                <Link href="/resources" style={{ textDecoration: "none" }}>
                  <Button variant="ghost" size="lg" style={{ color: "var(--fg-on-stage-dark)", borderColor: "var(--border-stage-dark)" }}>
                    Connect MCP Server
                  </Button>
                </Link>
              </div>

              <dl
                style={{
                  margin: "12px 0 0",
                  paddingTop: 20,
                  borderTop: "1px solid var(--border-stage-dark)",
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 14,
                }}
              >
                {[
                  { value: `${registry.contrastSummary.passed}/${registry.contrastSummary.totalChecked}`, label: "WCAG AA Pairs" },
                  { value: String(registry.compositionPatterns.length), label: "Compositions" },
                  { value: String(registry.visualAssets.length), label: "Visual Assets" },
                  { value: "11", label: "MCP Tools" },
                ].map((stat) => (
                  <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <dd className="tabular-nums" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 300, color: "var(--fg-accent-on-stage-dark)" }}>
                      {stat.value}
                    </dd>
                    <dt style={{ fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-muted-on-stage-dark)" }}>{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* Live interactive Register switcher inside the opening stage */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-muted-on-stage-dark)" }}>
                  Live Register Proof
                </span>
                <div style={{ display: "inline-flex", gap: 6 }}>
                  {(["marketing", "product"] as const).map((reg) => (
                    <button
                      key={reg}
                      type="button"
                      aria-pressed={heroRegister === reg}
                      onClick={() => setHeroRegister(reg)}
                      className="millar-focus"
                      style={{
                        padding: "5px 12px",
                        borderRadius: "var(--radius-pill, 9999px)",
                        border: `1px solid ${heroRegister === reg ? "var(--fg-accent-on-stage-dark)" : "var(--border-stage-dark)"}`,
                        backgroundColor: heroRegister === reg ? "#6B4D35" : "var(--bg-stage-dark-card)",
                        color: "#FFFFFF",
                        fontSize: "var(--text-micro, 0.75rem)",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {reg === "marketing" ? "Marketing Register" : "Product Register"}
                    </button>
                  ))}
                </div>
              </div>
              {heroRegister === "marketing" ? (
                <ConcentricArcCanvas tone="dark" height={290} caption="Measured Warmth · Code-Native Shelter Arch Geometry (0 Photos)" />
              ) : (
                <DataTableSpecimenFrame />
              )}
            </div>
          </div>
        </WarmHorizonWash>
      </section>

      {/* Four Entry Portals built on Architectural Visible-Rule Grid */}
      <section style={{ padding: "clamp(40px, 6vw, 72px) clamp(16px, 4vw, 48px)", backgroundColor: "var(--bg-editorial)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3vw, 2.35rem)", fontWeight: 300 }}>
            Three cohesive tiers, one single source of truth
          </h2>
          <CoordinateGridSurface surface="base" showCrosshairs>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              {[
                {
                  href: "/foundations",
                  icon: <IconPalette size="md" />,
                  code: "TIER 01 · SHARED",
                  title: "Shared Foundations",
                  desc: "Unified Geist + Inter + Geist Mono typography (:lang(vi) safe), OKLCH Warm Sand/Bronze/Espresso tokens, canonical SVG marks, and WCAG 2.1 AA rules.",
                },
                {
                  href: "/marketing",
                  icon: <IconLayers size="md" />,
                  code: "TIER 02 · PERSUADE",
                  title: "Marketing Design",
                  desc: "6 diverse Composition Patterns, 12 code-native zero-photo Visual Assets, Expressive Motion, 10 Marketing Sections, and visual Do/Don't proofs.",
                },
                {
                  href: "/product",
                  icon: <IconShield size="md" />,
                  code: "TIER 03 · OPERATE",
                  title: "Product & App System",
                  desc: "Zero-gradient accessible React primitives, Ant Design 6 literal theme adapter, APG keyboard contracts, and decoupled Education domain extension.",
                },
                {
                  href: "/resources",
                  icon: <IconCode size="md" />,
                  code: "AI AGENT · MCP",
                  title: "Millar MCP & Assets",
                  desc: "11 MCP tools, cacheable millar:// Resources, 3 Prompts, deterministic vs. aesthetic validator, and downloadable brand & poster kits.",
                },
              ].map((entry, i) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="millar-focus"
                  style={{
                    padding: "26px 24px",
                    borderRight: i % 2 === 0 ? "1px solid var(--border-default)" : "none",
                    borderBottom: i < 2 ? "1px solid var(--border-default)" : "none",
                    textDecoration: "none",
                    color: "var(--fg-default)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-accent)" }}>
                      {entry.code}
                    </code>
                    <span style={{ color: "var(--fg-accent)" }}>{entry.icon}</span>
                  </div>
                  <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title, 1.125rem)", fontWeight: 600 }}>
                    {entry.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: "var(--text-body-sm, 0.875rem)", lineHeight: 1.55, color: "var(--fg-muted)" }}>
                    {entry.desc}
                  </p>
                </Link>
              ))}
            </div>
          </CoordinateGridSurface>
        </div>
      </section>

      <PaperTearDivider topColor="var(--bg-editorial)" bottomColor="var(--bg-stage-dark)" />
      <ProductStageShowcase heading="Inspect Millar live across registers and agents" />
      <BentoNarrativeMosaic
        heading="Solved at the root: visual polish with zero stock photos"
        lead="Every visual asset, section, and template ships with live preview, copyable React code, responsive rules, and machine-readable MCP metadata."
      />

      {/* Brand Philosophy Poster Preview Strip */}
      <section style={{ padding: "clamp(48px, 7vw, 80px) clamp(16px, 4vw, 48px)", backgroundColor: "var(--bg-editorial)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 36, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Badge tone="brand">Measured Warmth · Visual Philosophy</Badge>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.85rem, 3.2vw, 2.5rem)", fontWeight: 300, lineHeight: 1.15 }}>
              Tactile warmth calibrated like an architectural instrument.
            </h2>
            <p style={{ margin: 0, maxWidth: "60ch", fontSize: "var(--text-body, 0.9375rem)", lineHeight: 1.6, color: "var(--fg-muted)" }}>
              From archival Warm Cream and Deep Espresso stages to Josef Albers mineral surface steps, Millar gives designers and AI coding agents an unmistakable Hahlex visual voice without copying Vercel, Linear, or ElevenLabs.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 6 }}>
              <a href="/millar/brand/measured-warmth-poster.pdf" download style={{ textDecoration: "none" }}>
                <Button variant="primary">Download Specimen PDF</Button>
              </a>
              <Link href="/marketing" style={{ textDecoration: "none" }}>
                <Button variant="white">Inspect 6 Composition Patterns</Button>
              </Link>
            </div>
          </div>
          <Card surface="base" padding="compact">
            <img
              src="/millar/brand/measured-warmth-poster.png"
              alt="Millar Measured Warmth Specimen Plate 01 poster featuring concentric shelter arcs, three ascending pillars, and calibrated Warm Sand to Espresso mineral swatches"
              width={800}
              height={1066}
              style={{ width: "100%", height: "auto", borderRadius: "var(--radius-md, 12px)", display: "block" }}
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
