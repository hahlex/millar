import React, { useState } from "react";
import {
  Alert,
  AppShell,
  Badge,
  Button,
  Card,
  DataTable,
  FilterBar,
  IconAdd,
  IconHome,
  IconLayers,
  IconRefresh,
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

export interface TemplatePreviewProps {
  embedded?: boolean;
}

export function ProductLaunchTemplate({ embedded = false }: TemplatePreviewProps = {}) {
  const MainTag = embedded ? "div" : "main";
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div style={{ backgroundColor: "var(--bg-editorial)", color: "var(--fg-default)" }}>
      <MainTag>
        {notice ? (
          <div style={{ padding: "16px clamp(16px, 4vw, 48px) 0" }}>
            <Alert
              tone="info"
              title="Template preview interaction"
              message={notice}
              action={
                <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
                  Dismiss
                </Button>
              }
            />
          </div>
        ) : null}
        <HeroSpatialStage
          headingLevel={embedded ? "h3" : "h1"}
          headline="One measured language for every Hahlex surface."
          lead="Shared foundations, photo-free marketing craft, and accessible product primitives compiled from a single W3C DTCG 2025.10 source."
          primaryCtaLabel="Explore Foundations"
          secondaryCtaLabel="Inspect MCP Server"
          onPrimaryCta={() => setNotice('Clicked "Explore Foundations" primary CTA in ProductLaunchTemplate.')}
          onSecondaryCta={() => setNotice('Clicked "Inspect MCP Server" secondary CTA in ProductLaunchTemplate.')}
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
        <ClosingConversionBand
          onCta={() => setNotice('Clicked closing conversion CTA "Explore Millar Portal" in ProductLaunchTemplate.')}
        />
      </MainTag>
      <MillarSiteFooter embedded={embedded} />
    </div>
  );
}

export function EditorialFeatureTemplate({ embedded = false }: TemplatePreviewProps = {}) {
  const MainTag = embedded ? "div" : "main";
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div style={{ backgroundColor: "var(--bg-editorial)", color: "var(--fg-default)" }}>
      <MainTag>
        {notice ? (
          <div style={{ padding: "16px clamp(16px, 4vw, 48px) 0" }}>
            <Alert
              tone="info"
              title="Template preview interaction"
              message={notice}
              action={
                <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
                  Dismiss
                </Button>
              }
            />
          </div>
        ) : null}
        <HeroTypographicPoster
          headingLevel={embedded ? "h3" : "h1"}
          headline="Design systems should enforce craft, not write essays about it."
          lead="Millar pairs Swiss typographic restraint with warm Hahlex materiality and machine-verifiable MCP compliance rules."
          ctaLabel="Read Architecture"
          onCta={() => setNotice('Clicked "Read Architecture" CTA in EditorialFeatureTemplate.')}
        />
        <ArchitectureGridSection />
        <EditorialEssaySplit
          heading="Separated registers, unmistakable brand DNA."
          body="Product apps demand crisp 1-glance density and zero CSS gradients. Marketing surfaces earn expressive pacing and purposeful approved horizon lighting. Both share Geist, Inter, Geist Mono, and one harmonized OKLCH Warm Sand ramp."
          quote="Product and Marketing speak with one accent, never one rigid template."
          quoteAttribution="Hahlex Design Governance · ADR-0002"
        />
        <ClosingConversionBand
          headline="Adopt Millar in your next Hahlex release."
          ctaLabel="View Integration Guide"
          onCta={() => setNotice('Clicked "View Integration Guide" closing CTA in EditorialFeatureTemplate.')}
        />
      </MainTag>
      <MillarSiteFooter embedded={embedded} />
    </div>
  );
}

/* ============================================================================
 * Product/App Workspace Templates (Zero Gradients, 1-Glance Operational Density)
 * ============================================================================ */

const INITIAL_DIRECTORY_ROWS = [
  { id: "r1", name: "Warm Sand Tokens", owner: "Core Platform", status: "Approved", contrast: "16.03:1" },
  { id: "r2", name: "Marketing Section Library", owner: "Brand Engineering", status: "Draft", contrast: "17.44:1" },
  { id: "r3", name: "Education Extension Pack", owner: "Hahlex Education", status: "Draft", contrast: "7.12:1" },
];

