---
name: millar-deep-research
description: "Visual DNA extraction, user-intent decoding, and world-class design/animation research skill. Use BEFORE building or extending a site when the user supplies existing images, animations, reference URLs, or mood descriptions, or when researching benchmark web styles, layout grammars, and animation patterns so AI agents (Antigravity, Claude, Codex, Cursor) understand the exact visual and motion intent before writing code or generating assets."
version: 0.1.0-draft.1
license: MIT
---

# Millar Deep Research: Visual DNA Extraction & Craft Benchmarking

Turn ambiguous taste prompts, user-supplied media, and live references into a concrete, evidence-backed **Visual Research Dossier** so downstream `millar-design`, `millar-create-image`, and `millar-animation` skills execute with zero guesswork and zero cross-page drift.

## When to Run This Skill

- **Branch 1 (User Brought Images or Animations):** User provided photos, illustrations, Lottie/Rive/CSS/JS animations, or an already-styled flagship page. Extract its exact visual and motion DNA so every other page matches 100%.
- **Branch 2 (Benchmark & Style Discovery):** User wants a specific vibe, industry standard, or world-class animation style researched across high-trust web design references before choosing a direction.
- **Branch 3 (Product / Brand Context Alignment):** Combining Millar MCP tokens (`get_design_guidelines`, `get_design_tokens`) with domain-specific audience culture so the design belongs unmistakably to its users.

## Execution Sequence

### Step 1: Decode User Intent (Separate Constraints from Open Axes)

Parse the user's request and existing project artifacts into three explicit lists:

1. **Pinned Truth (Non-Negotiable):** Supplied images/animations, brand colors/marks, copy language (`en` / `vi`), required sections, target register (`product` vs `marketing`), or named reference sites.
2. **Audience & Scene:** Who uses this surface, on which devices, under what ambient lighting, and what proves credibility in their real world.
3. **Open Aesthetic Axes:** Dimensions the user left open (pacing, composition pattern, micro-interaction signature, secondary-page visual treatment).

If critical user intent is genuinely ambiguous between two conflicting worlds, ask 1-2 crisp multiple-choice questions; otherwise proceed directly to extraction and research.

**Completion criterion:** Pinned constraints, audience scene, and open axes are written explicitly.

### Step 2: Extract Visual & Motion DNA from Supplied Assets (Branch 1)

Whenever the user provides images, screenshots, videos, animations, or an existing page, read [references/visual-extraction-protocol.md](references/visual-extraction-protocol.md) and inspect EVERY supplied asset directly (using image/file reading tools and code inspection):

- **From images/screenshots:** Extract color temperature, dominant/secondary/accent surface proportions, lighting direction and softness, camera/medium grammar (editorial photo, 3D matte clay, isometric architectural render, line-art schematic, archival paper), grain/texture level, framing ratio, and negative space rhythm.
- **From existing animations/code:** Extract easing curves (`cubic-bezier` or spring stiffness/damping/mass), duration tiers, spatial travel distance (`px` / `scale`), trigger model (mount, hover, click, scroll, route change), and interruptibility behavior.
- **From Millar MCP (for Hahlex projects):** Call `get_design_guidelines` and `get_design_tokens` to verify non-negotiable Hahlex invariants (Zero Em-Dash, Product Zero Gradients, WCAG 2.1 AA, `< 1.5%` Crimson tension budget).

**Completion criterion:** A structured Visual & Motion DNA table extracted directly from observed files, zero invented claims.

### Step 3: Conduct High-Trust Web & Craft Benchmarking (Branch 2)

Read [references/world-class-benchmarks.md](references/world-class-benchmarks.md) and use your host agent's web research tool (`search_web`, `WebSearch`, browser inspection, or documentation reads) to gather concrete references tailored to the user's brief:

- **Visual craft references:** Study 2-3 high-craft references in adjacent or target domains for layout pacing, typographic scale, framing discipline, and secondary-page continuity (never copy copyrighted visuals verbatim; extract structural discipline only).
- **Motion & interaction references:** Search verified design-engineering patterns (View Transitions, spring physics, scroll-driven reveals, micro-feedback) matching the exact mood the user wants.
- **Capability fallback:** If running in an offline or no-web sandbox, rely on [references/world-class-benchmarks.md](references/world-class-benchmarks.md), Millar MCP resources (`millar://guidelines/*`, `millar://visual-assets/*`), and local asset inspection, and disclose offline mode clearly.

**Completion criterion:** 2-4 concrete structural insights + motion reference cues grounded in named sources or observed artifacts.

### Step 4: Emit the Visual Research Dossier & Handoff

Write findings into `.millar/research-dossier.md` (or feed straight into `.millar/style-dna.md` when paired with `millar-design`) with four actionable outputs:

1. **Extracted Visual DNA Summary** (colors in hex AND descriptive art-direction language for image generators).
2. **Secondary-Page Propagation Rules** (how Page 2..N echo Page 1's visual richness without looking industrial).
3. **Recommended Image Asset Plan** -> direct input for `millar-create-image`.
4. **Recommended Animation Choreography Plan** -> direct input for `millar-animation`.

**Completion criterion:** `.millar/research-dossier.md` (or `.millar/style-dna.md` research section) is saved and actionable by `millar-design`, `millar-create-image`, and `millar-animation` with zero vague adjectives left untranslated.
