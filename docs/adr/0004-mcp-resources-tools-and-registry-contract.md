---
status: accepted
approvedAt: 2026-11-25
---

# ADR-0004: Millar MCP Server (`2026-07-28`): Resources, 11 Tools, 3 Prompts, Cross-Client Compatibility, and Deterministic vs. Aesthetic Validation Split

We implement `@hahlex/millar-mcp` as a thin read-only adapter over the compiled `@hahlex/millar-registry` bundle and `@hahlex/millar-validator`, exposing:
1. Cacheable RFC 3986 **MCP Resources** (`millar://...` + RFC 6570 templates) for guidelines, tokens, glossary, changelog, and individual registry specs.
2. **11 dedicated MCP Tools** (`get_design_guidelines`, `get_design_tokens`, `search_components`, `get_component`, `search_sections`, `get_section`, `search_templates`, `get_template`, `get_visual_assets`, `get_motion_presets`, `validate_design`) returning both schema-validated `structuredContent` AND clean text fallbacks + `resource_link`s for reliable compatibility across Claude Code, Cursor, VS Code, Antigravity, and Codex.
3. **3 user-controlled MCP Prompts** (`/millar-build-marketing`, `/millar-build-product`, `/millar-audit-code`).

Critically, `validate_design` strictly separates **Automated Verifiable Checks** (`automatedChecks`: deterministic machine-checked pass/fail rules) from **Human Aesthetic & Editorial Criteria** (`humanReviewCriteria`: advisory design-craft questions that require human judgment and are never falsely scored as automated passes).

## Considered Options

- **Resources + 11 Explicit Tools + 3 Prompts with Automated/Aesthetic Validation Split (Accepted)**: Maximum discoverability and explicitness across MCP clients, strict spec alignment with MCP `2026-07-28`, and intellectual honesty about what static analysis can and cannot judge.
- **Consolidated 4-Tool Surface**: Fewer tool definitions, but less discoverable for agents expecting explicit `search_sections` / `get_visual_assets` / `get_motion_presets` primitives.
- **Single Blended Compliance Score Mixing Aesthetics and Lint Rules**: Rejected; produces false confidence and arbitrary aesthetic scores.

## Consequences

- Every tool returns explicit `lifecycleStatus` (`draft | approved | deprecated`) so AI agents never promote draft proposals into official standards.
- Cross-client schema tests verify flat, widely supported JSON Schema constructs (avoiding fragile client-incompatible schema features) and dual `content` + `structuredContent` responses.
