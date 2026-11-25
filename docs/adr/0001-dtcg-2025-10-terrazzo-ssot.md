---
status: accepted
approvedAt: 2026-11-25
---

# ADR-0001: W3C DTCG 2025.10 Token Authoring as Millar's Single Source of Truth

We author all Millar design tokens once in W3C DTCG `2025.10` JSON (`.tokens.json` + `millar.resolver.json` with OKLCH color objects, structured dimensions/durations, `$deprecated`, and `$extensions["com.hahlex.millar"]`) and compile them through one deterministic core compiler (`@hahlex/millar-core`) into CSS custom properties, Tailwind CSS v4 `@theme inline`, Tailwind v3 compatibility preset, literal JS/TS mirrors (required by Ant Design 6's `@ant-design/colors`), Portal JSON, and MCP Server manifests.

## Considered Options

- **W3C DTCG 2025.10 JSON + Deterministic Core Compiler (Accepted)**: Guarantees full compliance with the published `2025.10` Format, Color, and Resolver specifications while allowing direct CI enforcement of OKLCH contrast, Machado color-blind ΔE, register-scoped gradient rules, and lifecycle metadata from one AST into every downstream adapter.
- **Style Dictionary v4**: Mature multi-platform tooling, but official docs confirm full DTCG `2025.10` support is incomplete until v5.
- **Hand-maintained CSS + manual TS/HTML mirrors**: Already caused verified drift across `hahlex-edu`'s `base.css`, `DesignSystemView.tsx`, and `hahlex-edu-design-system.html`.

## Consequences

- Eliminates multi-copy drift across Millar Website, MCP Server, and Hahlex product packages.
- Tailwind v4 semantic tokens referencing theme-switched CSS custom properties MUST be emitted inside `@theme inline` so scoped `[data-theme="dark"]` subtrees resolve dynamically.
- Token renames or removals are treated as breaking API changes requiring `$deprecated` notices and a migration path.
