import React, { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import {
  Alert,
  AppShell,
  Badge,
  Button,
  ChoiceToggle,
  ConfirmDialog,
  DataTable,
  FilterBar,
  HelpTooltip,
  IconAdd,
  IconShield,
  Input,
  PageHeader,
  Stat,
  Switch,
  Tabs,
  createMillarAntdTheme,
} from "./index.js";

afterEach(() => {
  cleanup();
});

describe("@hahlex/millar-ui Primitives (Accessibility, Keyboard & Audit Defect Regression)", () => {
  it("Button guards against double-click while an async promise is pending and retains aria-busy", async () => {
    const user = userEvent.setup();
    let resolveFn!: () => void;
    const handler = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolveFn = res;
        }),
    );

    render(
      <Button variant="primary" onClick={handler} icon={<IconAdd size="md" />}>
        Save
      </Button>,
    );

    const btn = screen.getByRole("button", { name: "Save" });
    await user.click(btn);
    expect(btn.getAttribute("aria-busy")).toBe("true");
    await user.click(btn);
    expect(handler).toHaveBeenCalledTimes(1);

    resolveFn();
  });

  it("Input announces validation errors via role='alert' + aria-describedby and decouples HelpTooltip from label", async () => {
    const user = userEvent.setup();
    render(
      <Input
        label="Workspace slug"
        hint="Used for permanent API paths."
        error="Slug must be lowercase."
      />,
    );

    const input = screen.getByLabelText("Workspace slug");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Slug must be lowercase.");
    expect(input.getAttribute("aria-describedby")).toBe(alert.id);

    // HelpTooltip works by click (touch-safe) and Escape dismisses
    const helpBtn = screen.getByRole("button", { name: "Help for Workspace slug" });
    await user.click(helpBtn);
    expect(screen.getByRole("tooltip").textContent).toContain("Used for permanent API paths.");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("ChoiceToggle pairs --accent-soft with --fg-on-accent-soft (prevents 1.00:1 invisible dark toggle bug)", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [mode, setMode] = useState<"light" | "dark">("light");
      return (
        <ChoiceToggle
          label="Theme mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      );
    }

    render(<Harness />);
    const darkBtn = screen.getByRole("button", { name: "Dark" });
    await user.click(darkBtn);
    expect(darkBtn.getAttribute("aria-pressed")).toBe("true");
    expect(darkBtn.style.backgroundColor).toBe("var(--accent-soft)");
    expect(darkBtn.style.color).toBe("var(--fg-on-accent-soft)");
  });

  it("Tabs supports full APG ArrowRight/ArrowLeft/Home/End keyboard navigation", async () => {
    const user = userEvent.setup();
    function TabHarness() {
      const [active, setActive] = useState("a");
      return (
        <Tabs
          ariaLabel="Specs"
          activeId={active}
          onChange={setActive}
          items={[
            { id: "a", label: "Playground", content: <p>Panel A</p> },
            { id: "b", label: "Guidelines", content: <p>Panel B</p> },
            { id: "c", label: "Code", content: <p>Panel C</p> },
          ]}
        />
      );
    }

    render(<TabHarness />);
    const tabA = screen.getByRole("tab", { name: "Playground" });
    tabA.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Guidelines" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Panel B")).toBeTruthy();

    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Code" }).getAttribute("aria-selected")).toBe("true");
  });

  it("DataTable renders '-' (never em-dash) for empty values and supports mobileCard view", () => {
    const rows = [{ id: "1", name: "Warm Sand", note: "" }];
    const { rerender } = render(
      <DataTable
        caption="Tokens"
        columns={[
          { key: "name", header: "Token" },
          { key: "note", header: "Note" },
        ]}
        rows={rows}
        rowKey={(r) => r.id}
        mobileCard={(r) => <div data-testid="mobile-card">{r.name}</div>}
      />,
    );
    expect(screen.getByText("-")).toBeTruthy();
    expect(screen.queryByText("\u2014")).toBeNull();

    rerender(
      <DataTable
        columns={[{ key: "name", header: "Token" }]}
        rows={rows}
        rowKey={(r) => r.id}
        mobileCard={(r) => <div data-testid="mobile-card">{r.name}</div>}
        forceMobileCards
      />,
    );
    expect(screen.getByTestId("mobile-card").textContent).toBe("Warm Sand");
  });

  it("ConfirmDialog opens with modal semantics and closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={() => {}}
        title="Delete token"
        message="This action cannot be undone."
      />,
    );

    expect(screen.getByRole("dialog", { name: "Delete token" })).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("createMillarAntdTheme emits literal hex strings (never CSS var() references)", () => {
    const light = createMillarAntdTheme("light");
    const dark = createMillarAntdTheme("dark");
    expect(light.token.colorPrimary).toBe("#4a3022");
    expect(dark.token.colorPrimary).toBe("#6b4d35");
    expect(light.token.colorLink).toBe("#6b4d35");
    expect(dark.token.colorLink).toBe("#d6b48a");
  });

  it("passes axe-core automated accessibility scan on a full composite Product workspace", async () => {
    const { container } = render(
      <AppShell
        brand={<span>Hahlex</span>}
        navItems={[{ id: "overview", label: "Overview", href: "#overview", active: true }]}
      >
        <PageHeader
          title="Design Governance"
          meta={<Badge tone="brand">Draft</Badge>}
          primaryAction={<Button variant="primary">New entry</Button>}
        />
        <FilterBar
          searchValue=""
          onSearchChange={() => {}}
          activePills={[{ key: "status", label: "Status: Draft", onRemove: () => {} }]}
          onClearAll={() => {}}
        />
        <Stat label="WCAG AA Pass" value="80/80" icon={<IconShield size="md" />} progressPercent={100} />
        <Switch checked onChange={() => {}} label="Strict contrast enforcement" />
        <HelpTooltip hint="Checked automatically during CI." />
        <Alert tone="success" title="All invariants verified" message="Zero contrast failures detected." />
      </AppShell>,
    );

    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
