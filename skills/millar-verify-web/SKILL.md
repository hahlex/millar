---
name: millar-verify-web
description: "Five-layer real-browser QA, accessibility, visual continuity, and two-axis code review gate for web projects. Combines Millar MCP validate_design, Playwright interactive E2E, @axe-core/playwright WCAG 2.1 AA, cross-viewport screenshot auditing (1440px/768px/375px Light & Dark), reduced-motion testing, and Matt Pocock two-axis (Spec vs Standards) review. Use BEFORE claiming any website, page, or UI change is complete."
version: 0.1.0-draft.1
license: MIT
---

# Millar Verify Web: 5-Layer Ship-Readiness QA Gate

Never claim a website or UI change is done based on `npm run build` alone. Verify real rendered behavior, interactive controls, visual cross-page continuity, accessibility, and code quality with observed evidence before handoff.

## Track Depth Selection

- **Track S (Surgical Fix / Single Component):** Run **Layer 1** (Static & MCP Compliance) + **Layer 2** (Targeted Interactive Verification) + **Layer 5** (Focused Diff Review).
- **Track M & L (New Pages / Full Site / Redesign):** Run **ALL 5 Layers** in full, including side-by-side Flagship vs. Secondary-Page visual continuity inspection.

## The 5 Verification Layers

Read [references/five-layer-qa-gate.md](references/five-layer-qa-gate.md) for concrete Playwright, `axe-core`, and viewport commands.

### Layer 1: Static, Build & Design-System Compliance Gate
1. Run project `typecheck`, linter, unit tests, and production `build`.
2. For Hahlex projects, run Millar MCP `validate_design` (or `pnpm run check:design`) on every modified route/component, plus `check:em-dash` and `check:governance`.
3. Fix every automated error until `automatedChecks.passed === true`.

**Completion criterion:** Zero build, type, unit-test, or automated Millar validator failures.

### Layer 2: Real-Browser Functional & Interactive Gate (Playwright)
Run against the real built/served application (not mocked DOM alone):
1. Assert **0 uncaught page errors**, **0 console errors**, and **0 HTTP `>= 400` responses** across every tested route.
2. Exercise real user interactions: click navigation links, submit/validate forms, type into search/filter bars, toggle tabs/switches, open and confirm/cancel dialogs, trigger CTAs, and verify visible DOM state updates.
3. Confirm zero dead buttons or no-op sample controls exist on published pages.

**Completion criterion:** All interactive flows pass with zero console errors and zero broken network requests.

### Layer 3: Cross-Viewport Visual & Cross-Page Continuity Gate
1. Capture real browser screenshots across **`1440px` (Desktop)**, **`768px` (Tablet)**, and **`375px` (Mobile)** in **Light** and **Dark** themes (when supported).
2. Assert `0px` horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth + 1`) at every viewport.
3. Open and visually inspect captured PNGs directly. On multi-page builds (Track M & L), compare the flagship page against every secondary route using `millar-design`'s 6-axis Cross-Page Continuity Rubric (`>= 4/5` required on every axis; zero bare industrial drop-off).

**Completion criterion:** All rendered screenshots visually inspected; zero layout overflow, broken crops, contrast muddiness, or secondary-page visual drift.

### Layer 4: Accessibility, Keyboard & Reduced-Motion Gate
1. Run `@axe-core/playwright` (`wcag2a`, `wcag2aa`, `wcag21aa`) on BOTH default states AND opened dynamic states (dialogs, drawers, error alerts, Light & Dark themes) -> assert **0 critical and 0 serious violations**.
2. Verify keyboard paths: first `Tab` reveals Skip Link; `Tab` / `Shift+Tab` shows visible focus ring; `ArrowLeft`/`ArrowRight`/`Home`/`End` navigate tabs; `Escape` closes dialogs/drawers and restores focus.
3. Verify single `<main>` and top-level `<footer>` strictly outside `<main>`.
4. Emulate `prefers-reduced-motion: reduce` and confirm content renders completely visible with spatial movement stripped while state confirmation stays clear.

**Completion criterion:** Automated `axe-core`, landmark, keyboard, and reduced-motion checks pass cleanly. Always state honestly that automated checks complement rather than replace manual screen-reader (NVDA/JAWS/VoiceOver) verification.

### Layer 5: Two-Axis Code Review & Performance Hygiene Gate
Read [references/two-axis-review-rubric.md](references/two-axis-review-rubric.md) and review the diff along two unmerged axes:
- **Spec Axis:** Every user requirement satisfied, zero missing states, zero unrequested scope creep.
- **Standards Axis:** Clean deep modules, Server-First boundaries, Core Web Vitals hygiene (explicit image dimensions, LCP priority, compositor-only animations), and Fowler code-smell check.

If any layer fails, batch root-cause fixes cleanly (invoke `diagnosing-bugs` if non-obvious), re-run the failing layers, and never claim pass until re-verified.

**Completion criterion:** All applicable layers green, screenshots visually verified, and final report cites exact observed results plus any remaining human aesthetic/screen-reader sign-off items.
