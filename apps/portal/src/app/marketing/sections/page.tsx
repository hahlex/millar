"use client";

import React, { useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import { Badge, Button, ChoiceToggle } from "@hahlex/millar-ui";
import {
  ArchitectureGridSection,
  BentoNarrativeMosaic,
  ClosingConversionBand,
  EditorialEssaySplit,
  HeroSpatialStage,
  HeroTypographicPoster,
  MetricMirrorSection,
  NativeAccordionFaq,
  ProductStageShowcase,
  WorkflowLoopSection,
} from "@hahlex/millar-marketing";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

const VIEWPORT_WIDTHS = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
} as const;

export default function MarketingSectionsPage() {
  const [selectedId, setSelectedId] = useState(registry.sections[0]?.id ?? "hero-spatial-stage");
  const [viewport, setViewport] = useState<keyof typeof VIEWPORT_WIDTHS>("desktop");

  const active = registry.sections.find((s) => s.id === selectedId) ?? registry.sections[0];

  const renderSection = (id: string) => {
    switch (id) {
      case "hero-spatial-stage":
        return (
          <HeroSpatialStage
            headingLevel="h3"
            headline="One measured language for every Hahlex surface."
            lead="Photo-free marketing craft backed by W3C DTCG tokens and MCP verification."
            primaryCtaLabel="Explore Millar"
            secondaryCtaLabel="View Specs"
          />
        );
      case "hero-typographic-poster":
        return (
          <HeroTypographicPoster
            headingLevel="h3"
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
        return <BentoNarrativeMosaic heading="Asymmetric Bento Narrative Mosaic" lead="Varied scale and visual grammar replacing identical 3-column card grids." />;
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
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <DocHeader
        section="Marketing"
        title="Marketing Section Library"
        description="10 production-ready, photo-free Marketing sections covering hero stages, editorial splits, bento mosaics, interactive product chrome, workflows, metrics, FAQs, and closing bands."
        badges={[{ label: `${registry.sections.length} Sections`, tone: "brand" }, { label: "Responsive Preview", tone: "neutral" }]}
        importPath="@hahlex/millar-marketing"
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {registry.sections.map((sec) => (
            <Button
              key={sec.id}
              variant={sec.id === active?.id ? "primary" : "white"}
              size="sm"
              onClick={() => setSelectedId(sec.id)}
            >
              {sec.name}
            </Button>
          ))}
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

      {active ? (
        <SpecimenFrame
          title={active.name}
          description={active.summary}
          canvasTone="inset"
          code={active.exampleCode}
          codeTitle={`${active.name} · Pattern: ${active.compositionPattern}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge tone="brand" dot={false}>Pattern: {active.compositionPattern}</Badge>
              <Badge tone="neutral" dot={false}>Goal: {active.goal}</Badge>
            </div>
            <div
              data-embedded-preview="true"
              style={{
                width: VIEWPORT_WIDTHS[viewport],
                maxWidth: "100%",
                margin: "0 auto",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid var(--border-default)",
              }}
            >
              {renderSection(active.id)}
            </div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>
              <strong>Responsive:</strong> {active.responsiveBehavior} · <strong>Reduced motion:</strong> {active.reducedMotionFallback}
            </div>
          </div>
        </SpecimenFrame>
      ) : null}
    </div>
  );
}
