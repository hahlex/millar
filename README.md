# Millar · Hahlex Design System

> Product-agnostic Design Foundations, Photo-Free Marketing Visual Language, Accessible Product Primitives, Interactive Portal (`hahlex.com/millar`), and AI-Native MCP Server compiled from one W3C DTCG `2025.10` Single Source of Truth.

**Status**: `v0.1.0` (`Draft` pending human governance promotion to `Approved`).

## Why Millar Exists

Hahlex product apps (`hahlex-edu`) and marketing sites (`education-portfolio`) previously duplicated tokens across four drifting files, mixed five font families, and relied on missing photography or repetitive chatboxes for visual polish. Millar unifies the entire Hahlex ecosystem under one calm, measurable design language (**Measured Warmth**) that serves designers, frontend engineers, and AI coding agents from the exact same compiled registry.

## Quick Start (Under 60 Seconds)

**Prerequisites**: Node.js `>= 22`, pnpm `>= 10` (repo pins `pnpm@12.18.0`).

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Compile W3C DTCG 2025.10 tokens & SSoT registry (verifies 84/84 WCAG AA pairs + CVD Delta-E)
pnpm run compile

# 3. Run full governance, em-dash, typecheck, and Vitest suite
pnpm run verify

# 4. Run Millar Website Portal locally at http://localhost:3000/millar
pnpm --filter @hahlex/millar-portal run dev
```

## Monorepo Layout

| Package / App | Name | Purpose |
|---|---|---|
| `tokens/` | DTCG Source | W3C DTCG `2025.10` base, semantic light/dark, `:lang(vi)`, register, reduced-motion, and education extension JSON |
| `assets/brand/` | Brand Assets | Canonical normalized Vector Brand Marks (4 SVG variants), PWA maskable icons (`192px`, `512px`), and *Measured Warmth* poster (`PNG` / `PDF`) |
| `packages/core` | `@hahlex/millar-core` | Deep SSoT compiler, WCAG 2.1 contrast verifier, Machado color-blind Delta-E engine, and canonical guidelines |
| `packages/tokens` | `@hahlex/millar-tokens` | Generated `tokens.css`, Tailwind v4 `@theme inline` (`tailwind.css`), Tailwind v3 preset, literal AntD 6 JS/TS tokens, `education.css`, `dtcg.json`, and `millar-registry.json` |
| `packages/ui` | `@hahlex/millar-ui` | Accessible Product/App React primitives (`Button`, `Input`, `Select`, `Switch`, `Checkbox`, `ChoiceToggle`, `HelpTooltip`, `Card`, `Badge`, `Stat`, `Tabs`, `Segmented`, `DataTable`, `FilterBar`, `Dialog`, `ConfirmDialog`, `Alert`, `Skeleton`, `EmptyState`, `LoadFailed`, `PageHeader`, `AppShell`), 54 1.5px Lucide icons, and `createMillarAntdTheme` |
| `packages/domain-education` | `@hahlex/millar-domain-education` | Optional vertical extension pack (`SkillDomainBadge`, `LearnerHighlight`) keeping Millar core 100% product-agnostic |
| `packages/marketing` | `@hahlex/millar-marketing` | 6 diverse Composition Patterns, 14 code-native photo-free Visual Assets (SVG/CSS/Canvas/React), Productive & Expressive Motion Library, 10 Marketing Sections, 4 Page/App Templates, and live Visual Do's & Don'ts |
| `packages/validator` | `@hahlex/millar-validator` | Deterministic design compliance engine + CLI (`pnpm run check:design`) strictly separating `automatedChecks` from `humanReviewCriteria` |
| `packages/mcp` | `@hahlex/millar-mcp` | MCP `2026-07-28` server (`dist/stdio.js` + `dist/http.js`) exposing `millar://` Resources, 11 read-only Tools, and 3 Prompts |
| `apps/portal` | `@hahlex/millar-portal` | Next.js 15 App Router static portal (`basePath: "/millar"`) showcasing Foundations, Marketing, Product, Resources, `Ctrl+K` search, Light/Dark, and EN/VI live specimens |

## Connect the Millar MCP Server

Build the standalone stdio/HTTP bundles once:

```bash
pnpm --filter @hahlex/millar-mcp run build
pnpm run test:mcp-stdio
```

Add to Claude Code, Cursor, VS Code, or Antigravity MCP config:

```json
{
  "mcpServers": {
    "millar": {
      "command": "node",
      "args": ["d:/projects/millar/packages/mcp/dist/stdio.js"]
    }
  }
}
```

For Streamable HTTP (shared team server):

```bash
PORT=3105 node packages/mcp/dist/http.js
```

## Verification Commands

| Command | What It Checks |
|---|---|
| `pnpm run compile` | Compiles W3C DTCG `2025.10` tokens -> `packages/tokens/dist/` and checks 84/84 WCAG AA contrast pairs + Machado CVD separation |
| `pnpm run check:em-dash` | Enforces Zero `U+2014` em-dash across Hahlex-controlled UI, docs, and source files |
| `pnpm run check:governance` | Enforces Draft/Approved/Deprecated lifecycle rules, blocks AI self-approval, and verifies visual-asset referential integrity |
| `pnpm run typecheck` | Runs `tsc --noEmit` across all 8 workspace packages & apps |
| `pnpm run test` | Runs Vitest unit, accessibility (`axe-core`), validator, and in-memory MCP protocol tests |
| `pnpm run test:mcp-stdio` | Spawns real OS stdio child process (`dist/stdio.js`) and verifies all 11 Tools, static Resources, and 3 Prompts |
| `pnpm run check:design -- --register=product <file>` | Runs deterministic CLI compliance checks on any TSX/CSS/HTML file |
| `pnpm run test:e2e` | Runs Playwright + real-browser `@axe-core/playwright` across all 5 Portal routes (Light & Dark, 1440px / 768px / 375px, keyboard, VI locale, reduced-motion) |

## Key Documentation

- [Design System Summary (`DESIGN.md`)](DESIGN.md)
- [AI Agent Playbook (`AGENTS.md`)](AGENTS.md)
- [Production Cutover, Security Gate & Ecosystem Adoption Guide](docs/integration/production-cutover-and-adoption.md)
- [Architecture & Art Direction](docs/architecture/millar-architecture-and-art-direction.md)
- [Measured Warmth Visual Philosophy](docs/art-direction/measured-warmth-philosophy.md)
- [Architecture Decision Records (`docs/adr/`)](docs/adr/)
- [Canonical Glossary (`GLOSSARY.md`)](GLOSSARY.md)
- [Changelog (`CHANGELOG.md`)](CHANGELOG.md)
