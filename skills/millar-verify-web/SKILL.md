---
name: millar-verify-web
description: "Five-layer real-browser QA, standalone Zero-MCP mechanical auditor (scripts/millar-audit.mjs v0.4), fresh-context independent finish-reviewer protocol, WCAG 2.2 AA (SC 1.4.11 borders, SC 2.5.8 target size, SC 2.4.11 focus visibility), CWV/CLS & security-hygiene checks, anti-clip-art/anti-faux-3D/anti-wax-skin visual audit, and two-axis code review gate (v0.4.0). Works anywhere via npx millar install even without Millar MCP connected. Use BEFORE claiming any website, artwork series, or UI change is complete."
version: 0.4.0-draft.1
license: MIT
---

# Millar Verify Web v0.4: 5-Layer QA, Zero-MCP Mechanical Auditor & Independent Finish Review

Never claim a website, artwork series, or UI change is done based on `npm run build` alone, and never rely solely on self-praise from the same conversation that wrote the code. Combine **deterministic Zero-MCP mechanical checks** (`scripts/millar-audit.mjs`), real-browser Playwright & `axe-core` verification, and a **Fresh-Context Independent Finish Reviewer** (`Impeccable` zero-bias discipline).

## Track Depth Selection

- **Track S (Surgical Fix / Single Component):** Run **Layer 1** (Build + `scripts/millar-audit.mjs` + MCP `validate_design` if active) + **Layer 2** (Targeted Interactive Check) + **Layer 5** (Focused 2-Axis Diff Review).
- **Track M & L (Secondary Pages / Full Site / Redesign):** Run **ALL 5 Layers**, including standalone `millar-audit.mjs`, `1440`/`768`/`375` Light & Dark captures, **Layer 3B Visual Artifact Critique**, and **Fresh-Context Independent Finish Reviewer** sign-off.

## The 5 Verification Layers

Read [references/five-layer-qa-gate.md](references/five-layer-qa-gate.md) for executable CLI, Playwright, `axe-core`, and reviewer packet commands.

### Layer 1: Static Build, Standalone Zero-MCP Mechanical Audit & Brand Compliance Gate
1. Run project `typecheck`, linter, unit tests, and production `build`.
2. **Run Standalone Mechanical Auditor (Zero MCP Required!):** Execute the bundled zero-dependency Node CLI right from this skill directory:
   ```bash
   node <skill-dir>/scripts/millar-audit.mjs <target-dir-or-file> [--register=marketing|product|shared] [--strict-em-dash] [--json]
   ```
   Catches deterministically (`v0.4.0`): WCAG 2.1/2.2 color-pair contrast failures, SC 1.4.11 UI border contrast, stripped focus outlines (`a11y/focus-outline-removed`), live WCAG 2.2 SC 2.5.8 target size (`< 24x24px`) & CLS (`> 0.1`), gradient text, 1-sided rounded-box bars, hard offset shadows, static `opacity: 0` scroll traps, missing `prefers-reduced-motion`, undersized UI text, missing `img` `alt`/`width`/`height`, hero `loading="lazy"` LCP traps, heavy barrel imports (`perf/barrel-import`), unsafe `target="_blank"` / HTML sinks, Product-mode CSS gradients, em-dash (`U+2014`) violations, and sparse inline `<svg>` clip-art illustrations!
3. If Millar MCP (or another brand MCP) is connected for the target brand, ALSO run `validate_design` and fix every automated violation until `passed === true`.

**Completion criterion:** Zero build/type errors, `millar-audit.mjs` exits `0` (zero blocking errors), and connected MCP compliance checks pass.

### Layer 2: Real-Browser Functional & Interactive Gate (Playwright)
Run against the real built/served site (or pass `--url http://127.0.0.1:<port>` to `millar-audit.mjs` when Playwright is installed):
1. Assert **0 uncaught page errors**, **0 console errors**, and **0 HTTP `>= 400` responses** across every route.
2. Exercise real controls: navigation links, form validation/submission, search/filters, tabs/switches, dialogs (open/confirm/Escape), and primary CTAs, verifying visible DOM state updates.
3. Confirm zero dead buttons or no-op demo widgets.

**Completion criterion:** Every interactive flow passes with zero console/page errors and zero failed requests.

