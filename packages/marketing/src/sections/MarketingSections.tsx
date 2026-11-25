import React, { useId, useRef, useState } from "react";
import { Badge, Button, IconArrowRight, IconCheck, IconClose, IconShield } from "@hahlex/millar-ui";
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
  ProductWindowFrame,
  UnifiedOrbitDiagram,
  WarmHorizonWash,
} from "../assets/index.js";

/* ============================================================================
 * 1. HeroSpatialStage (Composition: Spatial Product Stage, Deep Espresso + WarmHorizonWash)
 * ============================================================================ */

export interface HeroSpatialStageProps {
  headline: string;
  lead: string;
  primaryCtaLabel: string;
  secondaryCtaLabel?: string;
  onPrimaryCta?: () => void;
  onSecondaryCta?: () => void;
  stageVisual?: React.ReactNode;
  headingLevel?: "h1" | "h3";
}

export function HeroSpatialStage({
  headline,
  lead,
  primaryCtaLabel,
  secondaryCtaLabel,
  onPrimaryCta,
  onSecondaryCta,
  stageVisual,
  headingLevel = "h1",
}: HeroSpatialStageProps) {
  const Heading = headingLevel;
  return (
    <section style={{ padding: "clamp(32px, 5vw, 64px) clamp(16px, 4vw, 48px)" }}>
      <WarmHorizonWash intensity="editorial" style={{ maxWidth: 1320, margin: "0 auto", padding: "clamp(32px, 5vw, 64px)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "clamp(28px, 4vw, 56px)",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Heading
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.25rem, 4.6vw, 3.75rem)",
                fontWeight: 300,
                lineHeight: "var(--leading-display-hero, 1.08)",
                letterSpacing: "var(--tracking-display, -0.02em)",
                color: "var(--fg-on-stage-dark)",
              }}
            >
              {headline}
            </Heading>
            <p
              style={{
                margin: 0,
                maxWidth: 540,
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-lead, 1.125rem)",
                lineHeight: 1.55,
                color: "var(--fg-muted-on-stage-dark)",
              }}
            >
              {lead}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", paddingTop: 4 }}>
              <Button
                variant="primary"
                size="lg"
                onClick={onPrimaryCta}
                style={{ backgroundColor: "var(--accent-on-stage-dark)", borderColor: "var(--accent-on-stage-dark)", color: "var(--fg-on-accent)" }}
              >
                {primaryCtaLabel}
                <IconArrowRight size="md" />
              </Button>
              {secondaryCtaLabel ? (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onSecondaryCta}
                  style={{ color: "var(--fg-on-stage-dark)", borderColor: "var(--border-stage-dark)" }}
                >
                  {secondaryCtaLabel}
                </Button>
              ) : null}
            </div>
          </div>
          <div>{stageVisual ?? <DataTableSpecimenFrame />}</div>
        </div>
      </WarmHorizonWash>
    </section>
  );
}

/* ============================================================================
 * 2. HeroTypographicPoster (Composition: Monumental Typographic Poster, Editorial Cream)
 * ============================================================================ */

export interface HeroTypographicPosterProps {
  headline: string;
  lead: string;
  ctaLabel: string;
  onCta?: () => void;
  metrics?: Array<{ value: string; label: string }>;
  headingLevel?: "h1" | "h3";
}

