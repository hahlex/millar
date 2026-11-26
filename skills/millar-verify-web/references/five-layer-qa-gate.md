# Five-Layer Web QA Gate & Standalone Audit Patterns (v0.3.0)

Use these battle-tested Zero-MCP CLI, Playwright, `@axe-core/playwright`, and Fresh-Context Independent Finish Reviewer patterns for objective, hang-free verification.

## 1. Standalone Zero-MCP Mechanical Audit (`scripts/millar-audit.mjs`)

Works out of the box with plain Node.js (`>= 18`) even when Millar MCP is NOT installed or connected:

```bash
# Audit shipping code (skips internal .millar/ notes by default; pass --include-internal to scan .millar/)
node <skill-dir>/scripts/millar-audit.mjs ./src

# Strict Zero Em-Dash + Product UI Zero-Gradient enforcement
node <skill-dir>/scripts/millar-audit.mjs ./src --register=product --strict-em-dash

# Machine-readable JSON output + optional live URL 1440/768/375 check
node <skill-dir>/scripts/millar-audit.mjs ./src --json --url=http://127.0.0.1:4173/
```

Checks enforced deterministically (`v0.3.0`):
- **WCAG 2.1 Text & SC 1.4.11 Border Contrast:** Evaluates light, dark, and stage CSS token pairs (`>= 4.5:1` text, `>= 3.0:1` UI borders) and reports exact `contrastPairsChecked` telemetry so zero-pair silent passes never slip through.
- **AI-Slop Craft Floor:** Gradient text, eyebrow kickers above `<h1>`/`<h2>` (`craft/eyebrow-kicker`), 1-sided colored border strips on rounded containers, hard offset shadows, static `opacity: 0` scroll traps, missing `prefers-reduced-motion` (in BOTH `.css` AND inline HTML `<style>`!), `[hidden]` CSS override guard, undersized `< 12px` text, missing `img` `alt` or `width`/`height`.
- **Register & Copy Rules:** Product-mode CSS gradients (`--register=product`), U+2014 em-dash (`--strict-em-dash`), and sparse inline `<svg>` clip-art heuristic.
- **Live Browser Pass (`--url`):** Resolves `playwright` / `@playwright/test` via `MILLAR_PLAYWRIGHT_PATH`, `cwd`, or ancestor workspaces with `{ channel: "chrome" | "msedge" }` fallback, and flags horizontal overflow, landmark defects, console/HTTP 4xx-5xx errors, and duplicate visible `view-transition-name` declarations (which silently abort CSS View Transitions).

## 2. Hang-Free Playwright + `@axe-core/playwright` Harness Pattern

CRITICAL: Always wrap local HTTP server + Playwright inside `try / finally { await browser.close(); server.close(); }` and ALWAYS use `browser.newContext()` (required by `@axe-core/playwright` v4.14+) + `{ channel: "chrome" | "msedge" }` fallback so QA scripts never hang or fail on missing headless-shell binaries:

```ts
let browser = null;
for (const opts of [{}, { channel: "chrome" }, { channel: "msedge" }]) {
  try { browser = await chromium.launch(opts); break; } catch { browser = null; }
}
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("pageerror", (e) => consoleErrors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("response", (r) => { if (r.status() >= 400) failedResponses.push(`${r.status()} ${r.url()}`); });

  await page.goto(route, { waitUntil: "networkidle" });
  expect(consoleErrors).toEqual([]);
  expect(failedResponses).toEqual([]);

  // Eagerly decode below-the-fold loading="lazy" images & reset scroll instantly before full-page capture!
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => img.setAttribute("loading", "eager"));
    await Promise.all(Array.from(document.images).map((img) => img.decode().catch(() => {})));
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  // Capture BOTH above-the-fold AND full-page so below-the-fold SVGs/sections are never missed!
  await page.screenshot({ path: `.millar/review/${routeName}-desktop.png`, fullPage: false });
  await page.screenshot({ path: `.millar/review/${routeName}-desktop-full.png`, fullPage: true });
} finally {
  if (browser) await browser.close();
  server.close();
}
```

## 3. Multi-Viewport Zero-Overflow & Dynamic `axe-core` Scan (Light & Dark)

