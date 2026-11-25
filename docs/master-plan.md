# Millar (Hahlex Design System): Master Plan

> **Status**: `Accepted Execution Plan` (Decisions Q1-Q8 Approved 2026-11-25)  
> **Standalone Repository**: `d:\projects\millar`  
> **Official Target URL**: `hahlex.com/millar` (Public cutover gated on CMS origin isolation; see [ADR-0003](adr/0003-millar-hosting-and-cookie-isolation.md))

---

## 1. Locked Governance & Decision Summary (Q1-Q8)

| Decision | Locked Standard | Enforcement Mechanism |
| :--- | :--- | :--- |
| **Q1 Typography** | `Geist Sans` (`300-400` display, `500-600` small headings) + `Inter` + `Geist Mono` across Shared, Product & Marketing; `:root:lang(vi)` diacritic safety | DTCG tokens, CSS/Tailwind v4 output, `validate_design` |
| **Q2 Gradients** | **Forbidden** in Product UI & Foundation components. **Permitted** in Marketing ONLY inside purposeful, explicitly approved Visual Assets (`gradientPolicy: "approved-visual-asset"`). Never arbitrary UI decoration | `validate_design` register-aware rule + registry metadata |
| **Q3 Brand Identity** | One canonical Vector Brand Mark SVG (4 variants + PWA icons) + Title Case **`Hahlex`** wordmark in **`Geist 600`** | Canonical SVG SSoT + downloadable Portal brand kit |
| **Q4 Zero Em-Dash** | Zero `U+2014` on Hahlex-controlled UI, docs, and brand copy. Never mutate/flag user data, direct quotes, or third-party resources | `check:em-dash` CI script + `validate_design` (`sourceKind` boundary) |
| **Q5 Repository** | Independent monorepo at `d:\projects\millar` (outside Obsidian Vault) | Standalone git repo, pnpm workspaces |
| **Q6 Deployment** | `hahlex.com/millar` via independent Cloudflare Worker; **mandatory CMS origin isolation before public launch** (CSP is defense-in-depth only, NOT a substitute for origin isolation) | `apps/portal` `basePath: "/millar"` + Phase 7 Cutover Gate |
| **Q7 MCP Server** | 11 Tools + `millar://` Resources + 3 Prompts; verified across major MCP clients; `validate_design` splits deterministic automated checks vs. human aesthetic review criteria | `@hahlex/millar-mcp` + cross-client integration test suite |
| **Q8 Art Direction & Delivery** | Phase 0-7 sequential execution with verification gate per phase; zero placeholders; 6 diverse Marketing Composition Patterns + full code-native Visual Assets, Motion, Sections, Templates, Interactive Playground, Visual Do/Don't | Per-phase Vitest, Playwright, `axe-core`, visual inspection, 2-axis code review |

---

## 2. Lifecycle & Governance Rules

- **Lifecycle States**: `draft` -> `approved` -> `deprecated`.
- **AI Agent Guardrail**: AI agents author new standards strictly as `draft`. Promoting `draft -> approved` requires human sign-off (`approvedBy`, `approvedAt`) verified by CI (`pnpm check:governance`).
- **Zero Production Side-Effects**: Neither `d:\projects\hahlex-edu` nor `d:\projects\education-portfolio` is edited during Phases 0-7.
- **Zero Fake Sitemap**: Every route, component, visual asset, section, and template exposed in Millar Portal and MCP has real rendered code, previews, guidelines, responsive rules, and tests.

---

## 3. Sequential Execution Phases & Mandatory Verification Gates

| Phase | Scope & Deliverables | Mandatory Verification Gate (Must Pass Before Next Phase) |
| :--- | :--- | :--- |
| **Phase 0** | Sync accepted ADRs/Master Plan; bootstrap standalone pnpm monorepo `d:\projects\millar`; strict TypeScript, Vitest, ESLint, `check:em-dash`, `check:governance`; clean Obsidian vault pointer | `pnpm typecheck`, `pnpm check:em-dash`, `pnpm check:governance`, clean git commit on `main` |
| **Phase 1** | Canonical Vector Brand Mark SVGs + Wordmark; full W3C DTCG `2025.10` token sets (`base`, `light/dark`, `product/marketing`, `vi`, `education` extension); deep `@hahlex/millar-core` compiler -> `@hahlex/millar-tokens` (CSS, Tailwind v4 `@theme inline`, TW v3 preset, TS/AntD literal mirrors, DTCG JSON) | TDD seam tests PASS: DTCG schema valid, 100% WCAG 2.1 AA contrast across Light/Dark x Product/Marketing, Machado protan/deutan ΔE >= threshold, `@theme inline` verified |
| **Phase 2** | `@hahlex/millar-ui` accessible Product primitives (fixing all `hahlex-edu` P0/P1/P2 audit bugs) + AntD 6 Theme Adapter + semantic `lucide-react` 1.5px icon registry + co-located `*.meta.ts` + `@hahlex/millar-domain-education` | Vitest + Testing Library + `axe-core` + keyboard operability tests PASS for every primitive; registry build extracts all component specs cleanly |
| **Phase 3** | `@hahlex/millar-marketing`: Visual Language & Art Direction, **6 diverse Composition Patterns**, 13 code-native Visual Assets (CSS/SVG/Canvas/React, incl. approved purposeful Marketing tonal asset), Productive+Expressive Motion Library, 11 Marketing Sections, 7 Complete Page/App Templates, Visual Do's & Don'ts + `*.meta.ts` | Unit + render + `axe-core` + reduced-motion static-first tests PASS; full SSoT `millar-registry.json` compiles cleanly with 0 missing metadata fields |
| **Phase 4** | `apps/portal` (`hahlex.com/millar`): Full Design System Portal (Homepage, Foundations, Marketing, Product, Resources, Interactive Design Playground, Visual Asset Gallery, EN/VI Typography Specimens, Searchable Token Explorer, Viewport Section/Template Previews, Copyable Code, Brand Downloads, `Cmd+K` Search, Light/Dark, Changelog/Versioning, Lifecycle Badges, strict CSP) | `pnpm --filter @hahlex/millar-portal build` succeeds cleanly with 0 errors, 0 third-party scripts, 0 fake/empty pages |
| **Phase 5** | `@hahlex/millar-validator` (automated vs. human-aesthetic split) + `@hahlex/millar-mcp` (MCP `2026-07-28`: `millar://` Resources, 11 Tools, 3 Prompts, stdio + Streamable HTTP) | End-to-end MCP client integration tests PASS (InMemory + stdio); cross-client JSON Schema compatibility check PASS; negative `validate_design` & `-32602` tests PASS |
| **Phase 6** | Playwright E2E + `@axe-core/playwright` + Keyboard-Only Pass + Visual Screenshots (Desktop `1440px`, Tablet `768px`, Mobile `375px`, Light/Dark, EN/VI, `reducedMotion: "reduce"`) + 2-Axis Matt Pocock Code Review (Standards + Spec) | 0 Playwright failures, 0 Critical/Serious `axe-core` violations, visual screenshots inspected and verified crisp, 2-axis code review blockers resolved |
| **Phase 7** | Concise agent-ready `DESIGN.md` & `AGENTS.md` (following `writing-for-agents`), `README.md`, `CHANGELOG.md`, Integration & Cutover Guides (incl. mandatory CMS origin isolation gate before `hahlex.com/millar` public launch, `hahlex-edu` adoption guide, `education-portfolio` migration guide, MCP client setup for Claude/Cursor/VS Code/Antigravity) | Final full workspace `pnpm verify` (compile + typecheck + test + build + em-dash + governance + Playwright) 100% GREEN |
