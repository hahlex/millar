"use client";

import React, { useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Badge, ChoiceToggle, DataTable } from "@hahlex/millar-ui";
import {
  AssistantThreadPreview,
  BeforeAfterLedger,
  ClosedLoopSchematic,
  ConcentricArcCanvas,
  CoordinateGridSurface,
  DataTableSpecimenFrame,
  DotMatrixField,
  HahlexLockup,
  LayerStackDiagram,
  MetricPlateCard,
  PaperTearDivider,
  UnifiedOrbitDiagram,
  WarmHorizonWash,
} from "@hahlex/millar-marketing";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export default function VisualAssetsPage() {
  const [tone, setTone] = useState<"light" | "dark">("dark");
  const [washIntensity, setWashIntensity] = useState<"subtle" | "editorial">("editorial");
  const [activeLoopStep, setActiveLoopStep] = useState<string>("author");
  const [threadScenario, setThreadScenario] = useState<"marketing" | "product">("marketing");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Marketing"
        title="Code-Native Visual Assets"
        description="14 reusable CSS, SVG, HTML5 Canvas, and stylized React visual primitives that give Hahlex pages immediate visual authority with zero external images or video."
        badges={[{ label: `${registry.visualAssets.length} Assets`, tone: "brand" }, { label: "Static-First", tone: "success" }]}
        importPath="@hahlex/millar-marketing"
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
          Toggle canvas polarity and WarmHorizonWash atmosphere live.
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ChoiceToggle
            label="Visual asset tone"
            value={tone}
            onChange={setTone}
            options={[
              { value: "light", label: "Cream Light" },
              { value: "dark", label: "Espresso Dark" },
            ]}
          />
          <ChoiceToggle
            label="WarmHorizonWash intensity"
            value={washIntensity}
            onChange={setWashIntensity}
            options={[
              { value: "subtle", label: "Wash: Subtle" },
              { value: "editorial", label: "Wash: Editorial" },
            ]}
          />
        </div>
      </div>

      <SpecimenFrame
        title="ConcentricArcCanvas (HTML5 Canvas)"
        description="DPR-calibrated procedural shelter arch & three pillars geometry derived directly from the Hahlex brand mark."
        code={`import { ConcentricArcCanvas } from "@hahlex/millar-marketing";\n\n<ConcentricArcCanvas tone="${tone}" height={220} caption="Measured Warmth · Plate 01" />`}
      >
        <ConcentricArcCanvas tone={tone} height={220} caption="Concentric shelter arcs · DPR calibrated · 0 photos" />
      </SpecimenFrame>

      <SpecimenFrame
        title="WarmHorizonWash (Approved Atmospheric Gradient Asset)"
        description="Explicitly tagged gradientPolicy: 'approved-visual-asset'. Calibrated warm bronze horizon glow on Deep Espresso (#1A130D)."
        code={`import { WarmHorizonWash } from "@hahlex/millar-marketing";\n\n<WarmHorizonWash intensity="${washIntensity}">...</WarmHorizonWash>`}
      >
        <WarmHorizonWash intensity={washIntensity} style={{ padding: 28, minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
          <HahlexLockup variant="on-dark" size={24} sublabel="Approved Gradient Asset" color="var(--fg-on-stage-dark)" />
          <p style={{ margin: 0, maxWidth: "60ch", fontSize: "var(--text-body-sm)", color: "var(--fg-muted-on-stage-dark)" }}>
            Authorized Marketing atmosphere only. Never apply arbitrary CSS gradients on Product UI cards or foundation primitives.
          </p>
        </WarmHorizonWash>
      </SpecimenFrame>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <SpecimenFrame title="UnifiedOrbitDiagram (SVG)" description="Ecosystem convergence diagram.">
          <UnifiedOrbitDiagram tone={tone} />
        </SpecimenFrame>

        <SpecimenFrame title="DotMatrixField & MetricPlateCard" description="Architectural dot matrix & tabular metric plate.">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DotMatrixField tone={tone} height={150}>
              <MetricPlateCard value="14" label="Code-Native Assets" detail="Zero raster dependencies" tone={tone === "dark" ? "espresso" : "brand"} />
            </DotMatrixField>
            <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <PaperTearDivider topColor="var(--bg-editorial)" bottomColor="var(--bg-stage-dark)" height={34} />
            </div>
          </div>
        </SpecimenFrame>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
        <SpecimenFrame title="DataTableSpecimenFrame" description="Stylized Hahlex table chrome at 0% scroll.">
          <DataTableSpecimenFrame />
        </SpecimenFrame>
        <SpecimenFrame
          title="AssistantThreadPreview"
          description="Single purposeful AI verification thread. Switch scenarios live."
          toolbar={
            <ChoiceToggle
              label="Assistant scenario"
              value={threadScenario}
              onChange={setThreadScenario}
              options={[
                { value: "marketing", label: "Marketing" },
                { value: "product", label: "Product" },
              ]}
            />
          }
        >
          <AssistantThreadPreview
            prompt={
              threadScenario === "marketing"
                ? "Build a photo-free launch section for Hahlex Analytics."
                : "Audit my Product DataTable for zero CSS gradients and WCAG AA contrast."
            }
            reply={
              threadScenario === "marketing"
                ? "Selected Spatial Product Stage + WarmHorizonWash (approved visual asset) + DataTableSpecimenFrame. Automated validator passed 11/11 checks."
                : "Verified solid --bg-surface + 1px --border-default, tabular numerals, mobileCard fallback, and 97/97 AA token contrast."
            }
          />
        </SpecimenFrame>
      </div>

      <SpecimenFrame title="CoordinateGridSurface, LayerStackDiagram & BeforeAfterLedger" description="Visible-rule coordinate plate pairing architecture stack with evidence ledger.">
        <CoordinateGridSurface surface="base" showCrosshairs style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
            <LayerStackDiagram />
            <BeforeAfterLedger
              rows={[
                { criterion: "Photo-Free", before: "Empty boxes & generic cards", after: "14 calibrated visual primitives" },
                { criterion: "Gradients", before: "Arbitrary neon clutter", after: "Strict approved-asset boundary" },
                { criterion: "Mobile Nav", before: "Hidden links at <= 900px", after: "Keyboard-accessible drawer" },
              ]}
            />
          </div>
        </CoordinateGridSurface>
      </SpecimenFrame>

      <SpecimenFrame
        title="ClosedLoopSchematic (Interactive 6-Step Flow)"
        description="Click any step card to inspect the ordered design-system workflow."
        toolbar={<Badge tone="brand" dot={false}>Active step: {activeLoopStep}</Badge>}
      >
        <ClosedLoopSchematic tone={tone} activeStepId={activeLoopStep} onSelectStep={setActiveLoopStep} />
      </SpecimenFrame>

      <section aria-labelledby="asset-registry-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="asset-registry-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}>
          Complete MCP Visual Asset Registry ({registry.visualAssets.length})
        </h2>
        <DataTable
          caption="All compiled Visual Assets exposed via get_visual_assets and millar://visual-assets/{id}"
          columns={[
            { key: "id", header: "Asset ID" },
            { key: "name", header: "Component" },
            { key: "technology", header: "Tech" },
            {
              key: "gradientPolicy",
              header: "Gradient Policy",
              render: (r) => (
                <Badge tone={r.gradientPolicy === "approved-visual-asset" ? "brand" : "neutral"} dot={false}>
                  {String(r.gradientPolicy)}
                </Badge>
              ),
            },
          ]}
          rows={registry.visualAssets as unknown as Record<string, unknown>[]}
          rowKey={(r) => String(r.id)}
        />
      </section>
    </div>
  );
}
