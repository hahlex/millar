import React, { useState } from "react";
import {
  Alert,
  AppShell,
  Badge,
  Button,
  DataTable,
  FilterBar,
  IconAdd,
  IconHome,
  IconLayers,
  IconSettings,
  IconShield,
  IconUsers,
  PageHeader,
  Stat,
} from "@hahlex/millar-ui";
import { HahlexLockup } from "../assets/index.js";
import {
  ArchitectureGridSection,
  BentoNarrativeMosaic,
  ClosingConversionBand,
  EditorialEssaySplit,
  HeroSpatialStage,
  HeroTypographicPoster,
  MetricMirrorSection,
  MillarSiteFooter,
  NativeAccordionFaq,
  ProductStageShowcase,
  WorkflowLoopSection,
} from "../sections/index.js";

/* ============================================================================
 * Marketing Page Templates (Diverse Compositions, Top-Level <footer> Outside <main>)
 * ============================================================================ */

export function ProductLaunchTemplate() {
  return (
    <div style={{ backgroundColor: "var(--bg-editorial)", color: "var(--fg-default)" }}>
      <main>
        <HeroSpatialStage
          headline="One measured language for every Hahlex surface."
          lead="Shared foundations, photo-free marketing craft, and accessible product primitives compiled from a single W3C DTCG 2025.10 source."
          primaryCtaLabel="Explore Foundations"
          secondaryCtaLabel="Inspect MCP Server"
        />
        <EditorialEssaySplit
          heading="Warm editorial authority without photographic crutches."
          body="Most AI-generated landing pages collapse into identical card grids the moment photography is absent. Millar replaces decorative filler with six intentional composition patterns, parametric diagrams, and stylized product chrome that look finished on initial paint."
          quote="Every margin, axis, and contrast ratio is calibrated before the first line of product code ships."
          quoteAttribution="Millar Visual Philosophy · Measured Warmth"
        />
        <ProductStageShowcase />
        <BentoNarrativeMosaic
          heading="Built for designers, engineers, and autonomous coding agents"
          lead="Tokens, live previews, and deterministic compliance checks come from one compiled registry so guidelines never drift from code."
        />
        <WorkflowLoopSection />
        <MetricMirrorSection />
        <NativeAccordionFaq />
        <ClosingConversionBand />
      </main>
      <MillarSiteFooter />
    </div>
  );
}

export function EditorialFeatureTemplate() {
  return (
    <div style={{ backgroundColor: "var(--bg-editorial)", color: "var(--fg-default)" }}>
      <main>
        <HeroTypographicPoster
          headline="Design systems should enforce craft, not write essays about it."
          lead="Millar pairs Swiss typographic restraint with warm Hahlex materiality and machine-verifiable MCP compliance rules."
          ctaLabel="Read Architecture"
        />
        <ArchitectureGridSection />
        <EditorialEssaySplit
          heading="Separated registers, unmistakable brand DNA."
          body="Product apps demand crisp 1-glance density and zero CSS gradients. Marketing surfaces earn expressive pacing and purposeful approved horizon lighting. Both share Geist, Inter, Geist Mono, and one harmonized OKLCH Warm Sand ramp."
          quote="Product and Marketing speak with one accent, never one rigid template."
          quoteAttribution="Hahlex Design Governance · ADR-0002"
        />
        <ClosingConversionBand headline="Adopt Millar in your next Hahlex release." ctaLabel="View Integration Guide" />
      </main>
      <MillarSiteFooter />
    </div>
  );
}

/* ============================================================================
 * Product/App Workspace Templates (Zero Gradients, 1-Glance Operational Density)
 * ============================================================================ */

export function DirectoryWorkspaceTemplate() {
  const [query, setQuery] = useState("");
  const rows = [
    { id: "r1", name: "Warm Sand Tokens", owner: "Core Platform", status: "Approved", contrast: "16.03:1" },
    { id: "r2", name: "Marketing Section Library", owner: "Brand Engineering", status: "Draft", contrast: "17.44:1" },
    { id: "r3", name: "Education Extension Pack", owner: "Hahlex Education", status: "Draft", contrast: "7.12:1" },
  ].filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell
      brand={<HahlexLockup size={24} />}
      navItems={[
        { id: "directory", label: "Catalog", href: "#directory", icon: <IconLayers size="md" />, active: true },
        { id: "teams", label: "Teams", href: "#teams", icon: <IconUsers size="md" /> },
        { id: "settings", label: "Governance", href: "#settings", icon: <IconSettings size="md" /> },
      ]}
    >
      <PageHeader
        title="System Packages"
        meta={<Badge tone="brand">{rows.length} items</Badge>}
        primaryAction={
          <Button variant="primary" icon={<IconAdd size="md" />}>
            New proposal
          </Button>
        }
      />
      <FilterBar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Filter packages..."
        activePills={query ? [{ key: "q", label: `Query: ${query}`, onRemove: () => setQuery("") }] : []}
        onClearAll={() => setQuery("")}
      />
      <DataTable
        caption="Millar ecosystem packages"
        columns={[
          { key: "name", header: "Package" },
          { key: "owner", header: "Steward" },
          {
            key: "status",
            header: "Lifecycle",
            render: (row) => <Badge tone={row.status === "Approved" ? "success" : "brand"}>{String(row.status)}</Badge>,
          },
          { key: "contrast", header: "Min Contrast", align: "right", numeric: true },
        ]}
        rows={rows}
        rowKey={(r) => r.id}
      />
    </AppShell>
  );
}

export function AnalyticsDashboardTemplate() {
  return (
    <AppShell
      brand={<HahlexLockup size={24} />}
      navItems={[
        { id: "home", label: "Overview", href: "#home", icon: <IconHome size="md" />, active: true },
        { id: "audit", label: "Compliance", href: "#audit", icon: <IconShield size="md" /> },
      ]}
    >
      <PageHeader title="Design System Health" meta={<Badge tone="success">All gates passing</Badge>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <Stat label="WCAG AA Pairs" value="80 / 80" delta="0 failures" tone="success" icon={<IconShield size="md" />} progressPercent={100} />
        <Stat label="CVD Min Delta-E" value="11.13" delta="Protan & Deutan" tone="brand" icon={<IconLayers size="md" />} progressPercent={88} />
        <Stat label="Em-Dash Violations" value="0" delta="Hahlex-controlled files" tone="sage" icon={<IconUsers size="md" />} progressPercent={100} />
      </div>
      <Alert
        tone="info"
        title="Draft Governance Reminder"
        message="All v0.1.0 entries remain in Draft until promoted via human sign-off."
      />
    </AppShell>
  );
}