Test `1440x900` (Desktop), `768x1024` (Tablet), and `375x812` (Mobile):
- Assert `document.documentElement.scrollWidth <= window.innerWidth + 1` at all three widths.
- Assert `1 <main>` and top-level `<footer>` strictly outside `<main>`.
- Run `new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()` on default AND dynamic states (opened dialogs/drawers, validation errors, Light & Dark) -> `0` critical/serious violations.
- Capture `fullPage: true` screenshots in BOTH Light AND Dark themes (not just above-the-fold Dark) so below-the-fold footer seals, dark active tabs, and SC 1.4.11 borders are visually verified.
- Add an inline SVG `<link rel="icon" href="data:image/svg+xml,...">` on standalone static HTML pages so local QA servers never fail on `/favicon.ico` 404 responses.
- Emulate `prefers-reduced-motion: reduce` and assert hero + sections render immediately at `opacity: 1`.

## 4. Layer 3B Visual Artifact & Naturalness Rejection Checklist

Open EVERY rendered photograph, illustration, PNG, SVG, or Canvas plate directly via vision (AND compare ALL plates in a series side by side!) before passing Layer 3:
- [ ] **Context-Appropriate Daylight (Zero Gloomy Classrooms):** Teaching, school, community, and daytime human scenes are genuinely bright, sunlit, and breathable with open shadows (Instant REJECT if dark, cave-like, or gloomily underexposed!).
- [ ] **Concrete Kinetic Mid-Action (Zero Frozen Poses):** People and hands are caught mid-motion performing ONE clear physical action with real lived-in props (Instant REJECT if vaguely pointing at a blank page, standing stiffly, or awkwardly hovering fingertips in mid-air!).
- [ ] **Natural Linework & Organic Print-on-Paper Integration:** Illustrations show expressive variable-weight hand-drawn strokes and breathing paper tooth (zero stiff uniform CAD or corporate Memphis); `Path H` diagrams use ink-soak `multiply` + subtle print tooth + matte foil + bare editorial typography (zero pasted web-UI pill buttons or shiny plastic 3D bevel marbles!).
- [ ] **Brand Motif & Countable Integrity (`Path H` Trigger):** Every explicit motif from `DESIGN.md` / brief is visibly elevated; every numbered step (`1..9`), arrow, brand logo geometry, and label is 100% mathematically accurate.
- [ ] **Zero Clip-Art / Zero Faux-3D / Zero Wax-Skin:** Exact 5 natural fingers per hand, real unretouched skin, zero faux-3D Canvas rooms, zero garbled handwriting text.
- [ ] **Zero Collisions, 2K Master & Dual Provenance:** No overlapping labels (`>= 18px` clearance on `2048px` plates); crisp locale diacritics (`ệ, ư, ỗ, ắ, ồ`); embedded PNG `tEXt` chunks (`scripts/embed-provenance.mjs`) + `.prompt.json` sidecar verified.

## 5. Fresh-Context Independent Finish-Reviewer Packet (English Brief)

Spawn a clean subagent with ZERO inherited build history using this concise English prompt:

```text
Act as an independent Finish Reviewer with zero prior bias. Inspect ONLY the provided artifacts:
1. Original Brief & Researched Brand DNA: <paths to brief + .millar/style-dna.md>
2. Mechanical Audit & Test Evidence: <millar-audit.mjs JSON + Playwright/axe results>
3. Rendered Screenshots (above-the-fold AND full-page at 1440/768/375) & All Visual Assets: <paths>
4. Changed Files / Diff: <paths or diff summary>

Evaluate ruthlessly along:
- Spec Fidelity (every requirement satisfied, zero unrequested scope creep)
- Engineering & Craft Floor Standards (WCAG SC 1.4.11 borders, CWV, a11y, zero eyebrow kickers, zero AI slop)
- Cross-Page Continuity (6 axes, >= 4/5 required) & Visual Craft (>= 9.2/10, zero faux-3D/clip-art/wax-skin)

Return:
1. Disposition: exactly ONE of `ship` | `fix` | `rebuild` | `recapture`
2. Blocking findings (exact file/screenshot + root cause + required fix)
3. Non-blocking polish notes
```
