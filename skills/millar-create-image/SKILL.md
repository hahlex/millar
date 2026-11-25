---
name: millar-create-image
description: "Style-locked visual asset and AI image art direction skill for websites and apps. Use when generating hero visuals, editorial illustrations, product scene photography, secondary-page imagery matching existing hero assets, or gallery-grade code-native SVG/HTML5 Canvas/poster plates (canvas-design standard). Works across Antigravity (image-generator), Claude, Codex, and Cursor using an 80% fixed Style DNA prompt prefix and multi-page visual coherence rules."
version: 0.1.0-draft.1
license: MIT
---

# Millar Create Image: Style-Locked Art Direction & Visual Asset Production

Treat image creation as a **latent-space compiler**, never a random prompt slot machine. Every visual generated for a site (Home, Features, About, Pricing, Case Studies, Docs, Empty States) must look shot in the same studio, drawn by the same hand, or drafted on the same architectural plate.

## Core Directives

1. **Read `.millar/style-dna.md` first.** If no Style DNA exists yet, run `millar-deep-research` (or lock a concise 4-paragraph Visual Philosophy following `canvas-design`: Movement Name, Space/Form, Color/Material, Scale/Rhythm, Lighting) before generating a single image.
2. **One visual job per asset.** Generate one focused asset per slot/section at its exact target aspect ratio. Never cram multiple web sections or busy collage clutter into one frame.
3. **80% Fixed / 20% Variable Rule.** Freeze 80% of the prompt (medium, lighting paradigm, color temperature language, surface materiality, framing discipline) across the entire project; swap only the 20% subject and focal composition per page/section.
4. **Bridge HEX to Art-Direction Language.** Image generators ignore raw HEX codes. Translate every brand token into tactile material descriptions (e.g. `#FAF3EA` -> "warm unbleached archival cream paper", `#1A130D` -> "deep roasted espresso matte backdrop", `#B3121B` -> "restrained crimson lacquer accent").
5. **Preserve Typography Breathing Room.** When generating hero or split-section images, reserve clean low-frequency negative space in the exact zone where headings or controls will sit.

## Cross-Agent Capability Routing Ladder

Pick the highest-fidelity execution path available in the current agent runtime:

1. **Path A (Native AI Image Generator Available):** e.g. Antigravity `image-generator` subagent, OpenAI/Codex image tool, Imagen/Flux/Midjourney MCP tool.
   - Generate assets directly using the 5-Block Master Prompt in [references/image-art-direction.md](references/image-art-direction.md).
   - When user supplied reference images exist, pass them as style reference / edit input so lighting, grain, and color grading lock tightly.
   - Save every asset to the project's public/assets folder with semantic filenames (`hero-stage.webp`, `features-workflow-plate.webp`) AND write a sidecar `.prompt.json` log recording the locked 80% prefix for future pages.
2. **Path B (Code-Native Visual Asset / `canvas-design` Editorial Plate):** When building photo-free Hahlex surfaces, crisp diagrams, posters, or running in a runtime without raster image generation.
   - For Hahlex projects: check Millar MCP `get_visual_assets` first (14 verified SVG/CSS/Canvas/product chrome primitives).
   - For bespoke editorial posters, plates, or technical schematics: author deterministic high-DPI SVG, HTML5 Canvas (DPR-scaled), or Python Pillow/Cairo/ReportLab plates (`90%` pure visual form, `10%` surgical typography, zero overlapping labels, exact palette tokens).
3. **Path C (External Generator Prompt Packet):** When the user explicitly prefers Midjourney/Flux/Recraft outside the IDE.
   - Deliver the complete multi-page Master Prompt Packet (Shared 80% Prefix + per-page 20% prompts + `--ar` ratios + style-ref instructions + post-grading CSS overlay filter).

## Execution Sequence

### Step 1: Map All Required Visual Slots Across Pages

Read [references/multi-page-asset-map.md](references/multi-page-asset-map.md) and list every page and section needing an asset, specifying:
- Route & section job (`hook`, `proof`, `narrative`, `process`, `atmosphere`, `empty-state`)
- Exact container aspect ratio (`16:9`, `3:2`, `4:3`, `1:1`, `4:5`)
- Copy placement zone (e.g. "clean calm negative space on left 40%" or "standalone right plate, no overlaid text")
- Whether asset is raster AI image (Path A), Millar MCP / code-native vector-canvas plate (Path B), or prompt packet (Path C).

**Completion criterion:** Complete asset table covering flagship AND secondary routes with zero unmapped visual gaps.

### Step 2: Lock the 80% Master Style DNA Prefix

Read [references/image-art-direction.md](references/image-art-direction.md) and construct the project's single reusable `MASTER_STYLE_PREFIX` covering:
- `[Medium & Craft]` + `[Lighting Paradigm]` + `[Color Language & Palette Discipline]` + `[Materiality & Texture]` + `[Negative Hygiene]`
- Confirm it honors user-supplied images (if any) and Hahlex invariants (if Hahlex project: Warm Sand + Espresso + `< 1.5%` Crimson, zero neon purple/blue AI cliches).

**Completion criterion:** One locked `MASTER_STYLE_PREFIX` saved into `.millar/style-dna.md` (Section 6).

### Step 3: Generate Assets Sequentially or in Cohesive Series

- Generate the **Anchor Asset** first (typically Hero or flagship section), inspect it directly via vision/file reader, and verify palette temperature, lighting, composition balance, and zero garbled text/artifacts.
- Generate all **Secondary-Page Assets** anchored to that exact Master Prefix (and passing the Anchor Asset as style reference whenever the generator supports reference images), varying subject scale (wide environmental -> medium architectural -> macro material detail) while keeping rendering style frozen.

**Completion criterion:** Every generated asset visually inspected via file/image read; any drifting or artifact-heavy frame regenerated before wiring into UI.

### Step 4: Integrate with UI Framing & Color Grading Discipline

Wire assets cleanly into components:
- Explicit `width` and `height` (or CSS `aspect-ratio`) to prevent Cumulative Layout Shift (CLS).
- Consistent border radius, hairline matte border, and subtle color-temperature harmonization matching `.millar/style-dna.md`.
- Accessible `alt` text describing the visual subject meaningfully (or `alt=""` for purely atmospheric plates).
- Responsive `object-fit: cover` with calibrated `object-position` so focal subjects never crop awkwardly on mobile (`375px`).

**Completion criterion:** All assets render sharply in browser at `1440px` and `375px`, match Page 1's visual world seamlessly, and pass `alt` / contrast / CLS checks.
