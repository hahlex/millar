# Millar Design System (`DESIGN.md`)

**Millar** is the official, product-agnostic design language for the **Hahlex** ecosystem. One W3C DTCG `2025.10` Single Source of Truth (`tokens/`) compiles into CSS variables, Tailwind v4 `@theme inline`, Ant Design 6 literal mirrors, the Millar Portal (`hahlex.com/millar`), and the Millar MCP Server (`@hahlex/millar-mcp`).

> **Lifecycle status (`v0.1.0`)**: All newly authored Millar entries remain `draft` until explicit human sign-off promotes them to `approved`.

## Visual Philosophy: Measured Warmth

Tactile editorial warmth paired with analytical Swiss precision. Every surface must look calm, intentional, and visually complete on initial paint (`0%` scroll) with zero photography, zero video, and zero animation required.

- Read [`docs/art-direction/measured-warmth-philosophy.md`](docs/art-direction/measured-warmth-philosophy.md) when designing brand visuals, posters, or new Marketing Visual Assets.

## Three-Tier Architecture

1. **Shared Foundations** (`tokens/`, `@hahlex/millar-tokens`, `assets/brand/`): Product-agnostic brand identity, typography, OKLCH Warm Sand/Bronze/Espresso/Status/Data-Viz tokens, spacing, radius, surface roles, 1.5px semantic iconography, and WCAG 2.1/2.2 AA contrast contracts (`84/84` automated checks passing, Machado protan/deutan minimum Delta-E `11.13`).
2. **Marketing Register** (`@hahlex/millar-marketing`): Persuade & Experience surfaces built around **6 diverse Composition Patterns**, **14 code-native Visual Assets** (SVG, CSS, HTML5 Canvas, React), Expressive Motion presets, **10 Marketing Sections**, **2 Marketing Page Templates**, and Visual Do's & Don'ts.
3. **Product/App Register** (`@hahlex/millar-ui`): Operate & Execute surfaces built around crisp 1-glance scannability, accessible UI primitives, WAI-ARIA APG keyboard contracts, zero-scrollbar `DataTable`, Ant Design 6 adapter, and **2 Application Templates**.
4. **Optional Domain Extensions** (`@hahlex/millar-domain-education`): Vertical-specific semantics (such as IELTS 4-skill palettes and learner passage highlights) plug in outside Shared Foundations so Millar scales across future Hahlex products.

## Non-Negotiable Invariants

- **Brand Identity**: Render the single canonical normalized Arch + 3 Pillars Vector Brand Mark (`assets/brand/hahlex-mark-{color,on-light,on-dark,monochrome}.svg`) paired with Title Case **`Hahlex`** in `Geist` `600` (`-0.02em` tracking, `text-transform: none`).
- **Unified Typography**: Use `Geist Sans` (`300-400` Display `>= 28px`; `500-600` operational headings `16-22px`), `Inter` (Body/UI + optional slim `opsz 24` assistant threads), and `Geist Mono` (code, spec IDs, tabular numerals). Apply `:root:lang(vi)` widened line-heights and `.line-mask` headroom so Vietnamese diacritics never clip. Enforce `12px` (`--text-micro`) minimum text floor and `tabular-nums` on all numeric metrics.
- **Register-Scoped Gradient Policy**:
  - **Product UI & Foundations**: Use solid Millar surface tokens and 1px warm-sand borders exclusively; CSS gradients are forbidden.
  - **Marketing**: Use solid Warm Cream (`--bg-editorial`) and Deep Espresso (`--bg-stage-dark`) stages by default. Gradients are permitted strictly inside explicitly approved Visual Assets (`gradientPolicy: "approved-visual-asset"`, such as `WarmHorizonWash`); raw decorative gradients, neon glows, and frosted glassmorphism are forbidden.
- **Color & Contrast Safety**: Consume semantic CSS variables (`var(--bg-surface)`, `var(--fg-default)`, `var(--accent)`, `var(--fg-accent)`, `var(--accent-on-stage-dark)`). Pair `--accent-soft` exclusively with `--fg-on-accent-soft` (`7.69:1` AAA; never `--fg-accent` on `--accent-soft`). Use outlined danger buttons (`var(--status-error)` on `var(--bg-surface)`) in dark mode. Reserve Crimson strictly for errors, friction callouts, and destructive actions.
- **Composition Diversity (Marketing)**: Vary section pacing across all 6 Composition Patterns (`editorial-split`, `spatial-product-stage`, `architectural-grid`, `narrative-sequence`, `typographic-poster`, `bento-mosaic`) instead of repeating equal 3-column card grids or duplicate fake chatboxes.
- **Semantic Landmarks & Accessibility**: Keep a single top-level `<main>` and a top-level `<footer>` strictly outside `<main>`. Provide visible `2px` `--focus-ring` indicators, `>= 24x24px` touch targets, `role="alert"` on validation errors, and static-first `prefers-reduced-motion: reduce` fallbacks.
- **Zero Em-Dash (`U+2014`) Scope**: Use `:`, `.`, `,`, `·`, parentheses, or `-` in all Hahlex-controlled UI, documentation, and brand copy. Preserve user-authored data, direct quotes, and third-party resources verbatim.

## Context Pointers (Read When Needed)

- **Tokens, DTCG `2025.10`, Tailwind v4 & AntD 6 mirrors**: Read [`docs/adr/0001-dtcg-2025-10-terrazzo-ssot.md`](docs/adr/0001-dtcg-2025-10-terrazzo-ssot.md).
- **Brand, typography, gradient & em-dash decisions**: Read [`docs/adr/0002-brand-typography-and-gradient-boundaries.md`](docs/adr/0002-brand-typography-and-gradient-boundaries.md).
- **Portal hosting & mandatory CMS origin isolation before `hahlex.com/millar` launch**: Read [`docs/adr/0003-portal-deployment-and-cms-origin-isolation.md`](docs/adr/0003-portal-deployment-and-cms-origin-isolation.md).
- **MCP Resources, 11 Tools & automated vs. aesthetic validation split**: Read [`docs/adr/0004-mcp-architecture-and-validation-split.md`](docs/adr/0004-mcp-architecture-and-validation-split.md).
- **Zero-photo Marketing compositions & asset metadata schema**: Read [`docs/adr/0005-marketing-composition-diversity-and-zero-photo-craft.md`](docs/adr/0005-marketing-composition-diversity-and-zero-photo-craft.md).
- **Canonical Millar terminology**: Read [`GLOSSARY.md`](GLOSSARY.md).
- **Production cutover & product migration playbooks**: Read [`docs/integration/production-cutover-and-adoption.md`](docs/integration/production-cutover-and-adoption.md).
