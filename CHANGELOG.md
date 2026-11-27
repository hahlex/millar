# Changelog

All notable changes to **Millar** (Hahlex Design System) are documented here following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/).

## [0.7.0-draft.1 / MCP 0.3.0-draft.1] - 2026-11-28 (9th Skill `millar-diagnose-and-harden` & SOTA 2025-2026 Suite Enrichment)

### Added
- **`millar-diagnose-and-harden` (`skills/millar-diagnose-and-harden/`, `v0.1.0-draft.1`)**: Ninth open-standard Millar skill closing the QA -> Fix -> Verify loop with 6-phase white-box scientific root-cause debugging, OWASP Top 10 / API Security / Agentic AI hardening, Vercel Priority 1-3 waterfall & N+1 performance profiling, surgical minimal-diff remediation with real-seam regression tests, 4 progressive-disclosure reference playbooks (`root-cause-protocol.md`, `owasp-security-hardening.md`, `performance-and-waterfall-diagnosis.md`, `minimal-diff-and-seam-testing.md`), and two zero-dependency Node.js CLIs:
  - `scripts/millar-harden-scan.mjs`: Static OWASP/secret/perf/reliability scanner (`--diff-base`, inline `millar-harden-ok` suppressions, `--report-md`) plus live HTTP security header, cookie, and adversarial CORS origin-reflection probing (`--url`).
  - `scripts/triage-repro-loop.mjs`: Multi-run tight feedback loop & flake classifier (`--expect=red|green`, p95 timing, Bearer/JWT redaction) plus `--from-qa-ledger` importer turning `millar-autonomous-qa` `findings-ledger.json` into prioritized `.millar/remediation-plan.md`.
- **`millar@0.7.0-draft.1` CLI**: Added **`npx millar harden <path> [flags]`** subcommand invoking bundled `millar-harden-scan.mjs` alongside `install`, `update`, `audit`, `mcp`, and `--version`, bundling all 9 skills.
- **`@hahlex/millar-mcp@0.3.0-draft.1`**: Exposes all 9 Millar skills, 28 progressive-disclosure reference playbooks, `millar://skills/millar-diagnose-and-harden` resources, 6 combination recipes (adding `qa-to-fix-hardening-loop`), and the 12th MCP Prompt `millar-diagnose-and-harden`.

### Changed
- **Enriched all 8 existing Millar skills with 2025-2026 SOTA practices**:
  - `millar-verify-web` (`v0.4.0-draft.1`) & `scripts/millar-audit.mjs v0.4.0`: Added `a11y/wcag22-target-size` (WCAG 2.2 SC 2.5.8 `< 24x24px` live check), `a11y/focus-outline-removed`, `security/target-blank-noopener`, `security/unsafe-html-sink`, `cwv/lcp-lazy-hero`, `cwv/live-cls-exceeded`, and `perf/barrel-import`.
  - `millar-build-web` (`v0.4.0-draft.1`): Added Vercel Priority 1-3 impact hierarchy (eliminating waterfalls, bundle discipline, server perf), React 19 `useActionState`/`useTransition`, `scheduler.yield()` & LoAF INP guidance, Speculation Rules API, `@container` / `[popover]` / CSS Anchor Positioning, and frontend security defaults.
  - `millar-animation` (`v0.4.0-draft.1`): Added `@starting-style` + `transition-behavior: allow-discrete`, `interpolate-size: allow-keywords`, and View Transitions Level 2 (`@view-transition { navigation: auto }`, `view-transition-class`).
  - `millar-design` (`v0.4.0-draft.1`): Added WCAG 2.2 AA target-size/focus floors, `@container`-first component fluid sizing, and updated 9-skill handoff routing.
  - `millar-deep-research` (`v0.4.0-draft.1`): Added Technical Surface Forensics (font loading, landmarks, LCP media, motion primitives).
  - `millar-create-image` (`v0.5.1-draft.1`): Added CWV-safe dual-format delivery guidance (2K PNG master + AVIF/WebP `srcset`, `fetchPriority="high"`).
  - `millar-autonomous-qa` (`v0.4.1-draft.1`): Added closed-loop handoff to `millar-diagnose-and-harden` via `triage-repro-loop.mjs --from-qa-ledger`.
  - `millar-web-workflow` (`v0.4.0-draft.1`): Updated master conductor & Track S/M/L routing across all 9 Millar skills.

## [0.6.0-draft.1 / MCP 0.2.0-draft.1] - 2026-11-28 (Millar Autonomous QA Skill Release)

