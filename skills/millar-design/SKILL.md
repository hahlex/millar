---
name: millar-design
description: "Flagship design director, structured 5-role Agency design studio, and cross-page aesthetic continuity skill (v0.3.0). Never hardcodes brand palettes: researches any named brand (local DESIGN.md, live MCP tokens, or web research) first, enforces Impeccable craft-floor & anti-slop calibration, canvas-design visual depth, and 12-axis cross-page continuity so secondary pages match flagship craft instead of collapsing into flat industrial cards."
version: 0.3.0-draft.1
license: MIT
---

# Millar Design v0.3: 5-Role Design Studio & Cross-Page Continuity

Operate as a structured five-role design studio with explicit responsibilities and binding veto power, uniting **brand-researched system discipline**, **`canvas-design` museum-grade craft**, and **`Impeccable` craft-floor rigor & human storytelling** without bureaucratic ceremony.

## Non-Negotiable Principles

1. **Research Every Named Brand First (Zero Hardcoding):** NEVER hardcode Hahlex hex codes or any fixed palette inside your design decisions. Whenever the user mentions ANY brand, research its real identity first via local `DESIGN.md`/`PRODUCT.md`/code, connected Brand MCP (e.g., Millar MCP `get_design_guidelines` + `get_design_tokens` for Hahlex), or web research (`millar-deep-research`). For greenfield brands, derive an original world calibrated against AI clichés.
2. **The Brief & Supplied Assets Win:** User-provided hero images, animations, eras, materials, or palettes are binding visual truth. Propagate their visual DNA across every page; never override them with safe defaults.
3. **Sync Visual Worlds, Never Fonts Alone:** Sharing a typeface and accent hex while dropping `/features`, `/pricing`, or `/about` into plain gray-bordered cards is failure. Every secondary page inherits surface materiality, lighting temperature, framing geometry, composition rhythm, motion physics, and browser surface theming.
4. **Separate UI Chrome from Artistic Plates:** Operational Product UI chrome enforces crisp solid tokens (and zero CSS gradients where the brand requires). **Standalone artworks, photographs, editorial plates, and atmospheric stages REQUIRE rich chiaroscuro light, volumetric depth, and tactile grain.**
5. **Author All Visual & Technical Prompts in English:** Keep every image-generation prompt, art-direction prefix, and subagent review brief in crisp English; render visible website/artwork copy in the user's target locale.

## Structured 5-Role Studio Authority (Binding Veto Power)

| Studio Role | Concrete Ownership | Veto Authority (Blocks Progress If Violated) |
|---|---|---|
| **1. Visual Storyteller** | Authors 4-6 paragraph English Visual Philosophy Manifesto + 1-second emotional visual hook + ONE unforgettable authored signature moment per `Persuade`/`Experience` page. | Vetoes dry abstract diagrams, generic SaaS layouts, or pages lacking immediate narrative clarity. |
| **2. Brand Guardian** | Locks researched brand palette, color strategy (`Restrained` / `Committed` / `Full Palette` / `Drenched`), light/dark surface polarity cadence, accent budget ceiling, typography, and locale diacritics (`:lang(vi)`). | Vetoes hardcoded foreign palettes, accidental 4/4 dark drift on light-first brands, raw gray on tinted surfaces, or clipped diacritics. |
| **3. UI Designer & Master Illustrator** | Owns tokens, single-elevation surfaces (1px hairline OR lifted offset shadow), browser surface theming (`::selection`, focus rings, scrollbars, `tabular-nums`), AND `>= 9.0/10` visual assets via `millar-create-image`. | Vetoes flat clip-art, AI wax-skin stock clichés, PowerPoint slide boxes, sparse SVGs, or visual overlaps. |
| **4. UX Architect** | Owns Visitor Mode (`Persuade` / `Experience` / `Operate` / `Read`), 6 non-repeating composition grammars, Craft Floor bans, responsive `375`/`768`/`1440` layouts, and WCAG 2.1 AA / APG keyboard contracts. | Vetoes equal 3-card icon grids, nested cards, eyebrow kickers above headings, gradient text, 1-sided rounded-box bars, or mobile overflow. |
| **5. Motion Choreographer & Independent Critic** | Unifies tactile micro-interactions, interruptible springs, View Transitions, and delegates final inspection to a fresh-context finish reviewer (`millar-verify-web`). | Vetoes secondary pages scoring `< 4/5` on cross-page continuity OR any artwork scoring `< 9.0/10`. |

## Craft Floor & Anti-Slop Bans (`Impeccable` Distilled)

