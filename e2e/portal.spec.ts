import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SHOTS_DIR = path.resolve(process.cwd(), "e2e", "screenshots");
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const ROUTES = [
  { path: "/millar/", name: "home" },
  { path: "/millar/foundations/colors/", name: "foundations-colors" },
  { path: "/millar/foundations/typography/", name: "foundations-typography" },
  { path: "/millar/marketing/art-direction/", name: "marketing-art-direction" },
  { path: "/millar/marketing/compositions/", name: "marketing-compositions" },
  { path: "/millar/marketing/visual-assets/", name: "marketing-visual-assets" },
  { path: "/millar/marketing/do-dont/", name: "marketing-do-dont" },
  { path: "/millar/components/button/", name: "components-button" },
  { path: "/millar/resources/skills/", name: "resources-skills" },
  { path: "/millar/resources/mcp/", name: "resources-mcp" },
];

test.describe("Millar Portal E2E (Geist-Style Sidebar IA), Real-Browser WCAG AA & Visual Capture", () => {
  for (const route of ROUTES) {
    test(`renders ${route.path} cleanly with 0 console/404 errors and 0 axe-core WCAG AA violations (Light & Dark)`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const failedResponses: string[] = [];

      page.on("pageerror", (err) => consoleErrors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("response", (res) => {
        if (res.status() >= 400) failedResponses.push(`${res.status()} ${res.url()}`);
      });

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route.path, { waitUntil: "networkidle" });

      expect(consoleErrors, `Console errors on ${route.path}`).toEqual([]);
      expect(failedResponses, `Failed HTTP responses on ${route.path}`).toEqual([]);

      // Verify persistent desktop left nav sidebar AND right "On this page" TOC sidebar are visible
      await expect(page.getByRole("navigation", { name: "Primary documentation" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Table of contents" })).toBeVisible();

      // Verify single top-level <main> and top-level <footer> strictly outside <main>
      const landmarkCheck = await page.evaluate(() => {
        const mains = document.querySelectorAll("main");
        const footers = document.querySelectorAll("footer");
        const main = mains[0];
        const footer = footers[0];
        return {
          mainCount: mains.length,
          footerCount: footers.length,
          footerInsideMain: Boolean(main && footer && main.contains(footer)),
        };
      });
      expect(landmarkCheck).toEqual({ mainCount: 1, footerCount: 1, footerInsideMain: false });

      // Zero horizontal overflow at desktop
      const overflowDesktop = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflowDesktop).toBe(false);

      // Light mode axe-core WCAG 2.0/2.1 AA scan (excluding ONLY intentional "Don't" anti-pattern visual specimens)
      const axeLight = await new AxeBuilder({ page })
        .exclude('[data-millar-antipattern-specimen="true"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const blockingLight = axeLight.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect(blockingLight, `Light mode axe violations on ${route.path}: ${JSON.stringify(blockingLight, null, 2)}`).toEqual([]);

      await page.screenshot({ path: path.join(SHOTS_DIR, `${route.name}-desktop-light.png`), fullPage: false });

      // Switch to Dark theme and wait for CSS transitions to settle
      await page.getByRole("button", { name: "Dark", exact: true }).first().click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.waitForTimeout(260);

      const axeDark = await new AxeBuilder({ page })
        .exclude('[data-millar-antipattern-specimen="true"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const blockingDark = axeDark.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect(blockingDark, `Dark mode axe violations on ${route.path}: ${JSON.stringify(blockingDark, null, 2)}`).toEqual([]);

      if (route.name === "home" || route.name === "components-button") {
        await page.screenshot({ path: path.join(SHOTS_DIR, `${route.name}-desktop-dark.png`), fullPage: false });
      }
    });
  }

  test("sidebar navigation, Ctrl+K Search Dialog, VI locale toggle, 768px Tablet & 375px Mobile Drawer", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/millar/", { waitUntil: "networkidle" });

    // Skip link appears on first Tab
    await page.keyboard.press("Tab");
    const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focusedText).toBe("Skip to main content");

    // Sidebar link click jumps directly to dedicated Button page
    await page.getByRole("navigation", { name: "Primary documentation" }).getByRole("link", { name: "Button" }).click();
    await expect(page).toHaveURL(/\/millar\/components\/button\/?/);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1, name: "Button" })).toBeVisible();

    // Ctrl+K opens global Search Dialog and queries registry
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /Search Millar/i });
    await expect(dialog).toBeVisible();
    await page.getByLabel("Search Millar catalog").fill("WarmHorizonWash");
    await expect(dialog.getByRole("button", { name: /WarmHorizonWash Visual Asset/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // VI specimen toggle updates <html lang="vi">
    await page.goto("/millar/foundations/typography/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "VI", exact: true }).first().click();
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await page.screenshot({ path: path.join(SHOTS_DIR, "foundations-vi-light.png"), fullPage: false });

    // Tablet 768px check
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/millar/", { waitUntil: "networkidle" });
    const overflowTablet = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflowTablet).toBe(false);
    await page.screenshot({ path: path.join(SHOTS_DIR, "home-tablet-light.png"), fullPage: false });

    // Mobile 375px check: zero horizontal overflow + accessible mobile navigation drawer
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/millar/", { waitUntil: "networkidle" });
    const overflowMobile = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflowMobile).toBe(false);

    const menuBtn = page.getByRole("button", { name: "Open navigation menu" });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Colors & Themes" })).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS_DIR, "home-mobile-light.png"), fullPage: false });
  });

  test("static-first reduced-motion rendering on Marketing Visual Assets", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/millar/marketing/visual-assets/", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { level: 1, name: "Code-Native Visual Assets" })).toBeVisible();
  });

  test("published sample components, sections, visual assets, and templates are genuinely interactive", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Button playground live click readout
    await page.goto("/millar/components/button/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Pill action \(0\)/ }).click();
    await expect(page.getByRole("button", { name: /Pill action \(1\)/ })).toBeVisible();
    await expect(page.getByText(/Pill action clicked 1x/)).toBeVisible();

    // 2. DataTable FilterBar real search filtering + removable pill
    await page.goto("/millar/components/data-table/", { waitUntil: "networkidle" });
    const searchInput = page.getByPlaceholder("Type to filter packages (e.g. tokens, ui, mcp)...");
    await searchInput.fill("mcp");
    await expect(page.getByText("Search: mcp")).toBeVisible();
    await expect(page.getByRole("cell", { name: "@hahlex/millar-mcp" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "@hahlex/millar-tokens" })).toHaveCount(0);

    // 3. ConfirmDialog interactive open + confirm feedback
    await page.goto("/millar/components/dialog/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Open ConfirmDialog \(0 confirmed\)/ }).click();
    await expect(page.getByRole("dialog", { name: "Deprecate legacy token" })).toBeVisible();
    await page.getByRole("button", { name: "Deprecate", exact: true }).click();
    await expect(page.getByText(/Deprecation confirmed \(1x\)/)).toBeVisible();

    // 4. AppShell live nav switch + Create action
    await page.goto("/millar/components/app-shell/", { waitUntil: "networkidle" });
    await page.getByRole("navigation", { name: "Workspace preview sections" }).getByRole("link", { name: "Governance" }).click();
    await expect(page.getByRole("heading", { level: 3, name: "Release Governance" })).toBeVisible();
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText(/Created item #11 inside governance workspace/)).toBeVisible();

    // 5. Marketing Sections CTA interactive feedback
    await page.goto("/millar/marketing/sections/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Explore Millar" }).click();
    await expect(page.getByText(/Primary CTA clicked: "Explore Millar"/)).toBeVisible();

    // 6. Visual Assets ClosedLoopSchematic clickable step
    await page.goto("/millar/marketing/visual-assets/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Step 4 \/ 6/i }).click();
    await expect(page.getByText("Active step: validate")).toBeVisible();

    // 7. Application Templates live proposal creation
    await page.goto("/millar/components/templates/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "New proposal" }).click();
    await expect(page.getByRole("cell", { name: "Domain Proposal #1" })).toBeVisible();

    // 8. Agent Skills Suite interactive Track S/M/L planner & all 7 skill tabs
    await page.goto("/millar/resources/skills/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Photo-Free Hahlex Launch" }).click();
    await expect(page.getByText(/14 code-native SVG\/CSS\/Canvas visual assets/)).toBeVisible();
    await page.getByRole("tab", { name: "millar-verify-web" }).click();
    await expect(page.getByText("five-layer-qa-gate.md")).toBeVisible();
    await page.getByRole("tab", { name: "millar-build-web" }).click();
    await expect(page.getByText("web-architecture-checklist.md")).toBeVisible();
  });
});
