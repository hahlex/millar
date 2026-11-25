# Five-Layer Web QA Gate: Executable Patterns

Use these battle-tested Playwright and CLI patterns to run objective, repeatable real-browser verification.

## 1. Zero-Error & Landmark Guard (Playwright)

```ts
const consoleErrors: string[] = [];
const failedResponses: string[] = [];
page.on("pageerror", (e) => consoleErrors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("response", (r) => { if (r.status() >= 400) failedResponses.push(`${r.status()} ${r.url()}`); });

await page.goto(route, { waitUntil: "networkidle" });
expect(consoleErrors).toEqual([]);
expect(failedResponses).toEqual([]);

const landmarks = await page.evaluate(() => {
  const mains = document.querySelectorAll("main");
  const footers = document.querySelectorAll("footer");
  return {
    mainCount: mains.length,
    footerCount: footers.length,
    footerInsideMain: Boolean(mains[0] && footers[0] && mains[0].contains(footers[0])),
  };
});
expect(landmarks).toEqual({ mainCount: 1, footerCount: 1, footerInsideMain: false });
```

## 2. Multi-Viewport Zero-Overflow & Screenshot Capture

```ts
for (const vp of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 812 },
]) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(route, { waitUntil: "networkidle" });
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasOverflow, `Horizontal overflow at ${vp.name} on ${route}`).toBe(false);
  await page.screenshot({ path: `e2e/screenshots/${routeName}-${vp.name}.png`, fullPage: false });
}
```

## 3. Dynamic-State `axe-core` WCAG 2.1 AA Scan (Light & Dark)

```ts
const scan = async (label: string) => {
  const res = await new AxeBuilder({ page })
    .exclude('[data-millar-antipattern-specimen="true"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const blocking = res.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(blocking, `WCAG violations (${label}): ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
};

await scan("light-default");
// Also scan interactive states (opened dialog / drawer / error validation) and Dark theme!
```

## 4. Keyboard & Reduced-Motion Checks

```ts
// Skip link check
await page.keyboard.press("Tab");
expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toMatch(/Skip to/i);

// Reduced-motion static-first check
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(route, { waitUntil: "networkidle" });
// Confirm hero headline and primary visual are visible immediately at opacity 1
await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
```

## 5. Honest Verification Reporting Template

Summarize results cleanly with zero inflated claims:
- **Layer 1 (Static & Millar MCP):** exact command + pass count (`typecheck`, `tests`, `validate_design`).
- **Layer 2 (Interactive E2E):** routes & controls exercised, `0` console/HTTP errors.
- **Layer 3 (Visual & Cross-Page Continuity):** viewports captured & visually inspected, cross-page score (`>= 4/5` per axis).
- **Layer 4 (A11y & Motion):** `axe-core` count (Light & Dark), keyboard & `prefers-reduced-motion` results, plus note on manual screen-reader verification.
- **Layer 5 (2-Axis Review):** Spec findings vs Standards findings kept separate.