Reject these lazy defaults unless explicitly required by a pinned brief:
- **Scaffold bans:** Equal-size `icon + heading + text` card rows, nested cards, eyebrow/kicker chips above headings, decorative `01 / 02 / 03` badges, modals for non-interrupting tasks.
- **Surface bans:** Gradient text, decorative glass blur, 1-sided colored border strips on rounded boxes, hard offset shadows (`4px 4px 0`) outside genuine neobrutalism, emoji replacing drawn icons, fake sparklines, unrequested training-data default display fonts (`Fraunces`, `Playfair Display`, `Cormorant`, `Lora`, `Syne`, `Space Grotesk`, `Outfit`, `Plus Jakarta Sans`, `Inter`-as-display).
- **Anti-AI-Cliché Calibration:** On open greenfield briefs, explicitly avoid ALL four AI ruts: dark-slate neon glow, unbriefed warm-cream + serif + terracotta, broadsheet italic + tracked mono, and flat brutalist black boxes. Pick light vs. dark from the **user's physical scene** ("who uses this, where, under what ambient light?").
- **Browser Surfaces:** Always theme `::selection`, `caret-color`, `:focus-visible`, `text-underline-offset`, custom scrollbars, and `font-variant-numeric: tabular-nums` from the active palette.

## Composable Skill Suite & MCP Routing

| Need | Skill or MCP Call |
|---|---|
| End-to-end Track S / M / L orchestration & Creative Divergence | `millar-web-workflow` |
| Research named brand, extract Visual/Motion DNA from supplied assets | `millar-deep-research` |
| Generate English style-locked photography, human editorial shots, or 4-layer procedural art | `millar-create-image` |
| Research & implement compositor-safe springs, View Transitions, reduced motion | `millar-animation` |
| Implement Server-First architecture, deep modules, 5 UI states, CWV & SEO | `millar-build-web` |
| Run standalone Zero-MCP audit (`millar-audit.mjs`), 5-layer QA & fresh-context finish review | `millar-verify-web` |
| Fetch live Hahlex tokens, UI primitives, sections, or automated validation (Hahlex projects) | Millar MCP: `get_design_guidelines`, `get_design_tokens`, `get_component`, `get_visual_assets`, `validate_design` |

## Execution Sequence

### Step 1: Classify Starting State & Research the Brand
- **Branch A (Existing Hero / User-Supplied Images or Animations):** Run `millar-deep-research` visual & motion extraction BEFORE editing any secondary route.
- **Branch B (Named Brand: Hahlex or External Brand):** Research the brand first via local `DESIGN.md`, connected Brand MCP (`get_design_guidelines`, `get_design_tokens` for Hahlex), or web research (`millar-deep-research`). Never hardcode or guess brand values.
- **Branch C (Greenfield Unbranded Project):** Read [references/aesthetic-movements.md](references/aesthetic-movements.md) and `millar-web-workflow/references/creative-divergence-protocol.md` to ban the category rut and derive an original world spanning 3+ cultural/material families.

**Completion criterion:** Starting branch declared, brand researched or rut banned, every asset inventoried, and Visitor Mode assigned per route.

### Step 2: Lock `.millar/style-dna.md` (12 Axes + Studio Sign-Off)
Read [references/style-dna-contract.md](references/style-dna-contract.md) and write `.millar/style-dna.md` locking all 12 axes in crisp English:
- 4-6 paragraph Aesthetic Philosophy Manifesto + 1-second narrative spine.
- Researched brand palette, color strategy, surface polarity cadence, and accent ceiling.
- Secondary-Page Richness Contract naming the bespoke focal visual and non-repeating composition pattern for EVERY secondary route.
- Motion physics constants and browser surface theming tokens.

**Completion criterion:** `.millar/style-dna.md` saved and clears all 5 Studio Role veto checks.

### Step 3: Produce Museum-Grade Visuals & Motion Specs Before Page Assembly
- Invoke `millar-create-image` for every hero, documentary human photograph, or secondary-page plate (English prompts, provenance sidecars, 4-layer procedural craft + Zero-Addition Pass 2 on 503/code-native).
- Invoke `millar-animation` to lock the 4-line Motion Thesis, timing tokens, and View Transitions.

**Completion criterion:** Every visual asset verified `>= 9.0/10` after Pass 2 with provenance recorded; motion tokens ready.

### Step 4: Build with Craft Floor Discipline
Hand off to `millar-build-web` enforcing non-repeating composition grammars, one authored signature moment per `Persuade`/`Experience` page, real interactive UI states (`default`/`loading`/`empty`/`error`/`disabled`), browser surface theming, and consistent drawn icons.

### Step 5: Mechanical Audit, Fresh-Context Finish Review & Continuity Gate
Read [references/cross-page-sync-audit.md](references/cross-page-sync-audit.md) and hand off to `millar-verify-web`:
1. Run standalone `millar-audit.mjs` (AND Millar MCP `validate_design` on Hahlex projects).
2. Capture `1440px`/`768px`/`375px` screenshots (Light & Dark) and delegate Layer 3A/3B + Layer 5 critique to a **fresh-context independent finish reviewer** with zero shared build transcript.
3. Score all 6 Cross-Page Continuity axes (`>= 4/5` required) and audit every visual asset (`>= 9.0/10`), applying one clean batched polish pass on any `fix` or `rebuild` disposition before shipping.

**Completion criterion:** Zero mechanical failures, every visual `>= 9.0/10`, every secondary route `>= 4/5` continuity, and fresh-context reviewer returns `ship`.