export function HeroTypographicPoster({
  headline,
  lead,
  ctaLabel,
  onCta,
  metrics = [
    { value: "80 / 80", label: "WCAG AA contrast pairs" },
    { value: "6", label: "Marketing composition patterns" },
    { value: "11", label: "MCP tools from one SSoT" },
  ],
  headingLevel = "h1",
}: HeroTypographicPosterProps) {
  const Heading = headingLevel;
  return (
    <section
      style={{
        backgroundColor: "var(--bg-editorial)",
        color: "var(--fg-default)",
        padding: "clamp(48px, 8vw, 96px) clamp(16px, 4vw, 48px)",
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: 36 }}>
        <Heading
          style={{
            margin: 0,
            maxWidth: 960,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 300,
            lineHeight: "var(--leading-display-hero, 1.08)",
            letterSpacing: "var(--tracking-display, -0.02em)",
            color: "var(--fg-default)",
          }}
        >
          {headline}
        </Heading>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 28,
            alignItems: "end",
            borderTop: "1px solid var(--border-default)",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <p style={{ margin: 0, maxWidth: 540, fontSize: "var(--text-lead, 1.125rem)", lineHeight: 1.55, color: "var(--fg-muted)" }}>
              {lead}
            </p>
            <div>
              <Button variant="primary" size="lg" onClick={onCta}>
                {ctaLabel}
                <IconArrowRight size="md" />
              </Button>
            </div>
          </div>
          <dl
            style={{
              margin: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))`,
              gap: 16,
            }}
          >
            {metrics.map((m) => (
              <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <dt style={{ order: 2, fontSize: "var(--text-meta, 0.8125rem)", color: "var(--fg-subtle)" }}>{m.label}</dt>
                <dd
                  className="tabular-nums"
                  style={{
                    order: 1,
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.5rem, 2.5vw, 2.125rem)",
                    fontWeight: 300,
                    color: "var(--fg-accent)",
                  }}
                >
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 3. EditorialEssaySplit (Composition: Editorial Magazine Split, 60/40 Warm Cream)
 * ============================================================================ */

export interface EditorialEssaySplitProps {
  heading: string;
  body: string;
  quote: string;
  quoteAttribution: string;
  visual?: React.ReactNode;
}

export function EditorialEssaySplit({ heading, body, quote, quoteAttribution, visual }: EditorialEssaySplitProps) {
  return (
    <section
      style={{
        backgroundColor: "var(--bg-editorial)",
        color: "var(--fg-default)",
        padding: "clamp(48px, 7vw, 88px) clamp(16px, 4vw, 48px)",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "clamp(28px, 5vw, 64px)",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.85rem, 3.2vw, 2.5rem)",
              fontWeight: 300,
              lineHeight: "var(--leading-display, 1.14)",
              letterSpacing: "var(--tracking-display, -0.02em)",
            }}
          >
            {heading}
          </h2>
          <p style={{ margin: 0, maxWidth: "65ch", fontSize: "var(--text-body, 0.9375rem)", lineHeight: 1.65, color: "var(--fg-muted)" }}>
            {body}
          </p>
          <figure
            style={{
              margin: "8px 0 0",
              padding: "20px 24px",
              borderRadius: "var(--radius-lg, 16px)",
              backgroundColor: "var(--bg-editorial-card)",
              border: "1px solid var(--border-default)",
              borderLeft: "3px solid var(--accent-crimson)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                lineHeight: 0.75,
                fontWeight: 500,
                color: "var(--accent-crimson)",
              }}
            >
              &ldquo;
            </span>
            <blockquote style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-lead, 1.125rem)", fontWeight: 400, lineHeight: 1.45, color: "var(--fg-default)" }}>
              {quote}
            </blockquote>
            <figcaption style={{ fontSize: "var(--text-meta, 0.8125rem)", color: "var(--fg-muted)" }}>{quoteAttribution}</figcaption>
          </figure>
        </div>
        <div>{visual ?? <ConcentricArcCanvas tone="light" height={300} caption="Measured Warmth · Proportion Plate 01" />}</div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 4. BentoNarrativeMosaic (Composition: Asymmetric Bento Mosaic, NOT equal 3-col cards)
 * ============================================================================ */

export function BentoNarrativeMosaic({ heading, lead }: { heading: string; lead: string }) {
  return (
    <section
      style={{
        backgroundColor: "var(--bg-editorial-alt)",
        color: "var(--fg-default)",
        padding: "clamp(48px, 7vw, 88px) clamp(16px, 4vw, 48px)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 10 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.85rem, 3vw, 2.4rem)",
              fontWeight: 300,
              lineHeight: "var(--leading-display, 1.14)",
              letterSpacing: "var(--tracking-display, -0.02em)",
            }}
          >
            {heading}
          </h2>
          <p style={{ margin: 0, fontSize: "var(--text-body, 0.9375rem)", lineHeight: 1.6, color: "var(--fg-muted)" }}>{lead}</p>
        </div>

        {/* Asymmetric 7:5 row followed by 5:7 row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          <div style={{ gridColumn: "span 1", display: "flex", flexDirection: "column", gap: 18 }}>
            <UnifiedOrbitDiagram centerLabel="Millar SSoT" tone="light" />
            <MetricPlateCard
              value="0 photos required"
              label="Static-first aesthetic floor"
              detail="Every section ships with calibrated geometry, typography, and stylized product chrome."
              tone="brand"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <AssistantThreadPreview />
            <DotMatrixField tone="dark" height={180}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-section-title, 1.125rem)", fontWeight: 500, color: "var(--fg-on-stage-dark)" }}>
                  One visual grammar across human and AI builders
                </strong>
                <p style={{ margin: 0, fontSize: "var(--text-body-sm, 0.875rem)", color: "var(--fg-muted-on-stage-dark)", lineHeight: 1.55 }}>
                  Every visual asset exposes exact props, responsive behavior, and MCP metadata so agents stop falling back to flat card grids.
                </p>
              </div>
            </DotMatrixField>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 5. ProductStageShowcase (Composition: Spatial Product Stage with working interactive switcher)
 * ============================================================================ */

export interface ShowcaseView {
  id: string;
  label: string;
  summary: string;
  content: React.ReactNode;
}

export function ProductStageShowcase({
  heading = "Live stylized product chrome, never blank scroll boxes",
  views,
}: {
  heading?: string;
  views?: ShowcaseView[];
}) {
  const items: ShowcaseView[] = views ?? [
    {
      id: "tokens",
      label: "Token Audit",
      summary: "WCAG 2.1 AA contrast and Machado color-blind separation verified at compile time.",
      content: <DataTableSpecimenFrame />,
    },
    {
      id: "mcp",
      label: "MCP Validation",
      summary: "Deterministic automated checks separated cleanly from human aesthetic review criteria.",
      content: <AssistantThreadPreview />,
    },
    {
      id: "layers",
      label: "3-Tier Architecture",
      summary: "Shared Foundations, Marketing Register, and Product Register compiled from one DTCG source.",
      content: (
        <ProductWindowFrame title="millar / architecture" badge="W3C DTCG 2025.10">
          <LayerStackDiagram />
        </ProductWindowFrame>
      ),
    },
  ];
  const [activeId, setActiveId] = useState(items[0]!.id);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const current = items.find((v) => v.id === activeId) ?? items[0]!;

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let nextIdx = idx;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % items.length;
    else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + items.length) % items.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = items.length - 1;
    else return;
    e.preventDefault();
    const target = items[nextIdx];
    if (target) {
      setActiveId(target.id);
      tabRefs.current[nextIdx]?.focus();
    }
  };

  return (
    <section
      style={{
        backgroundColor: "var(--bg-stage-dark)",
        color: "var(--fg-on-stage-dark)",
        padding: "clamp(48px, 7vw, 88px) clamp(16px, 4vw, 48px)",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <h2
            style={{
              margin: 0,
              maxWidth: 640,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.85rem, 3.2vw, 2.5rem)",
              fontWeight: 300,
              lineHeight: "var(--leading-display, 1.14)",
              letterSpacing: "var(--tracking-display, -0.02em)",
            }}
          >
            {heading}
          </h2>
          <div role="tablist" aria-label="Product showcase views" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {items.map((item, idx) => {
              const selected = item.id === current.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[idx] = el;
                  }}
                  id={`${baseId}-tab-${item.id}`}
                  type="button"
                  role="tab"
                  tabIndex={selected ? 0 : -1}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel-${item.id}`}
                  onClick={() => setActiveId(item.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className="millar-focus"
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-pill, 9999px)",
                    border: `1px solid ${selected ? "var(--fg-accent-on-stage-dark)" : "var(--border-stage-dark)"}`,
                    backgroundColor: selected ? "var(--accent-on-stage-dark)" : "var(--bg-stage-dark-card)",
                    color: "var(--fg-on-accent)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-meta, 0.8125rem)",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        <p style={{ margin: 0, maxWidth: 680, fontSize: "var(--text-body, 0.9375rem)", color: "var(--fg-muted-on-stage-dark)" }}>
          {current.summary}
        </p>
        <div role="tabpanel" id={`${baseId}-panel-${current.id}`} aria-labelledby={`${baseId}-tab-${current.id}`}>
          {current.content}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 6. WorkflowLoopSection (Composition: Narrative Sequence Flow)
 * ============================================================================ */

export function WorkflowLoopSection({ heading = "Continuous design-to-agent governance loop" }: { heading?: string }) {
  const [selected, setSelected] = useState("author");
  return (
    <section
      style={{
        backgroundColor: "var(--bg-stage-dark-deep)",
        color: "var(--fg-on-stage-dark)",
        padding: "clamp(48px, 7vw, 88px) clamp(16px, 4vw, 48px)",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <h2
          style={{
            margin: 0,
            maxWidth: 640,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.85rem, 3.2vw, 2.5rem)",
            fontWeight: 300,
            lineHeight: "var(--leading-display, 1.14)",
          }}
        >
          {heading}
        </h2>
        <ClosedLoopSchematic activeStepId={selected} onSelectStep={setSelected} tone="dark" />
      </div>
    </section>
  );
}

/* ============================================================================
 * 7. ArchitectureGridSection (Composition: Architectural Visible-Rule Grid)
 * ============================================================================ */

export interface ArchitectureGridItem {
  code: string;
  title: string;
  description: string;
}

export function ArchitectureGridSection({
  heading = "Engineered for multi-product scale",
  items = [
    { code: "DTCG 2025.10", title: "Single Source of Truth", description: "OKLCH color objects, structured dimensions, and locale modifiers compile once into every downstream adapter." },
    { code: "WCAG 2.1 AA", title: "Contrast & CVD Gated", description: "Automated luminance and Machado color-blind checks block regressions before merge." },
    { code: "MCP 2026-07", title: "Resources + 11 Tools", description: "AI coding agents retrieve live specs and run deterministic validation without hallucinating tokens." },
    { code: "ISOLATED", title: "Domain-Agnostic Core", description: "Education skill palettes and icons plug in via optional domain extension packages." },
  ],
}: {
  heading?: string;
  items?: ArchitectureGridItem[];
}) {
  return (
    <section style={{ backgroundColor: "var(--bg-editorial)", color: "var(--fg-default)", padding: "clamp(48px, 7vw, 88px) clamp(16px, 4vw, 48px)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.85rem, 3.2vw, 2.5rem)",
            fontWeight: 300,
            lineHeight: "var(--leading-display, 1.14)",
          }}
        >
          {heading}
        </h2>
        <CoordinateGridSurface surface="base" showCrosshairs>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {items.map((item, idx) => (
              <div
                key={item.code}
                style={{
                  padding: "28px 24px",
                  borderRight: idx % 2 === 0 ? "1px solid var(--border-default)" : "none",
                  borderBottom: idx < items.length - 2 ? "1px solid var(--border-default)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro, 0.75rem)", color: "var(--fg-accent)" }}>
                  {item.code}
                </code>
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title, 1.125rem)", fontWeight: 600 }}>
                  {item.title}
                </h3>
                <p style={{ margin: 0, fontSize: "var(--text-body-sm, 0.875rem)", lineHeight: 1.55, color: "var(--fg-muted)" }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </CoordinateGridSurface>
      </div>
    </section>
  );
}

/* ============================================================================
 * 8. MetricMirrorSection (Composition: Typographic Poster & Metric Mirror)
 * ============================================================================ */

export function MetricMirrorSection({
  heading = "Measured before and after Millar",
}: {
  heading?: string;
}) {
  return (
    <section style={{ backgroundColor: "var(--bg-editorial-alt)", color: "var(--fg-default)", padding: "clamp(48px, 7vw, 88px) clamp(16px, 4vw, 48px)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.85rem, 3.2vw, 2.5rem)",
            fontWeight: 300,
            lineHeight: "var(--leading-display, 1.14)",
          }}
        >
          {heading}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <MetricPlateCard value="1,880vh -> 0vh" label="Legacy blank scroll voids removed" detail="Eliminated photo-starved sticky empty frames (Hahlex Crimson tension callout)." tone="error" />
          <MetricPlateCard value="1.00:1 -> 7.69:1" label="Dark active toggle contrast" detail="Fixed invisible dark-mode toggle with --fg-on-accent-soft." tone="espresso" />
          <MetricPlateCard value="0 -> 100%" label="Photo-free section readiness" detail="Every section renders complete visual proof at 0% scroll." tone="brand" />
        </div>
        <BeforeAfterLedger
          rows={[
            { criterion: "Token Sync", before: "4 hand-copied files drifting silently", after: "1 W3C DTCG 2025.10 source anchored to App Warm Sand + Crimson" },
            { criterion: "Marketing Visuals", before: "5 fake chatboxes + 1,880vh blank sticky voids", after: "6 diverse composition patterns + 14 code-native assets" },
            { criterion: "AI Governance", before: "Ad-hoc prose prompts & invented hex values", after: "MCP Resources + 11 Tools + automated vs. aesthetic validator" },
          ]}
        />
      </div>
    </section>
  );
}

/* ============================================================================
 * 9. NativeAccordionFaq (Accessible <details>/<summary>, zero JS required)
 * ============================================================================ */

export interface FaqItem {
  question: string;
  answer: string;
}

export function NativeAccordionFaq({
  heading = "Frequently asked questions",
  items = [
    {
      question: "Can AI agents promote Draft components to Approved?",
      answer: "No. Governance CI and MCP metadata restrict AI agents to authoring Draft entries. Promoting any token, asset, or component to Approved requires explicit human sign-off.",
    },
    {
      question: "Are CSS gradients banned everywhere in Millar?",
      answer: "CSS gradients are strictly forbidden in Product UI and Foundation primitives. In Marketing, gradients are permitted exclusively inside purposeful, explicitly approved Visual Assets such as WarmHorizonWash.",
    },
    {
      question: "How does Millar handle Hahlex Education's 4-skill IELTS palette?",
      answer: "Millar Shared Foundations stays 100% product-agnostic. Education-specific skill tones and learner highlights live cleanly inside the optional @hahlex/millar-domain-education extension pack.",
    },
  ],
}: {
  heading?: string;
  items?: FaqItem[];
}) {
  return (
    <section style={{ backgroundColor: "var(--bg-editorial)", color: "var(--fg-default)", padding: "clamp(48px, 7vw, 88px) clamp(16px, 4vw, 48px)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 300 }}>
          {heading}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => (
            <details
              key={item.question}
              style={{
                borderRadius: "var(--radius-md, 12px)",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-surface)",
                padding: "14px 18px",
              }}
            >
              <summary
                className="millar-focus"
                style={{
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-card-title, 1rem)",
                  fontWeight: 500,
                  color: "var(--fg-default)",
                }}
              >
                {item.question}
              </summary>
              <p style={{ margin: "12px 0 0", fontSize: "var(--text-body-sm, 0.875rem)", lineHeight: 1.6, color: "var(--fg-muted)" }}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 10. ClosingConversionBand & Semantic Top-Level MillarSiteFooter (NEVER nested in <main>)
 * ============================================================================ */

export function ClosingConversionBand({
  headline = "Build every Hahlex surface from one calm standard.",
  ctaLabel = "Explore Millar Portal",
  onCta,
}: {
  headline?: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <>
      <PaperTearDivider topColor="var(--bg-editorial)" bottomColor="var(--bg-stage-dark-deep)" />
      <section
        style={{
          backgroundColor: "var(--bg-stage-dark-deep)",
          color: "var(--fg-on-stage-dark)",
          padding: "clamp(56px, 8vw, 104px) clamp(16px, 4vw, 48px)",
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 24 }}>
          <h2
            style={{
              margin: 0,
              maxWidth: 780,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
              fontWeight: 300,
              lineHeight: "var(--leading-display-hero, 1.08)",
              letterSpacing: "var(--tracking-display, -0.02em)",
            }}
          >
            {headline}
          </h2>
          <Button
            variant="primary"
            size="lg"
            onClick={onCta}
            style={{ backgroundColor: "var(--accent-on-stage-dark)", borderColor: "var(--accent-on-stage-dark)", color: "var(--fg-on-accent)" }}
          >
            {ctaLabel}
            <IconArrowRight size="md" />
          </Button>
        </div>
      </section>
    </>
  );
}

export function MillarSiteFooter({ version = "v0.1.0-draft", embedded = false }: { version?: string; embedded?: boolean }) {
  const Tag = embedded ? "div" : "footer";
  return (
    <Tag
      data-template-footer={embedded ? "true" : undefined}
      style={{
        backgroundColor: "var(--bg-stage-dark-deep)",
        color: "var(--fg-muted-on-stage-dark)",
        borderTop: "1px solid var(--border-stage-dark)",
        padding: "28px clamp(16px, 4vw, 48px)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          fontSize: "var(--text-meta, 0.8125rem)",
        }}
      >
        <HahlexLockup variant="on-dark" size={24} sublabel="Millar Design System" color="var(--fg-on-stage-dark)" />
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)" }}>{version}</span>
          <span>Hahlex Ecosystem</span>
        </div>
      </div>
    </Tag>
  );
}

/* ============================================================================
 * 11. Live Visual Do's & Don'ts Comparison Specimen
 * ============================================================================ */

export interface VisualDoDontPairProps {
  title: string;
  doLabel: string;
  dontLabel: string;
  doPreview: React.ReactNode;
  dontPreview: React.ReactNode;
}

export function VisualDoDontPair({ title, doLabel, dontLabel, doPreview, dontPreview }: VisualDoDontPairProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title, 1.125rem)", fontWeight: 600, color: "var(--fg-default)" }}>
        {title}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <div
          style={{
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--status-success-border)",
            backgroundColor: "var(--bg-surface)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: 20, flex: 1, backgroundColor: "var(--bg-editorial)" }}>{doPreview}</div>
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--status-success-border)",
              backgroundColor: "var(--status-success-soft)",
              color: "var(--status-success)",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: "var(--text-meta, 0.8125rem)",
              fontWeight: 500,
            }}
          >
            <IconCheck size="sm" />
            <span>
              <strong>Do:</strong> {doLabel}
            </span>
          </div>
        </div>

        <div
          style={{
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--status-error-border)",
            backgroundColor: "var(--bg-surface)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Non-interactive anti-pattern illustration; full accessible guidance sits in the Don't caption below */}
          <div aria-hidden="true" data-millar-antipattern-specimen="true" style={{ padding: 20, flex: 1, backgroundColor: "var(--bg-surface-2)" }}>
            {dontPreview}
          </div>
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--status-error-border)",
              backgroundColor: "var(--status-error-soft)",
              color: "var(--status-error)",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: "var(--text-meta, 0.8125rem)",
              fontWeight: 500,
            }}
          >
            <IconClose size="sm" />
            <span>
              <strong>Don&apos;t:</strong> {dontLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DefaultMarketingDoDontShowcase() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <VisualDoDontPair
        title="Surface Craft & Button Contrast"
        doLabel="Use solid Warm Sand / Deep Espresso surfaces with AA-verified #4A3022 / #7A4E16 CTAs and crisp 1px borders."
        dontLabel="Avoid neon purple/pink decorative card gradients, glowing button halos, and low-contrast bronze buttons (#A26A25 at 4.31:1)."
        doPreview={
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Badge tone="brand">Measured Warmth</Badge>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 500, color: "var(--fg-default)" }}>
              Calm, tactile contrast
            </strong>
            <div>
              <Button variant="primary" size="sm" icon={<IconShield size="sm" />}>
                Verified 12.09:1 CTA
              </Button>
            </div>
          </div>
        }
        dontPreview={
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6366f1, #ec4899)",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <strong style={{ fontSize: "1.125rem" }}>Generic AI gradient card</strong>
            <span style={{ display: "inline-block", padding: "6px 12px", borderRadius: 999, backgroundColor: "#C08A4A", color: "#FFF8F0", fontSize: 13, width: "fit-content" }}>
              2.86:1 Failing Button
            </span>
          </div>
        }
      />
      <VisualDoDontPair
        title="Zero-Photo Product Proof"
        doLabel="Show stylized, static-first Hahlex UI chrome immediately at 0% scroll with working controls."
        dontLabel="Never trap visitors in blank 400px scroll-scrubbed rectangles or repeat identical fake chatboxes."
        doPreview={<DataTableSpecimenFrame />}
        dontPreview={
          <div
            style={{
              height: 168,
              borderRadius: 12,
              border: "1px dashed var(--border-strong)",
              backgroundColor: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--fg-subtle)",
              fontSize: 13,
            }}
          >
            [ Empty 400px scroll-scrubbed box waiting for scroll... ]
          </div>
        }
      />
    </div>
  );
}