### Added
- **`millar-autonomous-qa` (`skills/millar-autonomous-qa/`, `v0.4.0-draft.1`)**: Eighth open-standard Millar skill implementing a hybrid-depth (`--depth=smoke|standard|deep-business`) 8-stage autonomous QA loop (`discover -> plan -> execute -> observe -> verify -> reproduce -> report -> explore further`) across multi-role/multi-tenant sessions and 9 testing modes (`exploratory`, `stateful`, `property`, `negative`, `concurrency`, `authorization`, `resilience`, `ai`, `outcome_verification`), backed by 7 non-redundant tools (`Playwright`, `Chrome DevTools MCP`, `Schemathesis`, `Hypothesis`, `k6`, `Toxiproxy`, `Promptfoo`), origin-scoped auth headers (0% third-party CORS false positives), frontier route expansion, ARIA/occlusion/blank-screen/i18n checks, passive HAR-to-OpenAPI synthesis for Schemathesis, 4-axis differential authorization matrix (`auth-matrix.mjs`), built-in declarative SSE AI provider (`builtin-sse-provider.mjs`) with Unicode EN/VI refusal checks, spec-driven persona workflow runner (`workflow-scenarios.mjs`), causal Postgres/Redis/Mailpit outcome verification, standalone regression script generation, and interactive self-contained HTML Report v2 (empirically validated at 0% confirmed-bug FP across live localhost benchmarks and `166/166` + `6/6` E2E suites).
- **`@hahlex/millar-mcp@0.2.0-draft.1`**: Bundles all 8 Millar skills, 24 progressive-disclosure reference playbooks, `millar://skills/millar-autonomous-qa` resources, `get_skill(name="millar-autonomous-qa")`, the `autonomous-qa-live-verification` recipe, and the 11th MCP Prompt `millar-autonomous-qa`.
- **`millar@0.6.0-draft.1` CLI**: Ships all 8 Millar skills via `npx millar install` / `npx millar update` and adds `--version` output.

## [0.1.0] - 2026-11-25 (Draft Foundation Release)

> All v0.1.0 tokens, components, visual assets, composition patterns, sections, and templates are authored in `draft` status awaiting human sign-off for promotion to `approved`.

### Added
- **Phase 0 (Monorepo, ADRs & Governance)**: Independent standalone pnpm monorepo (`d:\projects\millar`), accepted ADRs 0001-0005, *Measured Warmth* visual philosophy manifesto (`docs/art-direction/measured-warmth-philosophy.md`), `check:em-dash` (Hahlex-controlled UI/docs scope), and `check:governance` (Draft/Approved/Deprecated + visual-asset referential integrity gate).
- **Phase 1 (Shared Foundations & SSoT Compiler)**: W3C DTCG `2025.10` token sets (`tokens/`), canonical normalized Vector Brand Marks (4 SVG variants) + PWA maskable icons (`192px`, `512px`), and `@hahlex/millar-core` compiler generating `@hahlex/millar-tokens` (`tokens.css` with scoped `[data-theme="dark"]` & `[data-register="..."]`, Tailwind v4 `@theme inline`, Tailwind v3 preset, literal AntD 6 mirrors, `education.css`, `dtcg.json`, `millar-registry.json`). Automated verification clears `84/84` WCAG 2.1 AA contrast pairs and Machado protan/deutan minimum Delta-E `11.13`.
- **Phase 2 (Product/App Primitives & Domain Extension)**: `@hahlex/millar-ui` (10 accessible primitive groups, 54 1.5px Lucide icons, WAI-ARIA APG keyboard contracts, `createMillarAntdTheme` AntD 6 adapter) and optional `@hahlex/millar-domain-education` (`SkillDomainBadge`, `LearnerHighlight`).
- **Phase 3 (Marketing Design System & Photo-Free Craft)**: `@hahlex/millar-marketing` delivering 6 diverse Composition Patterns, 14 code-native Visual Assets (SVG, CSS, HTML5 Canvas, React; including `WarmHorizonWash` tagged `approved-visual-asset`), Productive & Expressive Motion Library, 10 Marketing Sections, 4 complete Page/App Templates (`ProductLaunchTemplate`, `EditorialFeatureTemplate`, `DirectoryWorkspaceTemplate`, `AnalyticsDashboardTemplate`), live Visual Do's & Don'ts, and *Measured Warmth* specimen poster (`PNG`/`PDF`).
- **Phase 4 (Millar Website Portal)**: `@hahlex/millar-portal` Next.js 15 App Router static portal (`basePath: "/millar"`) with Home, Foundations, Marketing, Product, and Resources routes, `Ctrl+K` Search Dialog, Light/Dark & EN/VI live toggles, interactive playgrounds, token explorer, asset downloads, and Cloudflare Workers config.
- **Phase 5 (Validator & Millar MCP Server)**: `@hahlex/millar-validator` (11 deterministic rules + CLI `check:design`, separating `automatedChecks` from `humanReviewCriteria`) and `@hahlex/millar-mcp` (`2026-07-28`, stdio + Streamable HTTP, 66 static/template `millar://` Resources, 11 read-only Tools with `lifecycleStatus`, and 3 Prompts).
- **Phase 6 (Verification & 2-Axis Code Review)**: Playwright E2E + real-browser `@axe-core/playwright` across all 5 Portal routes in Light & Dark modes (`1440px`, `768px`, `375px`, EN/VI, keyboard workflows, reduced-motion), visual screenshot inspection & polish, and Matt Pocock 2-Axis parallel code review remediation.
- **Phase 7 (Documentation & Integration)**: Authored `DESIGN.md`, `AGENTS.md`, root `README.md`, and `docs/integration/production-cutover-and-adoption.md` covering the mandatory CMS origin isolation gate, `hahlex-edu` / `education-portfolio` adoption guides, and MCP client setup matrix.

### Planned (v0.2.0 Roadmap)
- Additional Marketing & Product templates (`CompanyAboutTemplate`, `RecordDetailTemplate`, `AssistantWorkspaceTemplate`) and `ProofRibbonSection`.
- Human governance sign-off promoting validated `v0.1.0` items from `draft` to `approved`, manual NVDA/VoiceOver assistive technology audit, and production cutover to `hahlex.com/millar` following Keystatic CMS origin isolation.
