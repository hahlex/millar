---
name: millar-design
description: "Flagship design director and cross-page aesthetic continuity skill for Hahlex and custom web/app projects. Use when designing, redesigning, or extending websites, landing pages, product apps, or multi-page interfaces; especially when syncing secondary pages to existing hero imagery, custom animations, or brand references so secondary pages never collapse into generic industrial layouts. Combines Millar MCP tokens/components/validation with composable millar-deep-research, millar-create-image, and millar-animation skills."
version: 0.1.0-draft.1
license: MIT
---

# Millar Design: Flagship Art Direction & Cross-Page Continuity

Act as an integrated five-role design studio (Brand Guardian, UI Designer, UX Architect, Visual Storyteller, Motion Choreographer). Produce finished, multi-page craft where every route shares one unmistakable visual world instead of drifting into generic industrial screens.

## Core Principles

1. **The brief and supplied assets win.** User-provided images, animations, eras, materials, or palettes are binding visual truth. Propagate their visual DNA across every page; never override them with safe defaults.
2. **Sync visual worlds, never fonts alone.** Sharing a typeface and primary hex across pages while dropping secondary routes into flat border-box cards is failure. Every secondary page inherits surface materiality, lighting temperature, framing geometry, composition rhythm, motion physics, and micro-detail signatures.
3. **Scale craft to visitor mode.** Match ambition to each route's job: `Persuade` (landing, pricing, campaign), `Experience` (showcase, gallery, storytelling), `Operate` (app workspace, dashboard, editor), `Read` (docs, blog, changelog). On `Operate` and `Read`, craft appears as density discipline, tactile precision, and calm hierarchy.
4. **Philosophy before pixels.** Lock a written Aesthetic Philosophy and 12-axis Style DNA Contract before writing layout code or generating assets.
5. **Verify rendered truth.** Judge multi-page parity by inspecting live screenshots across routes and viewports, not by reading CSS in isolation.

## Composable Skill Suite & Millar MCP Routing

Invoke companion skills and Millar MCP tools on demand:

| Need | Skill or MCP Call |
|---|---|
| Decode user intent, extract visual DNA from user images/animations, or benchmark styles | Load `millar-deep-research` (or MCP `get_skill("millar-deep-research")`) |
| Generate style-locked photography, illustrations, or code-native SVG/Canvas editorial plates | Load `millar-create-image` (or MCP `get_skill("millar-create-image")`) |
| Research, choreograph, and implement matching animations, transitions, and micro-interactions | Load `millar-animation` (or MCP `get_skill("millar-animation")`) |
| Pull Hahlex tokens, UI primitives, photo-free Marketing sections, or 14 code-native assets | Call Millar MCP: `get_design_guidelines`, `get_design_tokens`, `get_component`, `get_visual_assets`, `search_sections` |
| Run deterministic compliance audit (gradients, tokens, contrast, em-dash, a11y) | Call Millar MCP: `validate_design` |

## Execution Sequence

### Step 1: Classify Starting State & Inventory Truth

Inspect the repository, user prompt, existing routes, supplied images, and supplied animations. Classify the project into one of three branches:

- **Branch A (Existing Hero / User-Supplied Images or Animations):** User brought visual assets, motion files, or an already-styled flagship page and needs more pages or full-site buildout. Run `millar-deep-research` visual extraction BEFORE coding any secondary route.
- **Branch B (Hahlex Ecosystem / Photo-Free Millar):** Building Hahlex surfaces with no external photos. Call Millar MCP (`get_design_guidelines`, `get_design_tokens`, `get_visual_assets`, `search_sections`) to bind Warm Sand + Deep Espresso + Hahlex Crimson (`< 1.5%` tension budget) and the 6 Composition Patterns.
- **Branch C (Greenfield Custom Brand):** New visual world requested. Read [references/aesthetic-movements.md](references/aesthetic-movements.md) to pick or synthesize an authentic movement anchored to the audience's real culture, never category cliches.

**Completion criterion:** Starting branch declared, every user-supplied asset and target route inventoried, and Visitor Mode assigned per route.

### Step 2: Author and Lock `.millar/style-dna.md`

Read [references/style-dna-contract.md](references/style-dna-contract.md) and write `.millar/style-dna.md` (or update it when extending an existing site). Lock all 12 axes:

