import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SHOTS_DIR = path.resolve(process.cwd(), "e2e", "screenshots");
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const ROUTES = [
  { path: "/millar/", name: "home" },
  { path: "/millar/foundations/", name: "foundations" },
  { path: "/millar/marketing/", name: "marketing" },
  { path: "/millar/product/", name: "product" },
  { path: "/millar/resources/", name: "resources" },
];

test.describe("Millar Portal E2E, Real-Browser WCAG AA Accessibility & Visual Capture", () => {
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

      // Light mode axe-core WCAG 2.0/2.1/2.2 AA scan (excluding ONLY intentional "Don't" anti-pattern visual specimens)
      const axeLight = await new AxeBuilder({ page })
        .exclude('[data-millar-antipattern-specimen="true"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const blockingLight = axeLight.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect(blockingLight, `Light mode axe violations on ${route.path}: ${JSON.stringify(blockingLight, null, 2)}`).toEqual([]);

      await page.screenshot({ path: path.join(SHOTS_DIR, `${route.name}-desktop-light.png`), fullPage: false });

      // Switch to Dark theme and wait for 140ms button/surface CSS transitions to finish before scanning
      await page.getByRole("button", { name: "Dark", exact: true }).first().click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.waitForTimeout(260);

      const axeDark = await new AxeBuilder({ page })
        .exclude('[data-millar-antipattern-specimen="true"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const blockingDark = axeDark.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect(blockingDark, `Dark mode axe violations on ${route.path}: ${JSON.stringify(blockingDark, null, 2)}`).toEqual([]);

      if (route.name === "home" || route.name === "marketing") {
        await page.screenshot({ path: path.join(SHOTS_DIR, `${route.name}-desktop-dark.png`), fullPage: false });
      }
    });
  }

  test("keyboard workflows: Skip link, Ctrl+K Search Dialog, Escape close, VI locale toggle, and Mobile Drawer at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/millar/", { waitUntil: "networkidle" });

    // Skip link appears on first Tab
    await page.keyboard.press("Tab");
    const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focusedText).toBe("Skip to main content");

    // Ctrl+K opens global Search Dialog and queries registry
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /Search Millar/i });
    await expect(dialog).toBeVisible();
    await page.getByLabel("Search Millar catalog").fill("WarmHorizonWash");
    await expect(dialog.getByRole("button", { name: /WarmHorizonWash Visual Asset/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // VI specimen toggle updates <html lang="vi"> for :root:lang(vi) diacritic safety
    await page.goto("/millar/foundations/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "VI", exact: true }).first().click();
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await page.screenshot({ path: path.join(SHOTS_DIR, "foundations-vi-light.png"), fullPage: false });

    // Tablet 768px check: zero horizontal overflow
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
    await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Marketing" })).toBeVisible();
    await page.screenshot({ path: path.join(SHOTS_DIR, "home-mobile-light.png"), fullPage: false });
  });

  test("static-first reduced-motion rendering on Marketing Visual Asset Gallery", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/millar/marketing/", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "Six Diverse Composition Patterns" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Code-Native Visual Asset Gallery & Playground" })).toBeVisible();
  });
});
