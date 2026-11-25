"use client";

import React, { useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  ChoiceToggle,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FilterBar,
  HelpTooltip,
  IconAdd,
  IconLayers,
  IconShield,
  Input,
  LoadFailed,
  PageHeader,
  Segmented,
  Select,
  Skeleton,
  Stat,
  Switch,
  Tabs,
  TextArea,
} from "@hahlex/millar-ui";
import { AnalyticsDashboardTemplate, DirectoryWorkspaceTemplate } from "@hahlex/millar-marketing";
import { LearnerHighlight, SkillDomainBadge } from "@hahlex/millar-domain-education";
import { CodeCopyBox, LifecycleBadge } from "@/components/CodeCopyBox";

export default function ProductPage() {
  const [selectedId, setSelectedId] = useState(registry.components[0]?.id ?? "button");
  const [activeTab, setActiveTab] = useState("playground");

  // Interactive Playground states
  const [btnVariant, setBtnVariant] = useState<"primary" | "secondary" | "white" | "ghost" | "danger" | "success">("primary");
  const [btnSize, setBtnSize] = useState<"sm" | "md" | "lg">("md");
  const [inputError, setInputError] = useState("Workspace slug must be lowercase.");
  const [switchVal, setSwitchVal] = useState(true);
  const [checkVal, setCheckVal] = useState(true);
  const [choiceVal, setChoiceVal] = useState<"light" | "dark">("dark");
  const [demoTab, setDemoTab] = useState("overview");
  const [segVal, setSegVal] = useState("table");
  const [mobileTableMode, setMobileTableMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [appTemplate, setAppTemplate] = useState<"directory" | "dashboard">("directory");

  const component = registry.components.find((c) => c.id === selectedId) ?? registry.components[0];

  const renderPlayground = (id: string) => {
    switch (id) {
      case "button":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <ChoiceToggle
                label="Button variant"
                value={btnVariant}
                onChange={setBtnVariant}
                options={[
                  { value: "primary", label: "primary" },
                  { value: "secondary", label: "secondary" },
                  { value: "white", label: "white" },
                  { value: "ghost", label: "ghost" },
                  { value: "danger", label: "danger" },
                  { value: "success", label: "success" },
                ]}
              />
              <ChoiceToggle
                label="Button size"
                value={btnSize}
                onChange={setBtnSize}
                options={[
                  { value: "sm", label: "sm" },
                  { value: "md", label: "md" },
                  { value: "lg", label: "lg" },
                ]}
              />
            </div>
            <div style={{ padding: 24, borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-2)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Button
                variant={btnVariant}
                size={btnSize}
                icon={<IconAdd size="md" />}
                onClick={() => new Promise((r) => setTimeout(r, 450))}
              >
                Click to test async busy guard
              </Button>
              <Button variant={btnVariant} size={btnSize} pill>
                Pill action
              </Button>
              <Button variant={btnVariant} size={btnSize} disabled>
                Disabled
              </Button>
            </div>
          </div>
        );
      case "input":
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <Input
              label="Workspace slug"
              hint="Click or focus this icon to verify touch-safe HelpTooltip."
              value="Hahlex_Prod"
              onChange={(e) => setInputError(e.target.value === e.target.value.toLowerCase() ? "" : "Workspace slug must be lowercase.")}
              error={inputError || undefined}
            />
            <Select
              label="Register target"
              options={[
                { value: "product", label: "Product / App (Zero Gradients)" },
                { value: "marketing", label: "Marketing (Approved Assets Only)" },
              ]}
            />
            <TextArea label="Release notes" placeholder="Describe backward-compatible changes..." />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
              <Switch checked={switchVal} onChange={setSwitchVal} label="Enforce WCAG AA contrast gate" />
              <Checkbox checked={checkVal} onChange={setCheckVal} label="Require human sign-off for Approved status" />
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>Standalone HelpTooltip:</span>
                <HelpTooltip hint="Minimum 24x24px hit area with click + hover + Escape support." />
              </div>
            </div>
          </div>
        );
      case "choice-toggle":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
              Verified 7.69:1 AAA contrast (--fg-on-accent-soft on --accent-soft) in both Light and Dark themes.
            </p>
            <div>
              <ChoiceToggle
                label="Interactive theme preference"
                value={choiceVal}
                onChange={setChoiceVal}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            </div>
          </div>
        );
      case "card":
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <Card surface="base">
              <strong>Base Surface</strong>
              <span style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>Flat 1px warm-sand border, zero shadow.</span>
            </Card>
            <Card surface="inset">
              <strong>Inset Surface</strong>
              <span style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>Warm-sand recessed well for filters and headers.</span>
            </Card>
            <Card surface="raised">
              <strong>Raised Surface</strong>
              <span style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>Whisper warm-tinted card shadow.</span>
            </Card>
          </div>
        );
      case "badge":
        return (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="brand">Draft</Badge>
            <Badge tone="sand">Sand</Badge>
            <Badge tone="sage">Sage</Badge>
            <Badge tone="success">Approved</Badge>
            <Badge tone="warning">Pending Review</Badge>
            <Badge tone="error">Deprecated</Badge>
          </div>
        );
      case "stat":
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            <Stat label="WCAG AA Contrast" value="80 / 80" delta="0 regressions" tone="success" icon={<IconShield size="md" />} progressPercent={100} />
            <Stat label="Token Parity" value="100%" delta="CSS · TW4 · AntD · MCP" tone="brand" icon={<IconLayers size="md" />} progressPercent={100} />
          </div>
        );
      case "tabs":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Segmented
              ariaLabel="Display mode"
              value={segVal}
              onChange={setSegVal}
              options={[
                { value: "table", label: "Table" },
                { value: "cards", label: "Cards" },
              ]}
            />
            <Tabs
              ariaLabel="Sample APG tabs"
              activeId={demoTab}
              onChange={setDemoTab}
              items={[
                { id: "overview", label: "Overview", content: <p style={{ margin: 0, color: "var(--fg-muted)" }}>Use ArrowLeft, ArrowRight, Home, and End keys to navigate these tabs.</p> },
                { id: "tokens", label: "Tokens", content: <p style={{ margin: 0, color: "var(--fg-muted)" }}>Active ink bar binds strictly to --fg-accent.</p> },
                { id: "a11y", label: "Keyboard", content: <p style={{ margin: 0, color: "var(--fg-muted)" }}>Roving tabindex keeps Tab order clean into the panel.</p> },
              ]}
            />
          </div>
        );
      case "data-table":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Switch checked={mobileTableMode} onChange={setMobileTableMode} label="Preview mobileCard mode (< 640px)" />
            <FilterBar searchValue="" onSearchChange={() => {}} searchPlaceholder="Search records..." />
            <DataTable
              caption="Zero-scrollbar specimen table (empty cells render '-')"
              forceMobileCards={mobileTableMode}
              columns={[
                { key: "pkg", header: "Package" },
                { key: "note", header: "Deprecation" },
                { key: "tests", header: "Tests", align: "right", numeric: true },
              ]}
              rows={[
                { id: "1", pkg: "@hahlex/millar-tokens", note: "", tests: "8 / 8" },
                { id: "2", pkg: "@hahlex/millar-ui", note: "", tests: "8 / 8" },
                { id: "3", pkg: "@hahlex/millar-marketing", note: "", tests: "5 / 5" },
              ]}
              rowKey={(r) => r.id}
              mobileCard={(r) => (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{String(r.pkg)}</strong>
                  <Badge tone="success">{String(r.tests)}</Badge>
                </div>
              )}
            />
          </div>
        );
      case "dialog":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="danger" onClick={() => setDialogOpen(true)}>
                Open ConfirmDialog
              </Button>
            </div>
            <ConfirmDialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              onConfirm={() => {}}
              title="Deprecate legacy token"
              message="Consumers will receive migration warnings through the deprecation runway before removal."
              confirmLabel="Deprecate"
            />
            <Alert tone="success" title="Token audit clean" message="All 80 light and dark pairs clear WCAG 2.1 AA." />
            <LoadFailed onRetry={() => {}} />
            <EmptyState icon={<IconLayers size="lg" />} title="No deprecated tokens" description="Every token in v0.1.0 is active." />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton width="60%" height={18} />
              <Skeleton width="100%" height={14} />
            </div>
          </div>
        );
      default:
        return (
          <PageHeader
            title="Operational Directory"
            meta={<Badge tone="brand">1 Primary CTA Max</Badge>}
            secondaryActions={<Button variant="white">Export</Button>}
            primaryAction={<Button variant="primary" icon={<IconAdd size="md" />}>Create</Button>}
          />
        );
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px clamp(16px, 4vw, 32px) 96px", display: "flex", flexDirection: "column", gap: 56 }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 800 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <LifecycleBadge status="draft" />
          <Badge tone="sage" dot={false}>Operate Register · Zero Gradients</Badge>
        </div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(2.25rem, 4.5vw, 3.25rem)", fontWeight: 300, lineHeight: "var(--leading-display-hero)" }}>
          Product &amp; App Design System
        </h1>
        <p style={{ margin: 0, fontSize: "var(--text-lead)", color: "var(--fg-muted)", lineHeight: 1.55 }}>
          Grounded in hahlex-edu&apos;s production .ui-v2 architecture, hardened to WCAG 2.1/2.2 AA, and decoupled from education business logic. Every primitive includes a 4-tab workbench and AI anti-hallucination guardrails.
        </p>
      </div>

      {/* 1. Interactive Component Workbench (Carbon 4-Tab Anatomy) */}
      <section aria-labelledby="workbench-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 id="workbench-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
          Interactive UI Component Workbench
        </h2>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {registry.components.map((comp) => (
            <Button
              key={comp.id}
              variant={comp.id === component?.id ? "primary" : "white"}
              size="sm"
              onClick={() => {
                setSelectedId(comp.id);
                setActiveTab("playground");
              }}
            >
              {comp.name}
            </Button>
          ))}
        </div>

        {component ? (
          <Card surface="base" padding="default">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-page-title)", fontWeight: 600 }}>
                  {component.name}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>{component.summary}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <LifecycleBadge status={component.status} />
                <Badge tone="neutral" dot={false}>{component.accessibility.wcagTarget}</Badge>
              </div>
            </div>

            <Tabs
              ariaLabel={`${component.name} documentation tabs`}
              activeId={activeTab}
              onChange={setActiveTab}
              items={[
                { id: "playground", label: "Interactive Playground", content: renderPlayground(component.id) },
                {
                  id: "guidelines",
                  label: "Guidelines & Agent Guardrails",
                  content: (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                      <Card surface="inset" padding="compact">
                        <strong>When to use</strong>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
                          {component.usageGuidelines.whenToUse.map((u) => (
                            <li key={u}>{u}</li>
                          ))}
                        </ul>
                        <strong>Responsive behavior</strong>
                        <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>{component.responsiveBehavior}</p>
                      </Card>
                      <Card surface="inset" padding="compact">
                        <strong style={{ color: "var(--status-error)" }}>Anti-Hallucination Guardrails (AI &amp; Human)</strong>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--text-body-sm)", color: "var(--fg-default)" }}>
                          {component.invalidPropGuardrails.map((g) => (
                            <li key={g}>{g}</li>
                          ))}
                        </ul>
                      </Card>
                    </div>
                  ),
                },
                {
                  id: "code",
                  label: "Code & Props",
                  content: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <CodeCopyBox title={component.importPath} code={component.exampleCode} />
                      <DataTable
                        caption={`${component.name} props API`}
                        columns={[
                          { key: "name", header: "Prop" },
                          { key: "type", header: "Type" },
                          { key: "defaultValue", header: "Default" },
                          { key: "description", header: "Description" },
                        ]}
                        rows={component.props as unknown as Record<string, unknown>[]}
                        rowKey={(r) => String(r.name)}
                      />
                    </div>
                  ),
                },
                {
                  id: "a11y",
                  label: "Accessibility & Keyboard",
                  content: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {component.accessibility.rolesAndAttributes.map((attr) => (
                          <Badge key={attr} tone="sage" dot={false}>
                            {attr}
                          </Badge>
                        ))}
                      </div>
                      {component.accessibility.keyboard.length > 0 ? (
                        <DataTable
                          caption="Keyboard contract"
                          columns={[
                            { key: "key", header: "Key" },
                            { key: "behavior", header: "Behavior" },
                          ]}
                          rows={component.accessibility.keyboard as unknown as Record<string, unknown>[]}
                          rowKey={(r) => String(r.key)}
                        />
                      ) : (
                        <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
                          Non-interactive display element; semantic contrast and non-color indicators apply.
                        </p>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        ) : null}
      </section>

      {/* 2. Application Templates */}
      <section aria-labelledby="app-templates-heading" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <h2 id="app-templates-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
            Application Templates
          </h2>
          <ChoiceToggle
            label="Application template"
            value={appTemplate}
            onChange={setAppTemplate}
            options={[
              { value: "directory", label: "Directory Workspace" },
              { value: "dashboard", label: "Analytics Dashboard" },
            ]}
          />
        </div>
        {appTemplate === "directory" ? <DirectoryWorkspaceTemplate /> : <AnalyticsDashboardTemplate />}
      </section>

      {/* 3. Optional Domain Extension Proof (Education decoupled from Core) */}
      <section aria-labelledby="ext-heading" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 id="ext-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-display-section)", fontWeight: 300 }}>
            Domain Extension Seam: Education Pack
          </h2>
          <Badge tone="sand" dot={false}>@hahlex/millar-domain-education</Badge>
        </div>
        <p style={{ margin: 0, maxWidth: "68ch", fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
          IELTS 4-skill tones and learner passage highlights live in an optional extension package rather than Millar Shared Foundations, keeping Millar reusable across future Hahlex verticals.
        </p>
        <Card surface="base" padding="default">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <SkillDomainBadge skill="listening" label="Listening · Nghe" />
            <SkillDomainBadge skill="reading" label="Reading · Đọc" />
            <SkillDomainBadge skill="writing" label="Writing · Viết" />
            <SkillDomainBadge skill="speaking" label="Speaking · Nói" />
            <SkillDomainBadge skill="grammar" label="Grammar" />
            <SkillDomainBadge skill="vocabulary" label="Vocabulary" />
          </div>
          <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-default)" }}>
            Passage example: The learner highlighted <LearnerHighlight>key evidence in paragraph two</LearnerHighlight> using the extension token.
          </p>
        </Card>
      </section>
    </div>
  );
}