### Layer 3: Cross-Viewport Visual, Anti-Clip-Art & Cross-Page Continuity Gate
1. Capture real screenshots at **`1440px` (Desktop)**, **`768px` (Tablet)**, and **`375px` (Mobile)** in **Light** and **Dark** themes (when supported) with motion settled (`prefers-reduced-motion` or post-settle).
2. Assert `0px` horizontal overflow (`scrollWidth <= innerWidth + 1`) at every viewport.
3. **Layer 3A (Cross-Page Continuity):** Compare flagship page vs. EVERY secondary route using `millar-design`'s 6-axis Cross-Page Continuity Rubric (`>= 4/5` required on every axis; zero bare industrial drop-off).
4. **Layer 3B (Harsh Art Critic & Visual Artifact Rejection Gate):** Inspect EVERY rendered photograph, PNG, SVG, and editorial plate directly via vision:
   - **Auto-Reject & Route Back to `millar-create-image` Pass 2** if ANY visual exhibits: AI wax-skin / fake stock smiles / mangled hands, flat geometric clip-art humans/houses, PowerPoint workflow boxes or circle-icon slides, flat vector fills under thin outlines, overlapping text/strokes, clipped diacritics (`ệ, ư, ỗ, ắ, ồ`), cramped margins (`< 6%`), missing provenance sidecar, OR polarity/accent drift against the **researched Brand DNA**.
   - Every flagship/editorial visual MUST clear **`>= 9.0 / 10`** craft before shipping.

**Completion criterion:** Valid screenshots & standalone artworks visually inspected; zero overflow, zero clip-art/wax-skin defects, every visual `>= 9.0/10`, and every secondary route `>= 4/5` continuity.

### Layer 4: Accessibility (WCAG 2.2 AA), Keyboard & Reduced-Motion Gate
1. Run `@axe-core/playwright` (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`) on default AND dynamic states (opened dialogs, drawers, validation errors, Light & Dark) -> assert **0 critical and 0 serious violations**.
2. Verify WCAG 2.2 interactive ergonomics: minimum `24x24px` target size (SC 2.5.8; `>= 44x44px` on mobile touch targets), focused controls never obscured by sticky headers/footers/FABs (SC 2.4.11 via `scroll-margin-top`), first `Tab` reveals Skip Link, visible `:focus-visible` ring, `ArrowLeft`/`ArrowRight`/`Home`/`End` on tabs, and `Escape` closes dialogs/drawers with focus restore.
3. Verify landmarks: exactly `1 <main>`, top-level `<footer>` strictly outside `<main>`.
4. Emulate `prefers-reduced-motion: reduce` and confirm all content renders visible immediately (`opacity: 1`) with spatial travel stripped.

**Completion criterion:** Automated `axe-core`, landmark, keyboard, and reduced-motion checks pass cleanly. Always state honestly that automated checks complement rather than replace manual screen-reader (NVDA/JAWS/VoiceOver) verification.

### Layer 5: Fresh-Context Independent Finish Review (Zero Self-Grading Bias!)
Read [references/two-axis-review-rubric.md](references/two-axis-review-rubric.md).

**Independent Reviewer Protocol (`Impeccable` Core Discipline):**
Whenever your host harness supports spawning subagents (`invoke_subagent`, Claude subagent, Codex subagent), **NEVER self-certify Layer 3B + Layer 5 inside the build thread**. Spawn a **FRESH read-only subagent with ZERO inherited build transcript**, passing a concise English review packet containing ONLY:
1. Original user brief + researched Brand DNA (`.millar/style-dna.md` / `.millar/research-dossier.md`).
2. `millar-audit.mjs` JSON output + build/E2E test results.
3. Paths to captured screenshots (`1440`/`768`/`375`) and generated visual artworks.
4. The git diff / changed file paths.

Ask the fresh reviewer to score BOTH unmerged axes (**Spec Fidelity** vs. **Engineering & Craft Standards**) plus Layer 3A/3B visual craft, and return exactly ONE disposition word:
- **`ship`:** Zero blocking findings; report exact verified scope honestly.
- **`fix`:** Concrete list of material defects -> apply ALL fixes in ONE clean batch, re-run `millar-audit.mjs` + recapture, and verify fixes resolved.
- **`rebuild`:** Wholesale visual/artistic failure (e.g., clip-art regression, broken polarity, template collapse) -> re-author affected regions/plates cleanly before a fresh full review.
- **`recapture`:** Invalid/blank/mid-animation screenshots -> recapture valid evidence first.

*(If the host runtime has no subagent tool, perform an explicit fresh-eyes audit stepping completely outside builder framing and disclose single-thread review honestly in one line.)*

**Completion criterion:** All applicable layers green, `millar-audit.mjs` passing, screenshots visually verified, and Independent Finish Reviewer returns `ship` (or open items disclosed transparently).
