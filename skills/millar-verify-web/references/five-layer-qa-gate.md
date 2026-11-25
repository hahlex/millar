# Five-Layer Web QA Gate & Standalone Audit Patterns

Use these battle-tested zero-MCP CLI, Playwright, `axe-core`, and Independent Finish-Reviewer patterns for objective, repeatable verification.

## 1. Standalone Zero-MCP Mechanical Audit (`scripts/millar-audit.mjs`)

Works out of the box with plain Node.js (`>= 18`) even when Millar MCP is NOT installed or connected:

```bash
# Audit any built site or source directory (Marketing / Shared default)
node <skill-dir>/scripts/millar-audit.mjs ./src

# Strict Hahlex / Zero Em-Dash + Product UI Zero-Gradient enforcement
node <skill-dir>/scripts/millar-audit.mjs ./src --register=product --strict-em-dash

# Machine-readable JSON output for agents & CI + optional live URL overflow/landmark check
node <skill-dir>/scripts/millar-audit.mjs ./src --json --url=http://127.0.0.1:4173/
```

Checks enforced deterministically:
- **WCAG 2.1 Contrast Ratio:** Computes luminance ratio for declared `--bg-*`/`--fg-*` CSS token pairs (`>= 4.5:1` body, `>= 3.0:1` UI/large).
- **AI-Slop Craft Floor:** Gradient text (`background-clip: text` / `bg-clip-text`), 1-sided colored border strips on rounded containers, hard offset shadows (`4px 4px 0`), static `opacity: 0` traps, missing `prefers-reduced-motion`, undersized `< 12px` UI text, missing `img` `alt` or `width`/`height` (CLS).
- **Register & Copy Rules:** Product-mode CSS gradients (`--register=product`), U+2014 em-dash detection (`--strict-em-dash`).
- **Sparse Inline `<svg>` Clip-Art Heuristic:** Flags large editorial inline `<svg>` (`>= 120px`) with `< 15` primitives and zero `<defs>`/`filter`/`gradient`, catching flat clip-art automatically.
- **Optional Live Browser Pass (`--url`):** When Playwright is available, checks `0` console/page errors, `0` HTTP `>= 400`, `0px` horizontal overflow at `1440`/`768`/`375`, and landmark integrity (`1 <main>`, `<footer>` outside `<main>`).

## 2. Zero-Error & Landmark Guard (Playwright)

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

## 3. Multi-Viewport Zero-Overflow & Screenshot Capture

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
  await page.screenshot({ path: `.millar/review/${routeName}-${vp.name}.png`, fullPage: false });
}
```

## 4. Dynamic-State `axe-core` WCAG 2.1 AA Scan (Light & Dark)

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
// Also scan interactive states (opened dialog / drawer / error validation) and Dark theme.
```

## 5. Layer 3B Visual Artifact Rejection Checklist

Open every rendered photograph, PNG, SVG, or Canvas plate directly with vision before passing Layer 3:
- [ ] **Zero Clip-Art / Zero Wax-Skin / Zero PowerPoint:** Zero stick/block people, zero boxy clip-art houses, zero numbered flowchart boxes or circle-icon slides, zero plastic AI skin or warped hands.
- [ ] **4-Layer Depth & Authentic Materiality:** Believable light direction, foreground/midground/background depth, tactile grain/film texture, and intricate craft (or authentic candid photography).
- [ ] **Zero Collisions & Crisp Locale Diacritics:** No letter overlaps any line/shape; Vietnamese or target-locale diacritics (`ệ, ư, ỗ, ắ, ồ`) render cleanly; `>= 6%` safe artwork margins.
- [ ] **Researched Brand Polarity & Accent Discipline:** Series faithfully matches the researched brand's light/dark polarity cadence and accent ceiling (never accidental 4/4 dark drift on a light-first brand).
- [ ] **Zero-Addition Pass 2 Completed & Provenance Saved:** Second polish pass refined existing craft without adding clutter, and `.prompt.json` provenance exists for generated rasters.

## 6. Fresh-Context Independent Finish-Reviewer Packet (English Brief)

Spawn a clean subagent with zero inherited build history using this concise English prompt:

```text
Act as an independent Finish Reviewer with zero prior bias. Inspect ONLY the provided artifacts:
1. Original Brief & Researched Brand DNA: <paths to brief + .millar/style-dna.md>
2. Mechanical Audit & Test Evidence: <millar-audit.mjs JSON + Playwright/axe results>
3. Rendered Screenshots & Visual Assets: <paths to desktop/tablet/mobile PNGs + artworks>
4. Changed Files / Diff: <paths or diff summary>

Evaluate ruthlessly along:
- Spec Fidelity (every requirement satisfied, zero unrequested scope creep)
- Engineering & Craft Floor Standards (architecture, CWV, a11y, zero AI slop)
- Cross-Page Continuity (6 axes, >= 4/5 required) & Visual Craft (>= 9.0/10, zero clip-art/wax-skin)

Return:
1. Disposition: exactly ONE of `ship` | `fix` | `rebuild` | `recapture`
2. Blocking findings (exact file/screenshot + root cause + required fix)
3. Non-blocking polish notes
```
