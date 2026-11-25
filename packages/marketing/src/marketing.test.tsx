import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import {
  AnalyticsDashboardTemplate,
  DefaultMarketingDoDontShowcase,
  DirectoryWorkspaceTemplate,
  EditorialFeatureTemplate,
  ProductLaunchTemplate,
  ProductStageShowcase,
  WarmHorizonWash,
  WorkflowLoopSection,
} from "./index.js";

afterEach(() => {
  cleanup();
});

describe("@hahlex/millar-marketing: Diverse Compositions, Zero-Photo Assets & Landmarks", () => {
  it("marks WarmHorizonWash explicitly as an approved Marketing gradient visual asset", () => {
    const { container } = render(
      <WarmHorizonWash intensity="editorial">
        <p>Stage content</p>
      </WarmHorizonWash>,
    );
    const el = container.querySelector('[data-millar-approved-gradient="warm-horizon-wash"]');
    expect(el).not.toBeNull();
  });

  it("ProductStageShowcase switches live stylized product frames cleanly via accessible tabs", async () => {
    const user = userEvent.setup();
    render(<ProductStageShowcase />);

    expect(screen.getByText(/millar \/ token-audit/i)).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "MCP Validation" }));
    expect(screen.getByText(/millar-mcp \/ validate_design/i)).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "3-Tier Architecture" }));
    expect(screen.getByText(/Tier 1: Shared Foundations SSoT/i)).toBeTruthy();
  });

  it("WorkflowLoopSection renders collision-free selectable steps", async () => {
    const user = userEvent.setup();
    render(<WorkflowLoopSection />);
    const validateBtn = screen.getByRole("button", { name: /Validate/i });
    await user.click(validateBtn);
    expect(validateBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("ProductLaunchTemplate places <footer> outside <main> and passes axe-core with zero violations", async () => {
    const { container } = render(<ProductLaunchTemplate />);
    const main = container.querySelector("main");
    const footer = container.querySelector("footer");
    expect(main).not.toBeNull();
    expect(footer).not.toBeNull();
    // Critical regression check against education-portfolio Audit 02: footer MUST NOT be inside <main>
    expect(main!.contains(footer)).toBe(false);

    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it("renders EditorialFeatureTemplate, DirectoryWorkspaceTemplate, AnalyticsDashboardTemplate, and Visual Do/Dont cleanly", async () => {
    const { container: c1 } = render(<EditorialFeatureTemplate />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Design systems should enforce craft");
    expect((await axe.run(c1, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
    cleanup();

    const { container: c2 } = render(<DirectoryWorkspaceTemplate />);
    expect((await axe.run(c2, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
    cleanup();

    const { container: c3 } = render(<AnalyticsDashboardTemplate />);
    expect((await axe.run(c3, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
    cleanup();

    const { container: c4 } = render(<DefaultMarketingDoDontShowcase />);
    expect((await axe.run(c4, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });
});
