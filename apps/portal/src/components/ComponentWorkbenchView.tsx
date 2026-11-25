"use client";

import React, { useMemo, useState } from "react";
import registry from "@hahlex/millar-tokens/registry";
import {
  Alert,
  AppShell,
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
  IconDownload,
  IconLayers,
  IconSettings,
  IconShield,
  IconUsers,
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
  type AlertTone,
  type BadgeTone,
  type ButtonSize,
  type ButtonVariant,
  type MillarIconBoxTone,
} from "@hahlex/millar-ui";
import { HahlexLockup } from "@hahlex/millar-marketing";
import { DocHeader, SpecimenFrame } from "@/components/DocPrimitives";

const TABLE_FIXTURE = [
  { id: "1", pkg: "@hahlex/millar-tokens", status: "Approved", note: "", tests: "8 / 8" },
  { id: "2", pkg: "@hahlex/millar-ui", status: "Approved", note: "", tests: "8 / 8" },
  { id: "3", pkg: "@hahlex/millar-marketing", status: "Draft", note: "", tests: "5 / 5" },
  { id: "4", pkg: "@hahlex/millar-mcp", status: "Draft", note: "stdio + HTTP", tests: "4 / 4" },
];

export function ComponentWorkbenchView({ id }: { id: string }) {
  const component = registry.components.find((c) => c.id === id) ?? registry.components[0]!;

  // Button playground state
  const [btnVariant, setBtnVariant] = useState<ButtonVariant>("primary");
  const [btnSize, setBtnSize] = useState<ButtonSize>("md");
  const [btnBusyCount, setBtnBusyCount] = useState(0);
  const [btnPillCount, setBtnPillCount] = useState(0);
  const [btnDisabledToggle, setBtnDisabledToggle] = useState(true);
  const [btnStatus, setBtnStatus] = useState<string>("Click any button above to test async busy-guard locking or live press events.");

  // Input / Form Controls state
  const [inputVal, setInputVal] = useState("Hahlex Studio");
  const [inputErr, setInputErr] = useState(false);
  const [selectVal, setSelectVal] = useState("product");
  const [notesVal, setNotesVal] = useState("Verified keyboard focus ring and 1px warm-sand border.");
  const [switchVal, setSwitchVal] = useState(true);
  const [checkVal, setCheckVal] = useState(true);

  // ChoiceToggle state
  const [choiceVal, setChoiceVal] = useState<"light" | "dark" | "system">("light");

  // Card state
  const [cardSurface, setCardSurface] = useState<"base" | "inset" | "raised">("base");
  const [cardPadding, setCardPadding] = useState<"default" | "compact" | "none">("default");

  // Badge state
  const [badgeTone, setBadgeTone] = useState<BadgeTone>("brand");
  const [badgeDot, setBadgeDot] = useState(true);
  const [badgeLabel, setBadgeLabel] = useState("Draft Governance");

  // Stat state
  const [statTone, setStatTone] = useState<MillarIconBoxTone>("success");
  const [statProgress, setStatProgress] = useState(92);

  // Tabs & Segmented state
  const [segVal, setSegVal] = useState<"table" | "cards">("table");
  const [demoTab, setDemoTab] = useState("overview");

  // DataTable & FilterBar state
  const [mobileTableMode, setMobileTableMode] = useState(false);
  const [tableQuery, setTableQuery] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState<"all" | "Approved" | "Draft">("all");
  const [selectedTableRowId, setSelectedTableRowId] = useState<string>("1");

  // Dialog & Feedback state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmCount, setConfirmCount] = useState(0);
  const [alertTone, setAlertTone] = useState<AlertTone>("success");
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [draftTokensCreated, setDraftTokensCreated] = useState(0);

  // AppShell & PageHeader state
  const [shellNav, setShellNav] = useState<"catalog" | "teams" | "governance">("catalog");
  const [shellItemsCount, setShellItemsCount] = useState(10);
  const [shellLastAction, setShellLastAction] = useState<string | null>(null);

  const filteredTableRows = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    return TABLE_FIXTURE.filter((row) => {
      const matchesStatus = tableStatusFilter === "all" || row.status === tableStatusFilter;
      const matchesQuery = !q || row.pkg.toLowerCase().includes(q) || row.status.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [tableQuery, tableStatusFilter]);

  const activeTablePills = useMemo(() => {
    const pills: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (tableQuery.trim()) {
      pills.push({ key: "query", label: `Search: ${tableQuery.trim()}`, onRemove: () => setTableQuery("") });
    }
    if (tableStatusFilter !== "all") {
      pills.push({ key: "status", label: `Lifecycle: ${tableStatusFilter}`, onRemove: () => setTableStatusFilter("all") });
    }
    return pills;
  }, [tableQuery, tableStatusFilter]);

  const selectedTableRow = filteredTableRows.find((r) => r.id === selectedTableRowId) ?? filteredTableRows[0] ?? null;

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
              <Switch checked={btnDisabledToggle} onChange={setBtnDisabledToggle} label="Lock 3rd button (disabled)" />
            </div>
            <div style={{ padding: 24, borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-2)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Button
                variant={btnVariant}
                size={btnSize}
                icon={<IconAdd size="md" />}
                onClick={async () => {
                  setBtnStatus("Running async action (700ms busy lock active; duplicate clicks blocked)...");
                  await new Promise((r) => setTimeout(r, 700));
                  setBtnBusyCount((c) => {
                    const next = c + 1;
                    setBtnStatus(`Async action #${next} completed cleanly with aria-busy protection.`);
                    return next;
                  });
                }}
              >
                Test async busy guard ({btnBusyCount})
              </Button>
              <Button
                variant={btnVariant}
                size={btnSize}
                pill
                onClick={() => {
                  setBtnPillCount((c) => {
                    const next = c + 1;
                    setBtnStatus(`Pill action clicked ${next}x using variant="${btnVariant}" size="${btnSize}".`);
                    return next;
                  });
                }}
              >
                Pill action ({btnPillCount})
              </Button>
              <Button
                variant={btnVariant}
                size={btnSize}
                disabled={btnDisabledToggle}
                onClick={() => setBtnStatus("Third button is now enabled and responded to click.")}
              >
                {btnDisabledToggle ? "Disabled" : "Enabled button"}
              </Button>
            </div>
            <Alert tone="info" title="Interactive event readout" message={btnStatus} />
          </div>
        );

      case "input":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <Switch checked={inputErr} onChange={setInputErr} label="Simulate validation error (role='alert')" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInputVal("Hahlex Studio");
                  setInputErr(false);
                  setSelectVal("product");
                  setNotesVal("Verified keyboard focus ring and 1px warm-sand border.");
                  setSwitchVal(true);
                  setCheckVal(true);
                }}
              >
                Reset form
              </Button>
            </div>
            <Input
              label="Workspace name"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              hint="Uses role='alert' + aria-describedby when an error occurs."
              error={inputErr || inputVal.trim().length < 3 ? "Workspace name must be at least 3 characters." : undefined}
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
            <TextArea
              label={`Review notes (${notesVal.length} chars)`}
              rows={2}
              value={notesVal}
              onChange={(e) => setNotesVal(e.target.value)}
            />
            <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <Switch checked={switchVal} onChange={setSwitchVal} label="Enforce zero em-dash" />
              <Checkbox checked={checkVal} onChange={setCheckVal} label="Require human sign-off" />
              <HelpTooltip hint="24x24px click, hover, and Escape accessible tooltip." />
            </div>
            <div
              role="status"
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--bg-surface-2)",
                border: "1px solid var(--border-default)",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-micro)",
                color: "var(--fg-muted)",
              }}
            >
              Live state: workspace=&quot;{inputVal}&quot; · register={selectVal} · emDashGuard={String(switchVal)} · signOff={String(checkVal)}
            </div>
          </div>
        );

      case "choice-toggle":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            <div
              role="status"
              style={{
                padding: 16,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-default)",
                backgroundColor: choiceVal === "dark" ? "var(--bg-stage-dark)" : "var(--bg-surface-2)",
                color: choiceVal === "dark" ? "var(--fg-on-stage-dark)" : "var(--fg-default)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong style={{ fontSize: "var(--text-body-sm)" }}>Selected value: {choiceVal}</strong>
                <p style={{ margin: "4px 0 0", fontSize: "var(--text-meta)", color: choiceVal === "dark" ? "var(--fg-muted-on-stage-dark)" : "var(--fg-muted)" }}>
                  Active option uses <code>--accent-soft</code> + <code>--fg-on-accent-soft</code> (7.69:1 AAA), eliminating the 1.00:1 dark-mode invisible text bug.
                </p>
              </div>
              <Badge tone="brand">{choiceVal.toUpperCase()}</Badge>
            </div>
          </div>
        );

      case "card":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <ChoiceToggle
                label="Card surface"
                value={cardSurface}
                onChange={setCardSurface}
                options={[
                  { value: "base", label: "surface: base" },
                  { value: "inset", label: "surface: inset" },
                  { value: "raised", label: "surface: raised" },
                ]}
              />
              <ChoiceToggle
                label="Card padding"
                value={cardPadding}
                onChange={setCardPadding}
                options={[
                  { value: "default", label: "padding: default" },
                  { value: "compact", label: "padding: compact" },
                  { value: "none", label: "padding: none" },
                ]}
              />
            </div>

            <div style={{ padding: 20, borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-2)" }}>
              <Card surface={cardSurface} padding={cardPadding}>
                <div style={{ padding: cardPadding === "none" ? 16 : 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <strong>Live Interactive Card</strong>
                    <Badge tone="brand">{cardSurface} · {cardPadding}</Badge>
                  </div>
                  <span style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
                    {cardSurface === "raised"
                      ? "Uses --shadow-card elevation with border: none (zero ghost double borders)."
                      : cardSurface === "inset"
                        ? "Recessed --bg-surface-2 with 1px hairline border for nested inspector blocks."
                        : "Default --bg-surface with 1px hairline border and zero drop shadow."}
                  </span>
                </div>
              </Card>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
              {(
                [
                  { id: "base", desc: "1px hairline, zero shadow." },
                  { id: "inset", desc: "Subtle recessed container." },
                  { id: "raised", desc: "Elevation shadow, no border." },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setCardSurface(preset.id)}
                  className="millar-focus"
                  style={{
                    textAlign: "left",
                    padding: 0,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "var(--radius-lg)",
                  }}
                >
                  <Card
                    surface={preset.id}
                    padding="compact"
                    style={{
                      outline: cardSurface === preset.id ? "2px solid var(--fg-accent)" : "none",
                      outlineOffset: 2,
                    }}
                  >
                    <strong>surface=&quot;{preset.id}&quot;</strong>
                    <span style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>{preset.desc}</span>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        );

      case "badge":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ minWidth: 200, flex: "1 1 200px" }}>
                <Input label="Badge text" value={badgeLabel} onChange={(e) => setBadgeLabel(e.target.value)} />
              </div>
              <Switch checked={badgeDot} onChange={setBadgeDot} label="Show status dot" />
            </div>
            <div style={{ padding: 20, borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <Badge tone={badgeTone} dot={badgeDot}>
                {badgeLabel || "Badge"}
              </Badge>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>
                {`<Badge tone="${badgeTone}" dot={${badgeDot}}>${badgeLabel || "Badge"}</Badge>`}
              </code>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(
                [
                  { tone: "neutral", text: "Neutral" },
                  { tone: "brand", text: "Draft" },
                  { tone: "sand", text: "Marketing" },
                  { tone: "sage", text: "Product" },
                  { tone: "success", text: "Approved" },
                  { tone: "warning", text: "Review" },
                  { tone: "error", text: "Deprecated" },
                ] as const
              ).map((item) => (
                <button
                  key={item.tone}
                  type="button"
                  aria-pressed={badgeTone === item.tone}
                  onClick={() => {
                    setBadgeTone(item.tone);
                    setBadgeLabel(item.text);
                  }}
                  className="millar-focus"
                  style={{
                    padding: 2,
                    borderRadius: "var(--radius-pill)",
                    border: badgeTone === item.tone ? "1px solid var(--fg-accent)" : "1px solid transparent",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <Badge tone={item.tone} dot={badgeDot}>
                    {item.text}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        );

      case "stat":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <ChoiceToggle
                label="Stat tone"
                value={statTone}
                onChange={setStatTone}
                options={[
                  { value: "brand", label: "brand" },
                  { value: "success", label: "success" },
                  { value: "sage", label: "sage" },
                  { value: "sand", label: "sand" },
                  { value: "warning", label: "warning" },
                  { value: "error", label: "error" },
                ]}
              />
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Button variant="white" size="sm" onClick={() => setStatProgress((p) => Math.max(0, p - 10))}>
                  -10%
                </Button>
                <Button variant="white" size="sm" onClick={() => setStatProgress((p) => Math.min(100, p + 10))}>
                  +10%
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStatProgress(100)}>
                  100%
                </Button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <Stat
                label="WCAG AA Contrast"
                value="97 / 97"
                delta="0 regressions"
                tone={statTone}
                icon={<IconShield size="md" />}
                progressPercent={statProgress}
              />
              <Stat
                label="Token Parity"
                value={`${statProgress}%`}
                delta="CSS · TW4 · AntD · MCP"
                tone="brand"
                icon={<IconLayers size="md" />}
                progressPercent={statProgress}
              />
            </div>
          </div>
        );

      case "tabs":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <Segmented
                ariaLabel="Display mode"
                value={segVal}
                onChange={setSegVal}
                options={[
                  { value: "table", label: "Table view" },
                  { value: "cards", label: "Cards view" },
                ]}
              />
              <Badge tone="neutral" dot={false}>Active tab: {demoTab} · View: {segVal}</Badge>
            </div>
            <Tabs
              ariaLabel="Sample APG tabs"
              activeId={demoTab}
              onChange={setDemoTab}
              items={[
                {
                  id: "overview",
                  label: "Overview",
                  content:
                    segVal === "table" ? (
                      <DataTable
                        caption="Segmented table mode"
                        columns={[
                          { key: "surface", header: "Surface" },
                          { key: "register", header: "Register" },
                        ]}
                        rows={[
                          { id: "s1", surface: "Portal Docs", register: "Product + Marketing" },
                          { id: "s2", surface: "MCP Server", register: "Machine SSoT" },
                        ]}
                        rowKey={(r) => r.id}
                      />
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                        <Card surface="inset" padding="compact">
                          <strong>Portal Docs</strong>
                          <span style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>Product + Marketing</span>
                        </Card>
                        <Card surface="inset" padding="compact">
                          <strong>MCP Server</strong>
                          <span style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>Machine SSoT</span>
                        </Card>
                      </div>
                    ),
                },
                { id: "tokens", label: "Tokens", content: <p style={{ margin: 0, color: "var(--fg-muted)" }}>Active ink bar binds strictly to <code>--fg-accent</code> across Light and Dark themes.</p> },
                { id: "a11y", label: "Keyboard", content: <p style={{ margin: 0, color: "var(--fg-muted)" }}>Use ArrowLeft, ArrowRight, Home, and End keys to cycle tabs; roving tabindex keeps Tab order clean into this panel.</p> },
              ]}
            />
          </div>
        );

      case "data-table":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <Switch checked={mobileTableMode} onChange={setMobileTableMode} label="Preview mobileCard mode (< 640px)" />
              <ChoiceToggle
                label="Filter lifecycle status"
                value={tableStatusFilter}
                onChange={setTableStatusFilter}
                options={[
                  { value: "all", label: "All (4)" },
                  { value: "Approved", label: "Approved" },
                  { value: "Draft", label: "Draft" },
                ]}
              />
            </div>
            <FilterBar
              searchValue={tableQuery}
              onSearchChange={setTableQuery}
              searchPlaceholder="Type to filter packages (e.g. tokens, ui, mcp)..."
              activePills={activeTablePills}
              onClearAll={() => {
                setTableQuery("");
                setTableStatusFilter("all");
              }}
            />
            <DataTable
              caption="Zero-scrollbar specimen table (empty cells render '-')"
              forceMobileCards={mobileTableMode}
              columns={[
                { key: "pkg", header: "Package" },
                {
                  key: "status",
                  header: "Lifecycle",
                  render: (r) => <Badge tone={r.status === "Approved" ? "success" : "brand"}>{String(r.status)}</Badge>,
                },
                { key: "note", header: "Notes" },
                { key: "tests", header: "Tests", align: "right", numeric: true },
                {
                  key: "action",
                  header: "Inspect",
                  align: "right",
                  render: (r) => (
                    <Button
                      variant={selectedTableRowId === r.id ? "primary" : "white"}
                      size="sm"
                      onClick={() => setSelectedTableRowId(String(r.id))}
                    >
                      {selectedTableRowId === r.id ? "Selected" : "Select"}
                    </Button>
                  ),
                },
              ]}
              rows={filteredTableRows}
              rowKey={(r) => r.id}
              mobileCard={(r) => (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div>
                    <strong>{String(r.pkg)}</strong>
                    <div style={{ fontSize: "var(--text-micro)", color: "var(--fg-muted)" }}>{String(r.status)}</div>
                  </div>
                  <Button
                    variant={selectedTableRowId === r.id ? "primary" : "white"}
                    size="sm"
                    onClick={() => setSelectedTableRowId(String(r.id))}
                  >
                    {String(r.tests)}
                  </Button>
                </div>
              )}
            />
            {selectedTableRow ? (
              <Alert
                tone="info"
                title={`Selected package: ${selectedTableRow.pkg}`}
                message={`Lifecycle: ${selectedTableRow.status} · Tests passing: ${selectedTableRow.tests} · Matching rows: ${filteredTableRows.length}`}
              />
            ) : (
              <EmptyState
                icon={<IconLayers size="lg" />}
                title="No matching packages"
                description="Clear the search filter or switch lifecycle status to inspect packages."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setTableQuery("");
                      setTableStatusFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            )}
          </div>
        );

      case "dialog":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "space-between" }}>
              <Button variant="danger" onClick={() => setDialogOpen(true)}>
                Open ConfirmDialog ({confirmCount} confirmed)
              </Button>
              <ChoiceToggle
                label="Alert tone"
                value={alertTone}
                onChange={setAlertTone}
                options={[
                  { value: "info", label: "info" },
                  { value: "success", label: "success" },
                  { value: "warning", label: "warning" },
                  { value: "error", label: "error" },
                ]}
              />
            </div>

            <ConfirmDialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              onConfirm={async () => {
                await new Promise((r) => setTimeout(r, 350));
                setConfirmCount((c) => c + 1);
              }}
              title="Deprecate legacy token"
              message="Consumers will receive migration warnings through the deprecation runway before removal."
              confirmLabel="Deprecate"
            />

            <Alert
              tone={alertTone}
              title={confirmCount > 0 ? `Deprecation confirmed (${confirmCount}x)` : "Token audit clean"}
              message={
                confirmCount > 0
                  ? `ConfirmDialog completed async action #${confirmCount} and restored focus cleanly.`
                  : "All 97 light and dark pairs clear WCAG 2.1 AA with zero failures."
              }
            />

            {retrying ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
                <span style={{ fontSize: "var(--text-meta)", color: "var(--fg-muted)" }}>Retrying token registry sync (zero-gradient Skeleton)...</span>
                <Skeleton width="60%" height={18} />
                <Skeleton width="100%" height={14} />
              </div>
            ) : (
              <LoadFailed
                message={
                  retryCount > 0
                    ? `Previous retry #${retryCount} ran cleanly. Click Retry again to preview the solid Skeleton state.`
                    : "Unable to reach preview endpoint. Click Retry to test recovery state."
                }
                onRetry={() => {
                  setRetrying(true);
                  setTimeout(() => {
                    setRetrying(false);
                    setRetryCount((c) => c + 1);
                  }, 500);
                }}
              />
            )}

            <EmptyState
              icon={<IconLayers size="lg" />}
              title={draftTokensCreated > 0 ? `${draftTokensCreated} draft token(s) queued` : "No deprecated tokens"}
              description="Every token in v0.1.0 is active. Click below to test the EmptyState call-to-action."
              action={
                <Button variant="primary" size="sm" icon={<IconAdd size="sm" />} onClick={() => setDraftTokensCreated((c) => c + 1)}>
                  Queue draft proposal
                </Button>
              }
            />
          </div>
        );

      default:
        return (
          <div data-embedded-preview="true" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <AppShell
              embedded
              brand={<HahlexLockup size={22} />}
              onNavigate={(navId) => setShellNav(navId as "catalog" | "teams" | "governance")}
              navItems={[
                { id: "catalog", label: "Catalog", href: "#catalog", icon: <IconLayers size="md" />, active: shellNav === "catalog" },
                { id: "teams", label: "Teams", href: "#teams", icon: <IconUsers size="md" />, active: shellNav === "teams" },
                { id: "governance", label: "Governance", href: "#governance", icon: <IconSettings size="md" />, active: shellNav === "governance" },
              ]}
            >
              <PageHeader
                embedded
                title={
                  shellNav === "catalog"
                    ? "Operational Directory"
                    : shellNav === "teams"
                      ? "Design Stewards"
                      : "Release Governance"
                }
                meta={<Badge tone="brand">{shellItemsCount} items · 1 Primary CTA Max</Badge>}
                secondaryActions={
                  <Button
                    variant="white"
                    icon={<IconDownload size="md" />}
                    onClick={() => setShellLastAction(`Exported ${shellItemsCount} records from ${shellNav} view.`)}
                  >
                    Export
                  </Button>
                }
                primaryAction={
                  <Button
                    variant="primary"
                    icon={<IconAdd size="md" />}
                    onClick={() => {
                      setShellItemsCount((c) => {
                        const next = c + 1;
                        setShellLastAction(`Created item #${next} inside ${shellNav} workspace.`);
                        return next;
                      });
                    }}
                  >
                    Create
                  </Button>
                }
              />
              {shellLastAction ? (
                <Alert
                  tone="success"
                  title="Workspace action"
                  message={shellLastAction}
                  action={
                    <Button variant="ghost" size="sm" onClick={() => setShellLastAction(null)}>
                      Dismiss
                    </Button>
                  }
                />
              ) : null}
              <Card surface="inset" padding="compact">
                <strong>Active section: {shellNav}</strong>
                <span style={{ fontSize: "var(--text-body-sm)", color: "var(--fg-muted)" }}>
                  Use the sidebar navigation items or collapse button above to test AppShell layout switching in real time.
                </span>
              </Card>
            </AppShell>
          </div>
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