export function DirectoryWorkspaceTemplate({ embedded = false }: TemplatePreviewProps = {}) {
  const [activeNav, setActiveNav] = useState<"directory" | "teams" | "settings">("directory");
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState(INITIAL_DIRECTORY_ROWS);
  const [proposalSeq, setProposalSeq] = useState(1);

  const rows = records.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.owner.toLowerCase().includes(query.toLowerCase()) ||
      r.status.toLowerCase().includes(query.toLowerCase())
  );

  const handleAddProposal = () => {
    const seq = proposalSeq;
    setProposalSeq((n) => n + 1);
    setRecords((prev) => [
      {
        id: `p-${seq}`,
        name: `Domain Proposal #${seq}`,
        owner: "Product Squad",
        status: "Draft",
        contrast: "12.09:1",
      },
      ...prev,
    ]);
    setActiveNav("directory");
  };

  return (
    <AppShell
      embedded={embedded}
      brand={<HahlexLockup size={24} />}
      onNavigate={(id) => setActiveNav(id as "directory" | "teams" | "settings")}
      navItems={[
        { id: "directory", label: "Catalog", href: "#directory", icon: <IconLayers size="md" />, active: activeNav === "directory" },
        { id: "teams", label: "Teams", href: "#teams", icon: <IconUsers size="md" />, active: activeNav === "teams" },
        { id: "settings", label: "Governance", href: "#settings", icon: <IconSettings size="md" />, active: activeNav === "settings" },
      ]}
    >
      <PageHeader
        embedded={embedded}
        title={activeNav === "directory" ? "System Packages" : activeNav === "teams" ? "Steward Squads" : "Governance Policy"}
        meta={<Badge tone="brand">{rows.length} items</Badge>}
        primaryAction={
          <Button variant="primary" icon={<IconAdd size="md" />} onClick={handleAddProposal}>
            New proposal
          </Button>
        }
      />
      {activeNav === "directory" ? (
        <>
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
        </>
      ) : activeNav === "teams" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          <Card surface="base" padding="compact">
            <strong>Core Platform</strong>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>Owns DTCG tokens, compiler, and validator gates.</span>
          </Card>
          <Card surface="base" padding="compact">
            <strong>Brand Engineering</strong>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>Owns photo-free Marketing sections and visual assets.</span>
          </Card>
        </div>
      ) : (
        <Alert
          tone="info"
          title="Human Sign-Off Required"
          message="Proposals enter in Draft status and promote to Approved only after WCAG AA verification and design steward review."
        />
      )}
    </AppShell>
  );
}

export function AnalyticsDashboardTemplate({ embedded = false }: TemplatePreviewProps = {}) {
  const [activeNav, setActiveNav] = useState<"home" | "audit">("home");
  const [auditRuns, setAuditRuns] = useState(1);

  return (
    <AppShell
      embedded={embedded}
      brand={<HahlexLockup size={24} />}
      onNavigate={(id) => setActiveNav(id as "home" | "audit")}
      navItems={[
        { id: "home", label: "Overview", href: "#home", icon: <IconHome size="md" />, active: activeNav === "home" },
        { id: "audit", label: "Compliance", href: "#audit", icon: <IconShield size="md" />, active: activeNav === "audit" },
      ]}
    >
      <PageHeader
        embedded={embedded}
        title={activeNav === "home" ? "Design System Health" : "Automated Compliance Gates"}
        meta={<Badge tone="success">All gates passing (Run #{auditRuns})</Badge>}
        primaryAction={
          <Button variant="white" size="sm" icon={<IconRefresh size="sm" />} onClick={() => setAuditRuns((n) => n + 1)}>
            Re-run audit
          </Button>
        }
      />
      {activeNav === "home" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <Stat label="WCAG AA Pairs" value="97 / 97" delta="0 failures" tone="success" icon={<IconShield size="md" />} progressPercent={100} />
            <Stat label="CVD Min Delta-E" value="11.13" delta="Protan & Deutan" tone="brand" icon={<IconLayers size="md" />} progressPercent={88} />
            <Stat label="Em-Dash Violations" value="0" delta="Hahlex-controlled files" tone="sage" icon={<IconUsers size="md" />} progressPercent={100} />
          </div>
          <Alert
            tone="info"
            title="Draft Governance Reminder"
            message="All v0.1.0 entries remain in Draft until promoted via human sign-off."
          />
        </>
      ) : (
        <DataTable
          caption="Automated compliance gate checks"
          columns={[
            { key: "gate", header: "Gate" },
            { key: "result", header: "Result" },
            { key: "status", header: "Status", render: (r) => <Badge tone="success">{String(r.status)}</Badge> },
          ]}
          rows={[
            { id: "g1", gate: "WCAG 2.1 AA Contrast Matrix", result: "97 / 97 pairs passing", status: "Pass" },
            { id: "g2", gate: "Zero Em-Dash Guard", result: "0 violations", status: "Pass" },
            { id: "g3", gate: "Product Zero-Gradient Rule", result: "Enforced across @hahlex/millar-ui", status: "Pass" },
          ]}
          rowKey={(r) => r.id}
        />
      )}
    </AppShell>
  );
}