1. Aesthetic Movement Name (1-2 words) + concise 4-paragraph Visual Philosophy manifesto.
2. Route-by-route Visitor Mode map (`Persuade` / `Experience` / `Operate` / `Read`).
3. Color temperature, surface polarity cadence, and accent proportion budgets (zero raw gray on warm grounds).
4. Surface materiality and single-elevation rule (1px hairline border OR lifted offset shadow, never double-bordered ghost cards).
5. Typography scale, optical tracking, `65-75ch` reading measure, `tabular-nums`, and `:lang(vi)` Vietnamese diacritic headroom when Vietnamese copy is present.
6. Media and graphic framing rules (aspect ratio, corner radius, border treatment, lighting direction, matte contrast).
7. Section composition pattern rotation (zero back-to-back identical layouts).
8. **Secondary-Page Richness Contract**: specify the exact bespoke focal element, surface cadence, and visual treatment for EVERY secondary route so no page drops to bare industrial scaffolding.
9. Motion physics signature (easing curves, spring parameters, View Transitions / route bridges, `prefers-reduced-motion`).
10. Browser surface theming (`::selection`, caret color, focus ring, custom scrollbar, underline offset).
11. Copy voice and anti-cliche rules (product language, zero arbitrary eyebrow kickers, zero `U+2014` em-dash on Hahlex surfaces).
12. Accessibility and responsive floor (WCAG 2.1 AA contrast, APG keyboard contracts, 0px horizontal overflow at 375px / 768px / 1440px).

**Completion criterion:** `.millar/style-dna.md` exists and every planned route has an explicit focal visual plan and composition sequence.

### Step 3: Produce Missing Visuals & Motion Specs Before Page Assembly

Never leave empty boxes, generic gradient blobs, or mismatched stock images on secondary routes:

- If secondary pages need imagery, illustrations, or diagram plates matching Page 1, run `millar-create-image` using the locked 80% Style DNA prefix from `.millar/style-dna.md`.
- If routes need matching transitions, scroll pacing, or tactile micro-interactions, run `millar-animation` to lock the motion thesis and token curves.

**Completion criterion:** Every route's focal visual asset (supplied, generated, or code-native SVG/Canvas/chrome) and motion primitives are ready on disk or in components.

### Step 4: Build with Craft Floor Discipline

Build shared layout shells, tokens, and browser-surface styling first, then implement routes in order. Enforce this non-negotiable floor on every page:

- **Layout:** Vary composition grammar between consecutive sections (Editorial Split, Spatial Stage, Architectural Grid, Asymmetric Bento, Typographic Poster, Narrative Sequence). Reject equal 3-column icon-plus-title-plus-paragraph card spam and nested cards.
- **Hierarchy:** Headings carry weight without eyebrow kickers; more space above headings than below; real domain copy instead of filler.
- **Gradients:** On Hahlex Product/App surfaces and shared foundation primitives, CSS gradients are strictly forbidden. On Marketing surfaces, allow gradients only inside explicitly approved atmospheric visual assets (`WarmHorizonWash` or brief-pinned atmospheric layers).
- **Interactive truth:** Every published control, filter, tab, dialog, and CTA implements real working hover, focus-visible, active, disabled, loading, empty, and error states.
- **Icon consistency:** One drawn icon system with constant stroke weight (1.5px Lucide or authored SVG); never emoji or Unicode glyphs as UI icons.

**Completion criterion:** All routes compile with zero TypeScript/build errors and real interactive states.

### Step 5: Cross-Page Visual Continuity & Compliance Audit

Read [references/cross-page-sync-audit.md](references/cross-page-sync-audit.md) and verify BOTH machine rules and visual parity:

1. Run Millar MCP `validate_design` (or `pnpm run check:design`) on each built route and resolve all automated violations.
2. Render and capture screenshots of the flagship route alongside EVERY secondary route at desktop (`1440px`) and mobile (`375px`), plus Light and Dark themes if supported.
3. Score each secondary route across all 6 Cross-Page Continuity axes (1-5). Any route scoring below `4/5` on any axis (e.g. feeling flatter, emptier, or more industrial than the flagship page) MUST be elevated in a focused polish pass before completion.

**Completion criterion:** Zero automated compliance failures, zero broken/overflowing viewports, and every secondary route passes the `>= 4/5` Cross-Page Continuity audit against the flagship page.
