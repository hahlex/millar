"use client";

import React from "react";
import { Badge, DataTable, IconDownload } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function ArtDirectionPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Marketing"
        title="Art Direction & Measured Warmth"
        description="Millar Marketing derives its entire palette directly from the Hahlex App Warm Sand + Crimson root system, pairing tactile editorial restraint with calibrated Hahlex Crimson tension accents so pages look finished with zero photos."
        badges={[
          { label: "App-Rooted Warm Sand + Crimson", tone: "error" },
          { label: "100% Photo-Free Ready", tone: "success" },
          { label: "Approved-Asset Gradient Only", tone: "brand" },
        ]}
      />

      {/* App-Rooted Marketing Color Triad (Warm Sand · Espresso · Hahlex Crimson) */}
      <SpecimenFrame
        title="App-Rooted Marketing Color Triad (Warm Sand · Espresso · Hahlex Crimson)"
        description="Marketing never invents a conflicting palette. Every surface and accent maps back to hahlex-edu's Warm Sand ramp plus Hahlex Crimson (#B3121B light / #F0857F dark) budgeted strictly below 1.5% surface area."
        code={`/* App-rooted Marketing palette tokens */
--bg-editorial: #faf8f5;               /* App Warm Sand paper */
--bg-editorial-alt: #faf3ea;           /* App --hah-cream */
--bg-editorial-card: #f2e6cd;          /* App --hah-sand */
--accent-editorial: #4a3022;           /* App --hah-cta-brown (12.09:1) */
--accent-crimson: #b3121b;             /* App --hah-crimson (Light, < 1.5% area) */
--accent-crimson-on-stage-dark: #f0857f; /* App Dark Crimson on Espresso (7.88:1) */`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Visual proportion bar: ~90% Cream/Sand/Espresso, ~8.5% Bronze/Brown, ~1.5% Crimson */}
          <div
            aria-label="Marketing surface area proportion: 88% Warm Sand and Espresso, 10.5% Brand Brown and Caramel, 1.5% Hahlex Crimson"
            style={{
              height: 28,
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              border: "1px solid var(--border-default)",
              display: "flex",
            }}
          >
            <div style={{ width: "44%", backgroundColor: "var(--bg-editorial-alt)" }} title="Warm Cream (#FAF3EA)" />
            <div style={{ width: "22%", backgroundColor: "var(--bg-editorial-card)" }} title="Warm Sand (#F2E6CD)" />
            <div style={{ width: "22%", backgroundColor: "var(--bg-stage-dark)" }} title="Deep Espresso (#1A130D)" />
            <div style={{ width: "9%", backgroundColor: "var(--accent-editorial)" }} title="CTA Brown (#4A3022)" />
            <div style={{ width: "3%", backgroundColor: "var(--accent-crimson)" }} title="Hahlex Crimson (#B3121B / #F0857F)" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <div
              style={{
                padding: 16,
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-editorial-alt)",
                border: "1px solid var(--border-default)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <Badge tone="sand" dot={false}>~90% Surfaces</Badge>
              <strong style={{ fontSize: "var(--text-body-sm)" }}>Warm Cream, Sand &amp; Espresso</strong>
              <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)", lineHeight: 1.5 }}>
                App-rooted paper (#FAF8F5 / #FAF3EA / #F2E6CD) alternating with Deep Espresso (#1A130D / #120C08) stages.
              </span>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <Badge tone="brand" dot={false}>~2-5% Brand Action</Badge>
              <strong style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-accent)" }}>CTA Brown, Deep Sand &amp; Caramel</strong>
              <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)", lineHeight: 1.5 }}>
                Primary buttons (#4A3022 light / #6B4D35 dark stage), active indicators, and subtle Caramel horizon lighting (#D1A068).
              </span>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--accent-crimson-soft)",
                border: "1px solid var(--accent-crimson-border)",
                borderLeft: "3px solid var(--accent-crimson)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <Badge tone="error" dot={false}>&lt; 1.5% Tension Accent</Badge>
              <strong style={{ fontSize: "var(--text-body-sm)", color: "var(--accent-crimson)" }}>Hahlex Crimson (#B3121B / #F0857F)</strong>
              <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-default)", lineHeight: 1.5 }}>
                Reserved strictly for pain/friction callouts, Before/After deficits, dramatic quotation marks, and zenith focus ticks. Never for primary CTAs or team titles.
              </span>
            </div>
          </div>

          {/* Live Crimson Editorial Proof Specimen */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-editorial-card)",
                border: "1px solid var(--border-default)",
                borderLeft: "3px solid var(--accent-crimson)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span aria-hidden="true" style={{ fontFamily: "var(--font-display)", fontSize: 30, lineHeight: 0.7, color: "var(--accent-crimson)" }}>
                &ldquo;
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-body)", fontWeight: 400 }}>
                42% of center teams remain <strong style={{ color: "var(--accent-crimson)", fontWeight: 600 }}>held back</strong> by fragmented spreadsheets.
              </span>
              <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>
                Editorial Light Crimson · --accent-crimson (#B3121B on Warm Sand)
              </span>
            </div>

            <div
              style={{
                padding: "18px 20px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-stage-dark)",
                border: "1px solid var(--border-stage-dark)",
                color: "var(--fg-on-stage-dark)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span className="tabular-nums" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--accent-crimson-on-stage-dark)" }}>
                1,880vh -&gt; 0vh
              </span>
              <span style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-on-stage-dark)" }}>
                Blank scroll traps replaced with static-first visual proof.
              </span>
              <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted-on-stage-dark)" }}>
                Dark Stage Crimson · --accent-crimson-on-stage-dark (#F0857F, 7.88:1 AAA)
              </span>
            </div>
          </div>
        </div>
      </SpecimenFrame>

      <SpecimenFrame
        title="Measured Warmth · Visual Philosophy Poster (Plate 01)"
        description="Official brand philosophy specimen created with deterministic shelter-arch geometry, App Warm Sand mineral swatches, and Hahlex Crimson registration mark."
        toolbar={
          <a
            href="/millar/brand/measured-warmth-poster.pdf"
            download
            className="millar-focus"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--fg-default)",
              fontSize: "var(--text-meta)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <IconDownload size="sm" />
            <span>Download A4 PDF</span>
          </a>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-page-title)", fontWeight: 500 }}>
              Warmth calibrated like an architectural instrument
            </h3>
            <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.65 }}>
              Instead of cold monochrome sterility or neon AI SaaS cliches, Millar grounds every Hahlex surface in three disciplined visual cues:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8, fontSize: "var(--text-body-sm)", color: "var(--fg-default)" }}>
              <li>
                <strong>Shelter Arch &amp; Ascending Pillars</strong>: Derived directly from the Hahlex brand mark with a precision Crimson zenith tick.
              </li>
              <li>
                <strong>App-Rooted Warm Sand + Crimson Cadence</strong>: Alternating Warm Cream (#FAF8F5 / #FAF3EA) and Deep Espresso (#1A130D) stages with deliberate &lt; 1.5% Crimson tension highlights.
              </li>
              <li>
                <strong>Six Diverse Spatial Grammars</strong>: Never lock a full site into equal 3-column card grids or one repetitive architectural grid.
              </li>
            </ul>
          </div>
          <div style={{ maxWidth: 360, margin: "0 auto", width: "100%" }}>
            <img
              src="/millar/brand/measured-warmth-poster.png"
              alt="Millar Measured Warmth Specimen Plate 01 poster"
              width={800}
              height={1066}
              style={{ width: "100%", height: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", display: "block" }}
            />
          </div>
        </div>
      </SpecimenFrame>

      <section aria-labelledby="register-diff-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="register-diff-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}>
          Marketing vs. Product Register Rules
        </h2>
        <DataTable
          caption="Shared App-rooted color DNA with register-calibrated density, crimson usage, gradients, and motion"
          columns={[
            { key: "axis", header: "Dimension" },
            { key: "marketing", header: "Marketing Register" },
            { key: "product", header: "Product/App Register" },
          ]}
          rows={[
            { id: "1", axis: "Color Root", marketing: "Derived directly from App Warm Sand (#FAF3EA/#F2E6CD/#4A3022/#6B4D35) + Espresso (#1A130D)", product: "White-First (#FFFFFF) + App Warm Sand (#FAF8F5/#F9F5EF/#4A3022) + Obsidian (#141413)" },
            { id: "2", axis: "Hahlex Crimson", marketing: "Tension keywords, pain stats, editorial quote marks, friction columns (#B3121B / #F0857F, < 1.5% area)", product: "Errors, overdue states, outlined destructive actions (--status-error: #B3121B / #F0857F)" },
            { id: "3", axis: "Gradients (Q2)", marketing: "Approved Visual Assets ONLY (WarmHorizonWash using App Caramel #D1A068); never decorative cards", product: "Strictly Forbidden everywhere (solid tokens + 1px borders)" },
            { id: "4", axis: "Motion", marketing: "Expressive 280-640ms with mandatory static-first fallback", product: "Productive 140-320ms snappy operational feedback" },
          ]}
          rowKey={(r) => r.id}
        />
      </section>
    </div>
  );
}
