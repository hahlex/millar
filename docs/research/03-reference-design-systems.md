# Research 03: Reference Design Systems & Technical Standards (Primary Sources)

> **Status**: Primary-Source Research Report (2026-11-25)  
> **Scope**: Five reference Design Systems (Vercel Geist, IBM Design Language, Carbon Design System, ElevenLabs, Linear) plus W3C Design Tokens (`2025.10`) and Model Context Protocol (`2026-07-28`) specifications.  
> **Guardrail**: Learn how they organize, showcase, govern, and machine-expose their design languages. Do NOT copy their brand identities.

---

## 1. Comparative Architecture Matrix

| Dimension | Vercel Geist | IBM Design Language | Carbon Design System | ElevenLabs | Linear |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Role** | Unified design + engineering portal (`vercel.com/geist`) | Brand philosophy, grid, color, type, motion, art direction (`ibm.com/design/language`) | Open-source product UI implementation of IBM Language (`carbondesignsystem.com`) | Editorial marketing (`elevenlabs.io`) + shadcn JSON UI registry (`ui.elevenlabs.io`) | Product-first craft benchmark (`linear.app`, `/brand`, `/method`, `/now`) |
| **IA & Navigation** | 3 groups: **Foundations**, **Brands** (6 sub-brands), **Components** (80+) + `Cmd+K` + theme toggle | Top switcher: **Foundations / Implementation / Practices / Community**; left nav covers philosophy, 2x Grid, type, color, illustration, photo, data viz, animation | **Getting Started** (incl. **Carbon MCP**) + **Building Blocks** (Foundations, Components, Patterns). Fixed 4-tab component pages: **Guidelines / Specs / Code / Accessibility** | Marketing separate from developer registry (`components` + composite `blocks`) via `registry.json` | No public component docs; brand kit + operational philosophy + deep engineering/design case studies |
| **Marketing vs. Product Split** | Shared token chassis; explicit component-level register rules (`Grid` for marketing/docs; `text-copy-24/20/18` marketing vs `14/13` product) | Owns brand foundations universally; delegates implementation downstream | Core `Carbon` for dense enterprise SaaS; `Carbon for IBM.com` for marketing; **Productive vs. Expressive motion** | Delicate light-weight (`300`) neo-grotesque marketing headlines + crisp Tailwind/shadcn product primitives | Unified monochrome hairline aesthetic across marketing & app; marketing displays stylized interactive product UI |
| **Token Architecture** | 10 functional color scales (BG 1-2, UI 1-3, Borders 4-6, High Contrast 7-8, Text 9-10) + Display P3 + **Materials** (8 surface presets) | IBM Plex, color ramps, 2x Grid (8px mini-unit), Productive/Expressive motion | 3-tier tokens (Primitive -> Semantic `$layer-01` -> Component) + 4 themes + Layering Model + W3C DTCG `2025.10` `motion.tokens.json` | Marketing CSS type scale (`--f-display-01/02`, `--f-heading-01..05`) + shadcn CSS-var registry | Parametric **LCH** theme engine driven by 3 inputs (`base`, `accent`, `contrast` 30-100) for equal perceptual lightness |
| **Visual Craft Without Photos** | Visible-rule architectural `Grid`, live `Terminal`/`File Tree`/`Gauge`, crisp `Do`/`Avoid` micro-diagrams | Geometric 2x Grid art, vector Illustration taxonomy (`Line`, `Flat`, `Isometric`, `Hybrid UI`), technical infograms | Live themed component demos, spatial layering elevation diagrams, `@carbon/charts` & pictograms | Procedural/canvas/WebGL interactive audio visuals (`Waveform`, `Matrix`, `BarVisualizer`) + live sandboxes | Precision-rendered stylized UI chrome (inverted L-shape chrome, Inbox, Cycles, shortcuts) with hairline borders |
| **Governance & AI Readiness** | Strict prop validation + terse **Best Practices** blocks (naming invalid props) acting as anti-hallucination specs | Brand review criteria ("Carefully Considered", "Uniquely Unified") | 3-phase PDLC, explicit lifecycle (`Draft -> Preview -> Stable -> Deprecated`), **Carbon Labs** incubation, Feature Flags, **AVT Accessibility Matrix**, **Carbon MCP** (`code_audit` + Token Conservation) | Open-source MIT GitHub PR workflow + CLI/shadcn registry JSON | Small strike teams, 5-milestone stress-test rollouts, feature-flagged internal dogfooding |

---

## 2. Concrete Patterns to Adopt for Millar (and Explicit "Do NOT Copy" Guardrails)

