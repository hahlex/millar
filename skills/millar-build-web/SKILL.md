---
name: millar-build-web
description: "Production frontend engineering and web architecture skill (v0.4.0) synthesizing Matt Pocock deep-module / TDD vertical-slice discipline, Vercel impact-ordered React 19 / Next.js performance hierarchy (zero waterfalls, lean bundles, useActionState, scheduler.yield, LoAF), modern native CSS (@container, Popover API, Anchor Positioning), Agency Agents minimal-change restraint, Millar MCP tokens/primitives, Core Web Vitals (LCP/INP/CLS), semantic HTML, and frontend security defaults. Use when implementing web pages, components, layouts, forms, tables, or refactors."
version: 0.4.0-draft.1
license: MIT
---

# Millar Build Web: Production Frontend Architecture & Execution

Turn locked design specs (`.millar/style-dna.md` and Millar MCP tokens/components) into clean, testable, fast, accessible web code with zero placeholders, zero dead controls, and zero scope creep.

## Operating Modes

- **Minimal-Change Mode (Track S):** When fixing a bug or modifying one component, touch strictly the files required by the task. Prefer three clear local lines over premature abstractions; never rewrite unrelated working code.
- **Vertical-Slice Build Mode (Track M & L):** Build feature-by-feature end-to-end (shared tokens & shell -> flagship route -> secondary routes -> interactive data/forms -> unit tests) using **deep modules** (small clean interfaces hiding internal complexity behind explicit seams).

## Execution Sequence

### Step 1: Ground in Tokens, Primitives & Module Seams

Before creating files:
1. Read `.millar/style-dna.md` (if present) and inspect the target repository's existing stack, tokens, and folder conventions.
2. For Hahlex repositories, call Millar MCP (`get_design_tokens`, `search_components` -> `get_component`, `search_sections` -> `get_section`) to use canonical CSS variables and verified component props instead of guessing.
3. Read [references/web-architecture-checklist.md](references/web-architecture-checklist.md) and plan clean **Server vs. Client boundaries** and **deep module seams** (accept dependencies at real seams; separate pure business/formatting logic from view markup so logic is unit-testable without DOM flakiness).

**Completion criterion:** File map, token imports, Server/Client leaves, and module interfaces are clear before editing.

### Step 2: Implement Shared Tokens, Shell & Browser Chrome First

Establish the shared visual foundation once so every route inherits it automatically:
- Bind semantic CSS variables (`--bg-*`, `--fg-*`, `--border-*`, `--accent*`, `--duration-*`, `--ease-*`) across Light and Dark themes.
- Theme browser surfaces (`::selection`, `caret-color`, `:focus-visible` 2px ring + offset, `text-underline-offset`, `tabular-nums`, `:root:lang(vi)` Vietnamese diacritic headroom).
- Keep exactly one `<main>` landmark and place site `<footer>` strictly outside `<main>`, preceded by a keyboard-accessible "Skip to main content" link.

**Completion criterion:** Shared layout shell and token stylesheet compile cleanly across desktop, tablet, and mobile breakpoints.

### Step 3: Build Pages & Interactive Vertical Slices

Implement every route and component against these non-negotiable engineering rules:

1. **Server by Default, Client at the Leaves:** In Next.js App Router / RSC stacks, keep layouts, pages, and data loaders as Server Components; push `"use client"` down to the smallest interactive leaves and pass server subtrees via `children` slots.
2. **Real Interactivity & 5 Mandatory UI States:** Every button, filter, tab, form, search box, and dialog MUST actually work (zero `() => {}` no-op handlers on published controls). Handle `default`, `loading` (solid zero-gradient skeleton on Hahlex Product UI), `empty` (with clear recovery CTA), `error` (`role="alert"` + retry path), and `disabled` states.
3. **Async Safety & Keyboard Contracts:** Guard async submissions with `aria-busy` double-click locking; honor WAI-ARIA APG keyboard contracts (`Tab`, `Enter`/`Space`, `Escape` closing overlays with focus restore, Arrow/Home/End on tabs).
4. **Impact-Ordered Performance, Modern CSS & Security Built In:** Read [references/seo-cwv-and-copy.md](references/seo-cwv-and-copy.md). Eliminate async waterfalls (`Promise.all()`, `<Suspense>` streaming) and wholesale barrel imports before micro-tuning; prefer native `@container`, `[popover]`, `<dialog>`, and CSS Anchor Positioning over heavy JS layout libraries; use React 19 `useActionState`/`useTransition` and `scheduler.yield()` to hold INP `< 200ms`; set explicit media dimensions (prevent CLS) and `fetchPriority="high"` on LCP media; enforce `rel="noopener noreferrer"`, zero unsanitized HTML sinks, and zero secrets in `NEXT_PUBLIC_*`/`VITE_*`.
5. **TDD for Domain Logic:** For pricing calculators, validators, filter engines, parsers, or formatters, write failing unit tests first (red -> green -> refactor) through the module's public interface.
6. **Hardening Handoff:** When touching auth, API integrations, or performance-critical paths, pair with `millar-diagnose-and-harden` (`npx millar harden <path>`) before shipping.

**Completion criterion:** All planned routes and interactive controls work end-to-end with zero placeholder copy, zero hardcoded hex overrides (when token system exists), and passing unit tests.

### Step 4: Self-Check Before Handoff to `millar-verify-web`

Run fast local checks immediately:
- `typecheck` (0 TypeScript errors)
- unit tests (`vitest` / `jest`)
- production build (`next build` / `vite build`)
- Millar MCP `validate_design` on every edited UI file (for Hahlex projects).

Hand off immediately to `millar-verify-web` for real-browser QA, accessibility, and cross-page visual verification.

**Completion criterion:** Build, typecheck, unit tests, and static `validate_design` are green; codebase is ready for real-browser verification.
