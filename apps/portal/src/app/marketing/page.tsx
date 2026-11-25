"use client";

import React, { useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Badge, Button, Card, ChoiceToggle, Switch } from "@hahlex/millar-ui";
import {
  ArchitectureGridSection,
  AssistantThreadPreview,
  BeforeAfterLedger,
  BentoNarrativeMosaic,
  ClosedLoopSchematic,
  ClosingConversionBand,
  ConcentricArcCanvas,
  CoordinateGridSurface,
  DataTableSpecimenFrame,
  DefaultMarketingDoDontShowcase,
  DotMatrixField,
  EditorialEssaySplit,
  EditorialFeatureTemplate,
  HahlexLockup,
  HeroSpatialStage,
  HeroTypographicPoster,
  LayerStackDiagram,
  MetricMirrorSection,
  MetricPlateCard,
  NativeAccordionFaq,
  PaperTearDivider,
  ProductLaunchTemplate,
  ProductStageShowcase,
  UnifiedOrbitDiagram,
  WarmHorizonWash,
  WorkflowLoopSection,
} from "@hahlex/millar-marketing";
import { CodeCopyBox, LifecycleBadge } from "@/components/CodeCopyBox";

const VIEWPORT_WIDTHS = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
} as const;

export default function MarketingPage() {
  const [selectedPattern, setSelectedPattern] = useState(registry.compositionPatterns[0]?.id ?? "editorial-split");
  const [assetTone, setAssetTone] = useState<"light" | "dark">("dark");
  const [horizonIntensity, setHorizonIntensity] = useState<"subtle" | "editorial">("editorial");
  const [viewport, setViewport] = useState<keyof typeof VIEWPORT_WIDTHS>("desktop");
  const [selectedSection, setSelectedSection] = useState(registry.sections[0]?.id ?? "hero-spatial-stage");
  const [selectedTemplate, setSelectedTemplate] = useState<"launch" | "editorial">("launch");
  const [simulateReducedMotion, setSimulateReducedMotion] = useState(false);
  const [motionPulse, setMotionPulse] = useState(false);

  const activePattern = registry.compositionPatterns.find((p) => p.id === selectedPattern) ?? registry.compositionPatterns[0];
  const activeSection = registry.sections.find((s) => s.id === selectedSection) ?? registry.sections[0];

  const renderSectionPreview = (id: string) => {
    switch (id) {
      case "hero-spatial-stage":
        return (
          <HeroSpatialStage
            headline="One measured language for every Hahlex surface."
            lead="Photo-free marketing craft backed by W3C DTCG tokens and MCP verification."
            primaryCtaLabel="Explore Millar"
            secondaryCtaLabel="View Specs"
          />
        );
      case "hero-typographic-poster":
        return (
          <HeroTypographicPoster
            headline="Design systems should enforce craft, not write essays about it."
            lead="Monolithic Geist 300 display statements paired with tabular proof metrics."
            ctaLabel="Read Architecture"
          />
        );
      case "editorial-essay-split":
        return (
          <EditorialEssaySplit
            heading="Warm editorial authority without stock photos."
            body="Calibrated Warm Cream breathing room, 65ch prose measure, and deterministic canvas proportion plates."
            quote="Every margin and axis earns its place in complete stillness."
            quoteAttribution="Measured Warmth · Plate 01"
          />
        );
      case "bento-narrative-mosaic":
        return <BentoNarrativeMosaic heading="Asymmetric Bento Narrative Mosaic" lead="Rejecting equal 3-column icon-card grids with varied scale and visual grammar." />;
      case "product-stage-showcase":
        return <ProductStageShowcase />;
      case "workflow-loop-section":
        return <WorkflowLoopSection />;
      case "architecture-grid-section":
        return <ArchitectureGridSection />;
      case "metric-mirror-section":
        return <MetricMirrorSection />;
      case "native-accordion-faq":
        return <NativeAccordionFaq />;
      default:
        return <ClosingConversionBand />;
    }
  };

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "40px clamp(16px, 4vw, 32px) 96px", display: "flex", flexDirection: "column", gap: 64 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 820 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <LifecycleBadge status="draft" />
          <Badge tone="neutral" dot={false}>
            Persuade &amp; Experience Register
          </Badge>
          <Badge tone="success">100% Photo-Free Ready</Badge>
        </div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(2.25rem, 4.5vw, 3.25rem)", fontWeight: 300, lineHeight: "var(--leading-display-hero)" }}>
          Marketing Design &amp; Visual Language
        </h1>
        <p style={{ margin: 0, fontSize: "var(--text-lead)", color: "var(--fg-muted)", lineHeight: 1.55 }}>
          Built specifically so designers and AI coding agents produce distinctive, gallery-grade Hahlex websites even with zero photography, zero video, and zero animation. Six diverse Composition Patterns replace monotonous card grids.
        </p>
      </div>

      {/* 1. Six Diverse Composition Patterns */}
      <section aria-labelledby="patterns-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h2 id="patterns-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
            Six Diverse Composition Patterns
          </h2>
          <p style={{ margin: "6px 0 0", color: "var(--fg-muted)", fontSize: "var(--text-body-sm)" }}>
            Never collapse Hahlex marketing into a single architectural grid. Combine contrasting spatial grammars across a page.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {registry.compositionPatterns.map((pat) => {
            const active = pat.id === activePattern?.id;
            return (
              <Button
                key={pat.id}
                variant={active ? "primary" : "white"}
                size="sm"
                onClick={() => setSelectedPattern(pat.id)}
              >
                {pat.name}
              </Button>
            );
          })}
        </div>

        {activePattern ? (
          <Card surface="base" padding="default">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-page-title)", fontWeight: 500 }}>
                    {activePattern.name}
                  </h3>
                  <LifecycleBadge status={activePattern.status} />
                </div>
                <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.6 }}>
                  {activePattern.summary}
                </p>
                <div style={{ fontSize: "var(--text-meta)", color: "var(--fg-default)" }}>
                  <strong>Spatial grammar:</strong> {activePattern.spatialGrammar}
                </div>
                <div style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>
                  <strong>Responsive behavior:</strong> {activePattern.responsiveBehavior}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {activePattern.bestFor.map((tag) => (
                    <Badge key={tag} tone="sand" dot={false}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <CodeCopyBox title={`Pattern: ${activePattern.id}`} code={activePattern.exampleCode} />
            </div>
          </Card>
        ) : null}
      </section>

      {/* 2. Interactive Visual Asset Gallery & Playground */}
      <section aria-labelledby="assets-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 id="assets-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
              Code-Native Visual Asset Gallery &amp; Playground
            </h2>
            <p style={{ margin: "6px 0 0", color: "var(--fg-muted)", fontSize: "var(--text-body-sm)" }}>
              SVG, CSS, HTML5 Canvas, and React visual primitives. Static-first by design; WarmHorizonWash is explicitly tagged as an approved purposeful Marketing gradient asset.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ChoiceToggle
              label="Visual asset tone"
              value={assetTone}
              onChange={setAssetTone}
              options={[
                { value: "light", label: "Cream Light" },
                { value: "dark", label: "Espresso Dark" },
              ]}
            />
            <ChoiceToggle
              label="WarmHorizonWash intensity"
              value={horizonIntensity}
              onChange={setHorizonIntensity}
              options={[
                { value: "subtle", label: "Wash: Subtle" },
                { value: "editorial", label: "Wash: Editorial" },
              ]}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <Card surface="base" padding="default">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>ConcentricArcCanvas (HTML5 Canvas)</strong>
              <Badge tone="neutral" dot={false}>gradient: none</Badge>
            </div>
            <ConcentricArcCanvas tone={assetTone} height={210} caption="Concentric shelter arcs · DPR calibrated" />
          </Card>

          <Card surface="base" padding="default">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>WarmHorizonWash (CSS Atmosphere)</strong>
              <Badge tone="brand">Approved Gradient Asset</Badge>
            </div>
            <WarmHorizonWash intensity={horizonIntensity} style={{ padding: 24, minHeight: 210, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <HahlexLockup variant="on-dark" size={24} sublabel="Approved Atmospheric Wash" color="var(--fg-on-stage-dark)" />
              <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted-on-stage-dark)" }}>
                Purposeful warm bronze horizon light calibrated on Deep Espresso (#1A130D), preserving &gt;= 14:1 ivory contrast.
              </p>
            </WarmHorizonWash>
          </Card>

          <Card surface="base" padding="default">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>UnifiedOrbitDiagram (SVG)</strong>
              <Badge tone="neutral" dot={false}>photoFree</Badge>
            </div>
            <UnifiedOrbitDiagram tone={assetTone} />
          </Card>

          <Card surface="base" padding="default">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>DotMatrixField &amp; PaperTearDivider (SVG)</strong>
              <Badge tone="neutral" dot={false}>staticFirst</Badge>
            </div>
            <DotMatrixField tone={assetTone} height={150}>
              <MetricPlateCard value="12" label="Code-Native Visual Assets" detail="Zero external raster dependencies." tone={assetTone === "dark" ? "espresso" : "brand"} />
            </DotMatrixField>
            <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <PaperTearDivider topColor="var(--bg-editorial)" bottomColor="var(--bg-stage-dark)" height={36} />
            </div>
          </Card>

          <Card surface="base" padding="default">
            <strong>DataTableSpecimenFrame (Stylized Chrome)</strong>
            <DataTableSpecimenFrame />
          </Card>

          <Card surface="base" padding="default">
            <strong>AssistantThreadPreview &amp; LayerStackDiagram</strong>
            <AssistantThreadPreview />
          </Card>
        </div>

        <CoordinateGridSurface surface="base" showCrosshairs style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            <LayerStackDiagram />
            <BeforeAfterLedger
              rows={[
                { criterion: "Without Images", before: "Empty boxes & generic card grids", after: "6 diverse code-native patterns" },
                { criterion: "Gradients", before: "Arbitrary neon/glow clutter", after: "Strict approved-asset boundary" },
                { criterion: "Mobile Nav", before: "Links hidden at <=900px", after: "Keyboard-accessible drawer" },
              ]}
            />
          </div>
        </CoordinateGridSurface>

        <ClosedLoopSchematic tone={assetTone} />
      </section>

      {/* 3. Expressive & Productive Motion Lab */}
      <section aria-labelledby="motion-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 id="motion-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
              Motion Library (Productive vs. Expressive)
            </h2>
            <p style={{ margin: "6px 0 0", color: "var(--fg-muted)", fontSize: "var(--text-body-sm)" }}>
              Every preset pairs a calibrated cubic-bezier curve with a mandatory static-first reduced-motion fallback.
            </p>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <Switch checked={simulateReducedMotion} onChange={setSimulateReducedMotion} label="Simulate prefers-reduced-motion" />
            <Button variant="primary" size="sm" onClick={() => setMotionPulse((p) => !p)}>
              Trigger Preview
            </Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {registry.motionPresets.map((preset) => (
            <Card key={preset.id} surface="base" padding="compact">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: "var(--text-body-sm)" }}>{preset.name}</strong>
                <Badge tone={preset.motionRegister === "expressive" ? "brand" : "sage"} dot={false}>
                  {simulateReducedMotion ? "0ms (Reduced)" : `${preset.durationMs}ms`}
                </Badge>
              </div>
              <div
                style={{
                  height: 36,
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--bg-surface-2)",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 28,
                    borderRadius: 6,
                    backgroundColor: preset.motionRegister === "expressive" ? "var(--accent-editorial)" : "var(--accent)",
                    transform: motionPulse ? "translateX(140px)" : "translateX(0px)",
                    transition: simulateReducedMotion ? "none" : `transform ${preset.durationMs}ms ${preset.easingCss}`,
                  }}
                />
              </div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-subtle)" }}>
                {preset.easingCss}
              </code>
              <span style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>{preset.reducedMotionFallback}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Marketing Section Library with Responsive Viewport Preview */}
      <section aria-labelledby="sections-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 id="sections-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
              Marketing Section Library
            </h2>
            <p style={{ margin: "6px 0 0", color: "var(--fg-muted)", fontSize: "var(--text-body-sm)" }}>
              Live responsive previews across Desktop, Tablet, and Mobile widths with copyable React source.
            </p>
          </div>
          <ChoiceToggle
            label="Preview viewport width"
            value={viewport}
            onChange={setViewport}
            options={[
              { value: "desktop", label: "Desktop" },
              { value: "tablet", label: "Tablet 768" },
              { value: "mobile", label: "Mobile 390" },
            ]}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {registry.sections.map((sec) => (
            <Button
              key={sec.id}
              variant={sec.id === activeSection?.id ? "primary" : "white"}
              size="sm"
              onClick={() => setSelectedSection(sec.id)}
            >
              {sec.name}
            </Button>
          ))}
        </div>

        {activeSection ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-surface-2)",
                padding: 16,
                overflowX: "auto",
              }}
            >
              <div
                style={{
                  width: VIEWPORT_WIDTHS[viewport],
                  maxWidth: "100%",
                  margin: "0 auto",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: "1px solid var(--border-default)",
                }}
              >
                {renderSectionPreview(activeSection.id)}
              </div>
            </div>
            <CodeCopyBox title={`${activeSection.name} · Pattern: ${activeSection.compositionPattern}`} code={activeSection.exampleCode} />
          </div>
        ) : null}
      </section>

      {/* 5. Complete Page Template Previews */}
      <section aria-labelledby="templates-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <h2 id="templates-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
            Complete Marketing Page Templates
          </h2>
          <ChoiceToggle
            label="Marketing page template"
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            options={[
              { value: "launch", label: "ProductLaunchTemplate" },
              { value: "editorial", label: "EditorialFeatureTemplate" },
            ]}
          />
        </div>
        <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--border-default)", overflow: "hidden", maxHeight: 620, overflowY: "auto" }}>
          {selectedTemplate === "launch" ? <ProductLaunchTemplate /> : <EditorialFeatureTemplate />}
        </div>
      </section>

      {/* 6. Live Visual Do's & Don'ts */}
      <section aria-labelledby="dodont-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 id="dodont-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
          Visual Do&apos;s &amp; Don&apos;ts
        </h2>
        <DefaultMarketingDoDontShowcase />
      </section>
    </div>
  );
}