### Adopt for Millar
1. **IBM/Carbon Two-Speed Separation**: Separate **Shared Foundations** (brand philosophy, grid, color, type, iconography, accessibility, tokens) from **Marketing Design** (editorial art direction, procedural visual craft, section/page templates, Expressive motion) and **Product/App Design** (dense UI primitives, layouts, tables, forms, Productive motion).
2. **Carbon Productive vs. Expressive Motion**: Formalize two distinct motion registers in DTCG tokens:
   - **Productive** (Product/App): `fast` `110-150ms`, `base` `200ms`, `slow` `320ms`, crisp ease `[0.2, 0, 0, 1]` (matching `hahlex-edu`).
   - **Expressive** (Marketing/Editorial): `moderate` `240ms`, `slow` `400ms`, `reveal` `600ms`, expressive ease `[0.4, 0.14, 0.3, 1]` (strictly gated by `prefers-reduced-motion` static fallbacks).
3. **Geist Functional Color Slots & Surface Roles (`Materials`)**: Map Hahlex's Warm Sand / Espresso / Bronze ramps to deterministic functional slots (`bg-app`, `bg-sidebar`, `bg-surface`, `bg-surface-2`, `bg-elevated`, `border-soft/default/strong`, `fg-default/muted/subtle`, `accent`, `fg-accent`) and bundle surface fill + 1px border + radius + z-index into named **Surface Roles**.
4. **Visual Craft Without Stock Photos (Geist + Linear + IBM Hybrid UI)**: Solve Hahlex's marketing photo-starvation problem using four non-photographic visual pillars:
   - **Architectural Visible-Rule Grids** (Geist-style hairline coordinate grids, crosshairs, numbered index badges, subtle paper-dot matrices).
   - **Stylized Interactive Product Chrome** (Linear-style crisp Hahlex UI frames: real table/drawer/assistant compositions built from Millar primitives, zero dead blank scroll boxes).
   - **Procedural Geometric & Data Diagrams** (IBM Hybrid UI + SVG schematic diagrams: orbital unification, step-loop schematics, mastery curves, typographic poster textures, torn-paper editorial dividers).
   - **Live `Do` / `Avoid` Micro-Specimens** (Geist-style side-by-side interactive visual proof).
5. **Carbon 4-Tab Component Anatomy + Geist Anti-Hallucination Specs**: Every Millar component/section page shows Lifecycle Status badge (`Draft | Approved | Deprecated`), interactive Live Demo (theme + register + state controls + copyable code), 4 tabs (**Guidelines | Specs | Code | Accessibility**), and a terse **Agent Guardrails** block listing exact valid/invalid props and forbidden patterns.
6. **Carbon MCP `code_audit` + Storybook Build-Time Manifests**: Generate machine-readable manifests at build time directly from the SSoT tokens and component/section registry so Portal, packages, and MCP Server can never drift; expose a deterministic `validate_design` compliance checker.

### Explicit "Do NOT Copy" Guardrails
- **Do NOT copy** Linear's cold `#08090a` / `#5e6ad2` lavender-dark palette or Vercel's sterile `#000`/`#FAFAFA` cool-gray monochrome. Hahlex's Warm Sand / Espresso / Bronze palette is our distinctive brand equity.
- **Do NOT copy** ElevenLabs' pastel atmospheric radial orbs or heavy Three.js WebGL blobs (violates Hahlex's crisp craft aesthetic and adds >150 KB GPU overhead).
- **Do NOT copy** Vercel's `Geist Pixel` decorative meme font or triangle motifs.
- **Do NOT copy** IBM Carbon's heavy multi-repo Sass enterprise bureaucracy; keep Millar lean, TypeScript-native, and fast.
- **Do NOT copy** Linear's hyper-compact `12-13px` body density everywhere; preserve Hahlex's calm `15px` (`1.55` leading) reading rhythm for operational/educational readability.

---

## 3. W3C DTCG `2025.10` + Single Source of Truth Pipeline

On **28 October 2025**, W3C DTCG published its first stable Final Community Group Report (`https://www.designtokens.org/TR/2025.10/`):
- **Format Module (`2025.10/format`)**: `.tokens.json` with `$value`, `$type`, `$description`, `$extensions` (reverse-domain key `"com.hahlex.millar"`), `$deprecated` (boolean or migration string), `$root`, `$extends`, curly-brace aliases + RFC 6901 JSON Pointers, structured dimension/duration objects (`{ "value": 150, "unit": "ms" }`).
- **Color Module (`2025.10/color`)**: Structured CSS Color 4 objects (`colorSpace: "oklch"`, `components`, `alpha`, optional sRGB `hex` fallback) across 14 color spaces, supporting Base -> Alias -> Component tiers.
- **Resolver Module (`2025.10/resolver`)**: `.resolver.json` separating orthogonal **`sets`** and **`modifiers`** (`theme: light|dark`, `register: product|marketing`, `locale: en|vi`, `motion: default|reduced`) with explicit `resolutionOrder`.

