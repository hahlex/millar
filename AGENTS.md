# Millar AI Agent Operating Guide (`AGENTS.md`)

Follow this playbook whenever you build, edit, or review UI using **Millar** (Hahlex Design System). Treat the compiled Millar SSoT (`@hahlex/millar-mcp` or `packages/tokens/dist/millar-registry.json`) as authoritative rather than inventing tokens, hex values, or component props from memory.

## 1. Mandatory Workflow (Tight 4-Step Loop)

1. **Read context first**: Load `millar://guidelines/invariants` and `millar://guidelines/{register}` (`shared`, `marketing`, or `product`) via MCP Resources (or invoke the `millar-build-marketing` / `millar-build-product` prompt). Done when you know the register's gradient rule, typography weights, and token set.
2. **Discover before coding (2-step progressive disclosure)**:
   - Product/App UI: Call `search_components` -> `get_component(id, includeSource: true)` and check `invalidPropGuardrails` plus `accessibility.keyboard`.
   - Marketing UI: Call `get_design_guidelines(register: "marketing", includeCompositionPatterns: true)`, `get_visual_assets`, `search_sections` -> `get_section(id)`, and `search_templates` -> `get_template(id)`.
   - Tokens & Motion: Read `millar://tokens/resolved/{theme}/{register}` or call `get_design_tokens` and `get_motion_presets`.
   - Done when every chosen token, component prop, visual asset, and composition pattern is grounded in a real Millar registry entry.
3. **Implement cleanly**:
   - Compose with `@hahlex/millar-tokens`, `@hahlex/millar-ui`, and `@hahlex/millar-marketing` (and `@hahlex/millar-domain-education` ONLY for Hahlex Education features).
   - For Marketing pages without photos, alternate across Millar's 6 Composition Patterns using code-native Visual Assets (`ConcentricArcCanvas`, `ProductWindowFrame`, `DataTableSpecimenFrame`, `UnifiedOrbitDiagram`, `ClosedLoopSchematic`, `MetricPlateCard`, `WarmHorizonWash`).
   - Done when zero hardcoded hex values, zero unapproved gradients, and zero invalid props remain.
4. **Validate before handoff**:
   - Run MCP `validate_design` (or CLI `pnpm run check:design -- --register=<register> <file>`).
   - Fix all `automatedChecks` errors until `automatedChecks.passed === true`.
   - Review every item in `humanReviewCriteria` (`automated: false`) and surface subjective aesthetic/craft tradeoffs to the human reviewer rather than claiming automated checks prove visual excellence.
   - Done when `automatedChecks.passed === true` AND visual/keyboard/accessibility checks pass.

## 2. Hard Agent Guardrails

- **Draft-only governance**: Author all new tokens, components, assets, sections, or templates with `status: "draft"`. Never set `status: "approved"` or fabricate `approvedBy` sign-off (`pnpm run check:governance` fails CI if an AI identifier appears as approver).
- **Em-dash provenance boundary**: Avoid `U+2014` in Hahlex-controlled UI, docs, and copy (`sourceKind: "hahlex-ui"`). Pass `sourceKind: "user-data" | "quoted-content" | "third-party"` when inspecting external text so user/quoted content is preserved verbatim.
- **No silent production edits**: Never edit `d:\projects\hahlex-edu` or `d:\projects\education-portfolio` when working inside the Millar repo unless the user explicitly assigns a migration PR for that target repo.
- **Honest accessibility claims**: Automated `axe-core` and contrast checks are necessary gates, not full WCAG/Section 508 conformance certification. Always note manual screen-reader (NVDA/JAWS/VoiceOver) verification as a remaining human gate before formal sign-off.
- **Security boundary (`hahlex.com/millar`)**: Never treat CSP headers as a substitute for isolating Keystatic CMS onto its own origin (`docs/adr/0003-portal-deployment-and-cms-origin-isolation.md`).

## 3. Modifying Millar Itself (Single Source of Truth Rules)

When evolving Millar inside `d:\projects\millar`:

1. Edit source DTCG tokens in `tokens/` or registry metadata in `packages/*/src/*.registry.json` (never hand-edit generated files in `packages/tokens/dist/`).
2. Recompile SSoT: `pnpm run compile`.
3. Rebuild MCP bundle if registry or server changed: `pnpm --filter @hahlex/millar-mcp run build`.
4. Run full verification gate: `pnpm run verify && pnpm run test:mcp-stdio`.
5. If Portal UI changed: `pnpm --filter @hahlex/millar-portal run build && pnpm run test:e2e` and visually inspect captured screenshots in `e2e/screenshots/`.

## 4. Context Pointers

- **Design system summary & invariants**: [`DESIGN.md`](DESIGN.md)
- **Domain terminology**: [`GLOSSARY.md`](GLOSSARY.md)
- **Visual philosophy**: [`docs/art-direction/measured-warmth-philosophy.md`](docs/art-direction/measured-warmth-philosophy.md)
- **Architecture & ADRs**: [`docs/adr/`](docs/adr/)
- **Production cutover & migration guides**: [`docs/integration/production-cutover-and-adoption.md`](docs/integration/production-cutover-and-adoption.md)
