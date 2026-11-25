"use client";

import React from "react";
import { DataTable, IconDownload } from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function ArtDirectionPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Marketing"
        title="Art Direction & Measured Warmth"
        description="Millar's visual philosophy pairs tactile Warm Cream / Deep Espresso materiality with calibrated Swiss proportion so Hahlex sites look finished on initial paint with zero photography, video, or animation."
        badges={[{ label: "100% Photo-Free Ready", tone: "success" }, { label: "Approved-Asset Gradient Only", tone: "brand" }]}
      />

      <SpecimenFrame
        title="Measured Warmth · Visual Philosophy Poster (Plate 01)"
        description="Official brand philosophy specimen created with deterministic shelter-arch geometry and mineral color ramps."
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
              Instead of cold monochrome sterility or neon AI SaaS clichés, Millar grounds every Hahlex surface in three disciplined visual cues:
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8, fontSize: "var(--text-body-sm)", color: "var(--fg-default)" }}>
              <li>
                <strong>Shelter Arch &amp; Ascending Pillars</strong>: Derived directly from the Hahlex brand mark to build parametric diagrams and canvas geometry.
              </li>
              <li>
                <strong>Editorial Cream / Deep Espresso Cadence</strong>: Alternating tactile paper stages and deepest espresso showcase bays separated by 1px Warm Sand hairlines or PaperTearDivider.
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
          caption="Shared brand DNA with register-calibrated density, gradients, and motion"
          columns={[
            { key: "axis", header: "Dimension" },
            { key: "marketing", header: "Marketing Register" },
            { key: "product", header: "Product/App Register" },
          ]}
          rows={[
            { id: "1", axis: "Typography", marketing: "Geist 300-400 Display (clamp 2.25-4.5rem) + Inter prose", product: "Geist 500-600 headings (16-22px) + Inter 14-15px UI" },
            { id: "2", axis: "Gradients (Q2)", marketing: "Approved Visual Assets ONLY (WarmHorizonWash); never arbitrary cards", product: "Strictly Forbidden everywhere (solid tokens + 1px borders)" },
            { id: "3", axis: "Motion", marketing: "Expressive 280-640ms with mandatory static-first fallback", product: "Productive 140-320ms snappy operational feedback" },
            { id: "4", axis: "Density", marketing: "Generous vertical cadence, 65ch reading measure, varied compositions", product: "1-Glance operational scannability, zero-scrollbar tables" },
          ]}
          rowKey={(r) => r.id}
        />
      </section>
    </div>
  );
}