### Compiler Trade-Off Matrix
| Tool | DTCG `2025.10` Support | Trade-Off | Recommendation |
| :--- | :--- | :--- | :--- |
| **Terrazzo (`@terrazzo/cli`)** | Native `2025.10` (Format + Color + Resolver) | Official CSS, JS/TS, Tailwind v4 plugins + custom plugin API for Docs/MCP JSON; smaller legacy ecosystem than Style Dictionary. | **Recommended Primary Compiler** |
| **Style Dictionary v4** | Partial (*official docs state 2025.10 full support is WIP for v5*) | Mature multi-platform tooling, but requires workarounds for 2025.10 Color objects & `.resolver.json`. | Avoid for greenfield 2025.10 SSoT |
| **Custom hand-rolled parser** | Custom | Zero external dep, but high burden maintaining `$extends`, JSON Pointers, OKLCH gamut mapping, cycle detection. | Reject (write thin Terrazzo emitter plugin instead) |

- **Tailwind CSS v4 Critical Rule (`tailwindcss.com/docs/theme`)**: Semantic tokens referencing theme-switched CSS custom properties (`var(--millar-...)`) MUST be declared inside `@theme inline { ... }` so scoped `[data-theme="dark"]` subtrees resolve dynamically instead of freezing at `:root`.

---

## 4. MCP Specification (`2026-07-28`): Resources vs. Tools vs. Prompts

From `https://modelcontextprotocol.io/specification/2026-07-28`:
1. **Resources (`resources/list`, `resources/read`, `resources/templates/list`, `resources/subscribe`)**: **Application-driven**, read-only, RFC 3986 URI-addressable (`millar://...`), supports RFC 6570 URI templates (`millar://components/{id}`), caching (`ttlMs`, `cacheScope`), and priority/audience annotations. Missing URIs MUST return JSON-RPC `-32602`.
2. **Tools (`tools/list`, `tools/call`)**: **Model-controlled**, supports JSON Schema 2020-12 `inputSchema` + `outputSchema` + server-validated `structuredContent`, can return `resource_link` blocks, and exposes `ToolAnnotations` (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`).
3. **Prompts (`prompts/list`, `prompts/get`)**: **User-controlled** parameterized workflow templates (slash commands) that can embed authoritative Resources directly in turn 1.

**Production Design System MCP Pattern (Carbon MCP + Storybook MCP + Figma MCP + shadcn MCP)**:
- Compile machine-readable manifests (`tokens`, `components`, `sections`, `templates`, `visual-assets`, `motion-presets`, `invariants`) once at build time from the SSoT.
- Expose canonical static/semi-static documents and individual registry specs as **MCP Resources** (`millar://...`) for IDE pinning, browsing, and caching.
- Expose search, intent-based resolution, filtered retrieval (returning `structuredContent` + `resource_link`), and **deterministic compliance checking (`validate_design`)** as **MCP Tools** with strict token-conservation discipline (2-step progressive disclosure: compact search hits -> full spec on demand).

---

## 5. Primary-Source URL Index

- **Vercel Geist**: `https://vercel.com/geist/introduction`, `/colors`, `/typography`, `/materials`, `/grid`, `/button`, `https://vercel.com/font`, `https://github.com/vercel/geist-font`
- **IBM Design Language & Carbon**: `https://www.ibm.com/design/language/`, `https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview`, `/themes/overview`, `/accessibility/overview`, `https://www.carbondesignsystem.com/getting-started/carbon-mcp/overview`, `/token-conservation`, `/contributing/product-development-lifecycle`, `/contributing/carbon-labs`, `github.com/carbon-design-system/carbon` (`packages/motion/tokens/motion.tokens.json`)
- **ElevenLabs**: `https://elevenlabs.io/`, `https://ui.elevenlabs.io/`, `https://github.com/elevenlabs/ui` (`apps/www/registry.json`)
- **Linear**: `https://linear.app/brand`, `https://linear.app/method`, `https://linear.app/now/how-we-redesigned-the-linear-ui`
- **W3C DTCG & Compilers**: `https://www.designtokens.org/TR/2025.10/`, `/format/`, `/color/`, `/resolver/`, `https://terrazzo.app/docs`, `https://styledictionary.com/info/dtcg/`, `https://tailwindcss.com/docs/theme`
- **MCP Spec & Ecosystem**: `https://modelcontextprotocol.io/specification/2026-07-28`, `/server/resources`, `/server/tools`, `/server/prompts`, `https://developers.figma.com/docs/figma-mcp-server/`, `https://github.com/storybookjs/mcp`, `https://ui.shadcn.com/docs/mcp`
