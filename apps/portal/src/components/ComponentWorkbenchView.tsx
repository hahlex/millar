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
  type ButtonSize,
  type ButtonVariant,
} from "@hahlex/millar-ui";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

export function ComponentWorkbenchView({ id }: { id: string }) {
  const component = registry.components.find((c) => c.id === id) ?? registry.components[0]!;

  // Interactive Playground states
  const [btnVariant, setBtnVariant] = useState<ButtonVariant>("primary");
  const [btnSize, setBtnSize] = useState<ButtonSize>("md");
  const [inputVal, setInputVal] = useState("Hahlex Studio");
  const [inputErr, setInputErr] = useState(false);
  const [selectVal, setSelectVal] = useState("product");
  const [switchVal, setSwitchVal] = useState(true);
  const [checkVal, setCheckVal] = useState(true);
  const [choiceVal, setChoiceVal] = useState("light");
  const [segVal, setSegVal] = useState("table");
  const [demoTab, setDemoTab] = useState("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mobileTableMode, setMobileTableMode] = useState(false);

  const renderPlayground = () => {
    switch (component.id) {
      case "button":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
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
                onClick={() => new Promise((r) => setTimeout(r, 700))}
              >
                Test async busy guard
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
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
            <Switch checked={inputErr} onChange={setInputErr} label="Simulate validation error (role='alert')" />
            <Input
              label="Workspace name"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              hint="Uses role='alert' + aria-describedby when an error occurs."
              error={inputErr ? "Workspace name must be at least 3 characters." : undefined}
            />
            <Select
              label="Target Millar register"
              value={selectVal}
              onChange={(e) => setSelectVal(e.target.value)}
              options={[
                { value: "product", label: "Product/App (Zero Gradients)" },
                { value: "marketing", label: "Marketing (Photo-Free Visual System)" },
              ]}
            />
            <TextArea label="Review notes" rows={2} defaultValue="Verified keyboard focus ring and 1px warm-sand border." />
            <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <Switch checked={switchVal} onChange={setSwitchVal} label="Enforce zero em-dash" />
              <Checkbox checked={checkVal} onChange={setCheckVal} label="Require human sign-off" />
              <HelpTooltip hint="24x24px click, hover, and Escape accessible tooltip." />
            </div>
          </div>
        );
      case "choice-toggle":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <ChoiceToggle
              label="Theme sample"
              value={choiceVal}
              onChange={setChoiceVal}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ]}
            />
            <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
              Active option uses <code>--accent-soft</code> + <code>--fg-on-accent-soft</code> (7.69:1 AAA), eliminating the 1.00:1 dark-mode invisible text bug.
            </p>
          </div>
        );
      case "card":
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
            <Card surface="base" padding="compact">
              <strong>surface=&quot;base&quot;</strong>
              <span style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>1px hairline, zero shadow.</span>
            </Card>
            <Card surface="inset" padding="compact">
              <strong>surface=&quot;inset&quot;</strong>
              <span style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>Subtle recessed container.</span>
            </Card>
            <Card surface="raised" padding="compact">
              <strong>surface=&quot;raised&quot;</strong>
              <span style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>Elevation shadow without ghost border.</span>
            </Card>
          </div>
        );
      case "badge":
        return (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="brand">Draft</Badge>
            <Badge tone="sand">Marketing</Badge>
            <Badge tone="sage">Product</Badge>
            <Badge tone="success">Approved</Badge>
            <Badge tone="warning">Review</Badge>
            <Badge tone="error">Deprecated</Badge>
          </div>
        );
      case "stat":
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            <Stat label="WCAG AA Contrast" value="84 / 84" delta="0 regressions" tone="success" icon={<IconShield size="md" />} progressPercent={100} />
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
            <div>
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
            <Alert tone="success" title="Token audit clean" message="All 84 light and dark pairs clear WCAG 2.1 AA." />
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
            embedded
            title="Operational Directory"
            meta={<Badge tone="brand">1 Primary CTA Max</Badge>}
            secondaryActions={<Button variant="white">Export</Button>}
            primaryAction={<Button variant="primary" icon={<IconAdd size="md" />}>Create</Button>}
          />
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <DocHeader
        section="Components"
        title={component.name}
        description={component.summary}
        status={component.status}
        badges={[
          { label: component.accessibility.wcagTarget, tone: "sage" },
          { label: "Zero Gradients", tone: "neutral" },
        ]}
        importPath={component.importPath}
      />

      {/* 1. Interactive Live Specimen + Usage Code */}
      <SpecimenFrame
        title="Interactive Playground"
        description="Live component specimen driven directly by Millar tokens in Light and Dark mode."
        code={component.exampleCode}
        codeTitle={component.importPath}
      >
        {renderPlayground()}
      </SpecimenFrame>

      {/* 2. Props API */}
      <section aria-labelledby="props-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="props-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}>
          Props API
        </h2>
        <DataTable
          caption={`${component.name} component props`}
          columns={[
            { key: "name", header: "Prop" },
            { key: "type", header: "Type" },
            { key: "defaultValue", header: "Default" },
            { key: "description", header: "Description" },
          ]}
          rows={component.props as unknown as Record<string, unknown>[]}
          rowKey={(r) => String(r.name)}
        />
      </section>

      {/* 3. Guidelines & Anti-Hallucination Guardrails */}
      <section aria-labelledby="guidelines-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="guidelines-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}>
          Usage Guidelines &amp; Agent Guardrails
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          <div style={{ padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)", display: "flex", flexDirection: "column", gap: 10 }}>
            <strong style={{ fontSize: "var(--text-body-sm)" }}>When to use</strong>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.55 }}>
              {component.usageGuidelines.whenToUse.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
            <strong style={{ fontSize: "var(--text-body-sm)" }}>Responsive behavior</strong>
            <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)", lineHeight: 1.55 }}>{component.responsiveBehavior}</p>
          </div>
          <div style={{ padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--status-error-border)", backgroundColor: "var(--bg-surface)", display: "flex", flexDirection: "column", gap: 10 }}>
            <strong style={{ fontSize: "var(--text-body-sm)", color: "var(--status-error)" }}>Anti-Hallucination Guardrails (AI &amp; Human)</strong>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--text-body-sm)", color: "var(--fg-default)", lineHeight: 1.55 }}>
              {component.invalidPropGuardrails.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Accessibility & Keyboard */}
      <section aria-labelledby="a11y-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="a11y-heading" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section-title)", fontWeight: 600 }}>
          Accessibility &amp; Keyboard Contract
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {component.accessibility.rolesAndAttributes.map((attr) => (
            <Badge key={attr} tone="sage" dot={false}>
              {attr}
            </Badge>
          ))}
        </div>
        {component.accessibility.keyboard.length > 0 ? (
          <DataTable
            caption="Keyboard interactions"
            columns={[
              { key: "key", header: "Key" },
              { key: "behavior", header: "Behavior" },
            ]}
            rows={component.accessibility.keyboard as unknown as Record<string, unknown>[]}
            rowKey={(r) => String(r.key)}
          />
        ) : (
          <p style={{ margin: 0, fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
            Non-interactive display element; semantic contrast and non-color status cues apply.
          </p>
        )}
      </section>
    </div>
  );
}
