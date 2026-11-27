"use client";

import React from "react";
import Link from "next/link";
import registry from "@hahlex/millar-tokens/registry";
import {
  Badge,
  DataTable,
  IconCode,
  IconLayers,
  IconPalette,
  IconSearch,
  IconSettings,
  IconShield,
  IconUsers,
} from "@hahlex/millar-ui";
import { ConcentricArcCanvas, HahlexMark } from "@hahlex/millar-marketing";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";
import { InstallBar } from "@/components/InstallBar";
import { CodeCopyBox } from "@/components/CodeCopyBox";

interface DirectoryTile {
  href: string;
  section: string;
  title: string;
  caption: string;
  preview: React.ReactNode;
}

export default function MillarIntroductionPage() {
  const tiles: DirectoryTile[] = [
    {
      href: "/foundations/colors",
      section: "Foundations",
      title: "Colors & Themes",
      caption: "App-rooted Warm Sand, Bronze, Espresso, Hahlex Crimson & Data-Viz",
      preview: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, width: "100%" }}>
          {[
            "var(--bg-editorial-alt)",
            "var(--accent-soft)",
            "var(--tone-brand)",
            "var(--accent)",
            "var(--accent-crimson)",
            "var(--bg-stage-dark)",
          ].map((c) => (
            <span
              key={c}
              style={{
                height: 44,
                borderRadius: 8,
                backgroundColor: c,
                border: "1px solid var(--border-default)",
                display: "block",
              }}
            />
          ))}
        </div>
      ),
    },
    {
      href: "/foundations/typography",
      section: "Foundations",
      title: "Typography",
      caption: "Geist Sans (300-600), Inter (Body/UI), Geist Mono + :lang(vi)",
      preview: (
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.02em" }}>
            Aa
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500 }}>Geist · Inter · Mono</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--fg-muted)" }}>Tiếng Việt không cắt dấu</span>
          </div>
        </div>
      ),
    },
    {
      href: "/foundations/brand",
      section: "Foundations",
      title: "Brand & Logo",
      caption: "Canonical Vector Arch + 3 Pillars & Geist 600 wordmark",
      preview: (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              backgroundColor: "var(--bg-editorial)",
              border: "1px solid var(--border-default)",
            }}
          >
            <HahlexMark variant="color" size={28} />
          </div>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              backgroundColor: "var(--bg-stage-dark)",
              border: "1px solid var(--border-stage-dark)",
            }}
          >
            <HahlexMark variant="on-dark" size={28} />
          </div>
        </div>
      ),
    },
    {
      href: "/foundations/icons",
      section: "Foundations",
      title: "Icons (54)",
      caption: "Single 1.5px stroke semantic Lucide registry",
      preview: (
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "var(--fg-default)" }}>
          <IconPalette size="lg" />
          <IconLayers size="lg" />
          <IconShield size="lg" />
          <IconSearch size="lg" />
          <IconCode size="lg" />
          <IconUsers size="lg" />
          <IconSettings size="lg" />
        </div>
      ),
    },
    {
      href: "/marketing/visual-assets",
      section: "Marketing",
      title: "Visual Assets (14)",
      caption: "Photo-free SVG, CSS, Canvas & React craft plates",
      preview: (
        <div style={{ width: "100%", borderRadius: 10, overflow: "hidden" }}>
          <ConcentricArcCanvas tone="dark" height={86} />
        </div>
      ),
    },
    {
      href: "/marketing/compositions",
      section: "Marketing",
      title: "Composition Patterns (6)",
      caption: "Editorial Split, Spatial Stage, Bento Mosaic, Poster, Grid, Loop",
      preview: (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 6, width: "100%" }}>
          <div style={{ height: 48, borderRadius: 8, backgroundColor: "var(--bg-editorial-card)", border: "1px solid var(--border-default)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ flex: 1, borderRadius: 6, backgroundColor: "var(--bg-stage-dark)" }} />
            <div style={{ flex: 1, borderRadius: 6, backgroundColor: "var(--tone-brand-soft)", border: "1px solid var(--tone-brand-border)" }} />
          </div>
        </div>
      ),
    },
    {
      href: "/components/button",
      section: "Components",
      title: "Button",
      caption: "7 semantic variants, async double-click guard, outlined dark danger",
      preview: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              backgroundColor: "var(--accent)",
              color: "var(--fg-on-accent)",
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            Primary
          </span>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--fg-default)",
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            White
          </span>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--status-error)",
              color: "var(--status-error)",
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            Danger
          </span>
        </div>
      ),
    },
    {
      href: "/components/data-table",
      section: "Components",
      title: "DataTable & FilterBar",
      caption: "Zero-scrollbar tables, '-' empty cells, mobile cards",
      preview: (
        <div
          style={{
            width: "100%",
            borderRadius: 8,
            border: "1px solid var(--border-default)",
            overflow: "hidden",
            fontSize: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", backgroundColor: "var(--bg-surface-2)", color: "var(--fg-muted)", fontWeight: 500 }}>
            <span>Token</span>
            <span>Ratio</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", borderTop: "1px solid var(--border-soft)", fontFamily: "var(--font-mono)" }}>
            <span>--fg-default</span>
            <span style={{ color: "var(--status-success)" }}>16.03:1</span>
          </div>
        </div>
      ),
    },
    {
      href: "/resources/mcp",
      section: "Resources",
      title: "MCP Server & Agents",
      caption: "13 read-only Tools, 8 Skills & 11 MCP Prompts",
      preview: (
        <div
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            backgroundColor: "var(--bg-stage-dark)",
            color: "var(--fg-on-stage-dark)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
        >
          <div>millar://guidelines/invariants</div>
          <div style={{ color: "var(--fg-accent-on-stage-dark)" }}>validate_design(register)</div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <DocHeader section="Overview" title="Millar Design System" importPath="@hahlex/millar-ui" />

      <InstallBar label="Installation" showTargetSwitch defaultTarget="mcp" />

      {/* Compact System Metrics Strip */}
      <dl
        style={{
          margin: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {[
          { value: `${registry.contrastSummary.passed}/${registry.contrastSummary.totalChecked}`, label: "WCAG AA Contrast Pairs" },
          { value: String(registry.components.length), label: "Product UI Primitives" },
          { value: String(registry.compositionPatterns.length), label: "Marketing Compositions" },
          { value: String(registry.visualAssets.length), label: "Code-Native Assets" },
          { value: "13", label: "MCP Tools · 8 Skills" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: "14px 16px",
              borderRadius: "var(--radius-md, 12px)",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <dd
              className="tabular-nums"
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 300,
                color: "var(--fg-accent)",
              }}
            >
              {item.value}
            </dd>
            <dt style={{ fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-muted)" }}>{item.label}</dt>
          </div>
        ))}
      </dl>

      {/* Geist-Style Visual Directory Grid */}
      <section aria-labelledby="directory-heading" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 id="directory-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-page-title)", fontWeight: 600 }}>
          System Modules
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="portal-directory-card millar-focus">
              <div
                style={{
                  minHeight: 112,
                  padding: 16,
                  backgroundColor: "var(--bg-surface-2)",
                  borderBottom: "1px solid var(--border-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {tile.preview}
              </div>
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-body-sm)", fontWeight: 600, color: "var(--fg-default)" }}>
                    {tile.title}
                  </strong>
                  <Badge tone="neutral" dot={false}>
                    {tile.section}
                  </Badge>
                </div>
                <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)", lineHeight: 1.45 }}>{tile.caption}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Three-Tier Architecture Matrix */}
      <section aria-labelledby="arch-heading" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 id="arch-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-page-title)", fontWeight: 600 }}>
          Three-Tier Architecture &amp; Register Boundaries
        </h2>
        <DataTable
          caption="Millar architectural tiers and gradient/motion contracts"
          columns={[
            { key: "tier", header: "Tier / Package" },
            { key: "purpose", header: "Role" },
            { key: "gradients", header: "Gradient Policy" },
            { key: "motion", header: "Motion Profile" },
          ]}
          rows={[
            {
              id: "shared",
              tier: "Shared Foundations (@hahlex/millar-tokens)",
              purpose: "Brand mark, Geist/Inter/Mono type, OKLCH palette, spacing, icons",
              gradients: "Forbidden",
              motion: "Shared base curves + reduced-motion",
            },
            {
              id: "marketing",
              tier: "Marketing Design (@hahlex/millar-marketing)",
              purpose: "6 Composition Patterns, 14 photo-free Visual Assets, 10 Sections",
              gradients: "Approved Visual Assets only (WarmHorizonWash)",
              motion: "Expressive (280-640ms, static-first)",
            },
            {
              id: "product",
              tier: "Product/App UI (@hahlex/millar-ui)",
              purpose: "10 accessible UI primitives, DataTable, APG Tabs, AntD 6 adapter",
              gradients: "Strictly Forbidden",
              motion: "Productive (140-320ms crisp ease)",
            },
            {
              id: "ext",
              tier: "Domain Extension (@hahlex/millar-domain-education)",
              purpose: "Optional IELTS 4-skill badges & learner highlights (isolated from Core)",
              gradients: "Strictly Forbidden",
              motion: "Inherits Product register",
            },
          ]}
          rowKey={(r) => r.id}
        />
      </section>

      {/* Quick Start */}
      <SpecimenFrame title="Quick Start">
        <CodeCopyBox
          title="globals.css & React usage"
          code={`/* 1. Import generated Millar Tailwind v4 theme + tokens */\n@import "tailwindcss";\n@import "@hahlex/millar-tokens/tailwind";\n\n/* 2. Consume accessible primitives */\nimport { Button, Badge, DataTable } from "@hahlex/millar-ui";\nimport { HahlexLockup, WarmHorizonWash } from "@hahlex/millar-marketing";`}
        />
      </SpecimenFrame>
    </div>
  );
}
