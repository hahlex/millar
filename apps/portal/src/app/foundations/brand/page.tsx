"use client";

import React from "react";
import { DataTable, IconDownload } from "@hahlex/millar-ui";
import { HahlexLockup, HahlexMark, type BrandMarkVariant } from "@hahlex/millar-marketing";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function BrandFoundationPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Foundations"
        title="Brand & Logo"
        description="Single canonical normalized Arch + 3 Pillars Vector Brand Mark (4 polarity variants) paired with the Title Case Hahlex wordmark in Geist 600 (-0.02em tracking)."
        importPath="@hahlex/millar-marketing"
      />

      <SpecimenFrame
        title="Canonical Vector Brand Mark (4 Variants)"
        description="Always render from canonical SVG assets rather than blurry raster PNGs. The shelter arch and three ascending pillars scale crisply from 16px favicons to monumental plates."
        code={`import { HahlexMark, HahlexLockup } from "@hahlex/millar-marketing";

<HahlexMark variant="color" size={32} />
<HahlexLockup variant="on-dark" size={26} sublabel="Millar" />`}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
          {(
            [
              { variant: "color" as BrandMarkVariant, label: "Color Mark", file: "hahlex-mark-color.svg", bg: "var(--bg-editorial)", fg: "var(--fg-default)", border: "var(--border-default)" },
              { variant: "on-light" as BrandMarkVariant, label: "On Light (High Contrast)", file: "hahlex-mark-on-light.svg", bg: "var(--bg-surface)", fg: "var(--fg-default)", border: "var(--border-default)" },
              { variant: "on-dark" as BrandMarkVariant, label: "On Dark (Espresso)", file: "hahlex-mark-on-dark.svg", bg: "var(--bg-stage-dark)", fg: "var(--fg-on-stage-dark)", border: "var(--border-stage-dark)" },
              { variant: "monochrome" as BrandMarkVariant, label: "Monochrome (currentColor)", file: "hahlex-mark-monochrome.svg", bg: "var(--tone-brand-soft)", fg: "var(--tone-brand-fg)", border: "var(--tone-brand-border)" },
            ]
          ).map((item) => (
            <div
              key={item.variant}
              style={{
                padding: 20,
                borderRadius: "var(--radius-md)",
                backgroundColor: item.bg,
                color: item.fg,
                border: `1px solid ${item.border}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
              }}
            >
              <HahlexMark variant={item.variant} size={44} />
              <HahlexLockup variant={item.variant} size={20} color={item.fg} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", opacity: 0.85 }}>{item.label}</span>
              <a
                href={`/millar/brand/${item.file}`}
                download
                className="millar-focus"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${item.border}`,
                  color: item.fg,
                  fontSize: "var(--text-micro)",
                  textDecoration: "none",
                }}
              >
                <IconDownload size="sm" />
                <span>SVG</span>
              </a>
            </div>
          ))}
        </div>
      </SpecimenFrame>

      <SpecimenFrame
        title="PWA Maskable App Icons (192px & 512px)"
        description="Safe-zone centered Arch + 3 Pillars geometry on Deep Espresso (#1A130D) for Android, iOS, and browser install manifests."
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          {[
            { size: 96, src: "/millar/brand/hahlex-icon-512.png", label: "512x512 Maskable PNG" },
            { size: 64, src: "/millar/brand/hahlex-icon-192.png", label: "192x192 Maskable PNG" },
          ].map((icon) => (
            <div key={icon.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img
                src={icon.src}
                alt={icon.label}
                width={icon.size}
                height={icon.size}
                style={{ borderRadius: 20, border: "1px solid var(--border-default)", display: "block" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <strong style={{ fontSize: "var(--text-body-sm)" }}>{icon.label}</strong>
                <a href={icon.src} download className="millar-focus" style={{ fontSize: "var(--text-micro)", color: "var(--fg-accent)" }}>
                  Download PNG
                </a>
              </div>
            </div>
          ))}
        </div>
      </SpecimenFrame>

      <section aria-labelledby="wordmark-rules" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="wordmark-rules" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}>
          Wordmark &amp; Usage Rules
        </h2>
        <DataTable
          caption="Canonical Hahlex wordmark specifications"
          columns={[
            { key: "prop", header: "Property" },
            { key: "spec", header: "Standard" },
            { key: "rule", header: "Guardrail" },
          ]}
          rows={[
            { id: "1", prop: "Wordmark text", spec: "Hahlex (Title Case)", rule: "Always text-transform: none; never lowercase 'hahlex' or ALL CAPS" },
            { id: "2", prop: "Typeface & weight", spec: "Geist Sans · 600 Semibold", rule: "Unified across Product and Marketing (retires Cormorant/Archivo)" },
            { id: "3", prop: "Letter spacing", spec: "-0.02em", rule: "Tight optical display tracking paired with >= 8px mark gap" },
            { id: "4", prop: "Minimum clear space", spec: "0.5x mark height on all sides", rule: "Never crowd badges or dividers against the shelter arch" },
          ]}
          rowKey={(r) => r.id}
        />
      </section>
    </div>
  );
}
