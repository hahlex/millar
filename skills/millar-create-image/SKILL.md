---
name: millar-create-image
description: "Gallery-grade visual art direction, Subject-First English prompting (85-145 words), Brand Motif Elevation, authentic human editorial photography, Path H Hybrid Photo+2K Vector Compositing, and 503/offline 4-layer procedural craft (v0.4.0). Synthesizes Impeccable (brand motif fidelity, hybrid tactile-photo + precision-SVG plates, crisp non-over-specified prompts, PNG tEXt provenance) with canvas-design (museum engraving depth, Zero-Addition Pass 2 polish) and zero hardcoded brand hexes."
version: 0.4.0-draft.1
license: MIT
---

# Millar Create Image v0.4: Brand-Faithful Art Direction & Triple-Path Visual Craft

Produce museum-grade, brand-unmistakable visual series across authentic human editorial photography (`Path A`), hybrid photorealistic-stage + 2K precision SVG composites (`Path H`), and code-native procedural plates (`Path B`). Never produce generic stock clichés, stern lifeless scenes, vague abstract cop-outs that ignore brand motifs, miscounted AI diagrams, flat clip-art, or disconnected series styling.

## Non-Negotiable Laws

1. **100% English Subject-First Prompting Law (`65/35`, `85-145` Words):** Author EVERY image-generation prompt and art brief in **crisp, idiomatic English** (`85-145` words total). Dedicate **65-75%** of the prompt to concrete visual choreography (left-to-right spatial layout, real subjects, emotional contrast, elevated brand motifs, exact `#HEX`-anchored materials) and only **25-35%** to compact shared lens/light/film tail + max `4-6` surgical exclusions. Bloated 230-word style boilerplate starves the subject and produces generic, stiff outputs!
2. **Research the Brand First & Elevate Iconic Motifs (NEVER Hardcode, NEVER Substitute):** Pull the active brand's true palette, surface polarity, accent ceiling, AND **Iconic Brand Motifs** from `.millar/style-dna.md`, `.millar/research-dossier.md`, local `DESIGN.md`, or live Brand MCP BEFORE Pass 1.
   - **NEVER replace an explicit brand motif with a timid generic substitute** (e.g., never turn a brand's explicit "human hand meeting warm robotic hand" into an anonymous ceramic orb, and never replace "unseen learners in shadow vs. seen learner in spotlight" with empty desks!). Elevate the brand's real motifs into tactile museum craft (e.g., matte warm-ivory ceramic + satin brushed-bronze joints instead of cold chrome/neon).
   - **Dramatic Contrast Law:** Whenever a brief contrasts State A -> State B (*unseen -> seen*, *fragmented -> unified*), BOTH halves MUST appear visibly inside the frame with unmistakable tension.
3. **Triple-Path Medium Discipline (Unified Physical World Across Every Plate):**
   - **`Path A` (Pure Editorial Photography):** Real people, classrooms, portraits, hands, tactile physical still-life with zero countable diagrams.
   - **`Path H` (Hybrid Photo Material Stage + 2K Precision Vector Composite):** MANDATORY whenever an image generator is online AND the plate combines tactile physical materials (paper, torn deckle edges, studio boards, tilted cards, cast shadows) WITH countable steps (`1..9`), exact brand SVG logos, or crisp semantic diagrams. Never drop a flat bare 2D Canvas line drawing into the middle of a photographic series!
   - **`Path B` (503/Offline OR Pure Code-Native Poster):** 4-Layer Procedural Gallery Craft + Honest Medium Pivot Law (`references/procedural-gallery-craft.md`).
4. **Surface vs. Artwork Boundary:** Operational Product UI chrome may forbid CSS gradients under the brand's rules. **Standalone artworks, editorial plates, photographs, and atmospheric canvases REQUIRE rich volumetric light, radial glow falloff, shadows, and tonal depth.**

## Structured 4-Role Studio Pipeline (Mandatory Passes)

### Pass 1: Visual Storyteller (Brand Motif Checklist & Visual Philosophy)

Before prompting or coding, extract the brand's **Non-Negotiable Iconic Motifs** from `DESIGN.md` / research (physical edges like torn paper, narrative contrasts, character/object pairings, canonical emblems, countable loops) and save a concise English `.millar/visual-philosophy.md`:
- **Movement Name (1-2 words)** + **3-5 concise paragraphs** locking ONE unified physical surface world across every plate (so dark anchor, light ground, signature material edge, and accent finish repeat harmoniously across the whole series!).
- **Per-Asset Concept Card:** For each plate, lock:
  - *1-Second Emotional & Brand Story:* Exact spatial choreography (Left third / Center-right / Far edge) + BOTH halves of any visual contrast + which Iconic Brand Motifs appear.
  - *Path Selection:* `Path A` (Pure Photo), `Path H` (Hybrid Photo Stage + 2K SVG Composite), or `Path B` (503/Code-Native Monograph).
  - *Unified Polarity & Target Resolution:* Flagship plates ship at **`2048px` wide** (`2048x1152` for `16:9`, `2048x1536` for `4:3`).

### Pass 2: Brand Guardian (Concise `65/35` English Prompts & Provenance Plan)

Read the matching specialist playbook(s) BEFORE drafting prompts:
- **Real People, Classrooms, Portraits & Warm Candid Emotion:** Read [references/human-editorial-photography.md](references/human-editorial-photography.md).
- **Subject-First `65/35` Prompting, Material Anchors & Series Cohesion:** Read [references/image-art-direction.md](references/image-art-direction.md) and [references/multi-page-asset-map.md](references/multi-page-asset-map.md).
- **Diagrams, Countable Loops (`1..9`), Brand Emblems & Split States (`Path H`):** Read [references/hybrid-plate-compositing.md](references/hybrid-plate-compositing.md).

Lock:
- **Concise `85-145` Word English Prompts (`65-75%` Subject/Motifs/Spatial Story + `25-35%` Shared Film/Light/Material Tail):** Pair researched `#HEX` color anchors directly with tactile real-world material words so the generator locks exact color temperature without boilerplate dilution.
- **Dual Provenance:** Embed standard PNG `tEXt` metadata directly into every shipping PNG AND emit `<filename>.prompt.json` via `node <skill-dir>/scripts/embed-provenance.mjs <plate.png> --prompt="..." --brand="..." --method="..." --sidecar`.

### Pass 3: Master Illustrator (Triple-Path Execution at 2K Master Resolution)

Execute using the matching path locked in Pass 1:
- **Path A (Pure Editorial Photography, Image Generator Online):**
  - Generate the **Anchor Plate** first using the crisp `85-145` word prompt, inspect it via vision against every Brand Motif & emotional requirement, upscale/export to a crisp `2048px` Lanczos PNG master, and pass the Anchor Plate's visual DNA (and reference input when supported) to secondary photographic plates so lighting, color temperature, and physical surfaces stay locked across the roll.
- **Path H (Hybrid Photo Material Stage + 2K Precision Playwright SVG Composite, Image Generator Online + Countable/Semantic Elements):**
  - **MANDATORY:** Read [references/hybrid-plate-compositing.md](references/hybrid-plate-compositing.md)!
  - Step 1: Generate ONLY the pure photorealistic studio surface/props/torn-edge stage (strictly ZERO text, ZERO numbers, ZERO logos).
  - Step 2: Inspect Stage 1 via vision, measure exact pixel coordinates of the physical seam/zones, and composite razor-sharp `2048x1152` Playwright Chromium SVG graphics (satin metallic gradients, directional light-matched `feDropShadow`, canonical brand SVG emblem, mathematically exact numbered loop) cleanly masked/faded at the photographed seam.
- **Path B (AI Image Generator Returns `503`/Unavailable, Offline, OR Pure Code-Native Plate Requested):**
  - **MANDATORY:** Read [references/procedural-gallery-craft.md](references/procedural-gallery-craft.md)!
  - **AUTOMATIC BANS:** Zero flat geometric clip-art humans/houses, zero **faux-3D perspective Canvas rooms or tabletop mugs/vases**, zero PowerPoint boxes, zero hard-edged unblurred light triangles. Pivot honestly via the **Honest Medium Pivot Law** (orthographic elevations, intaglio/stipple botanical monographs, 24-36 strand harmonic guilloche, halftone cartography) while preserving the Path A English photo prompt inside `.prompt.json`.

### Pass 4: Harsh Art Critic, Subject-Fidelity Veto & Zero-Addition Pass 2

**Never ship Pass 1 blindly.** Open EVERY rendered `2048px` PNG directly via vision (AND inspect ALL plates of the series side by side!) and enforce these 5 binding vetoes:

1. **Brand Motif & Emotional Fidelity Veto:** Does every plate visibly deliver the brand's actual iconic motifs and emotional narrative from `DESIGN.md` / brief (no empty desks replacing shadowed learners, no vague ceramic orbs dodging an explicit AI-hand motif, no stern/tired faces where warm encouragement was needed)? If NO -> **REJECT & REGENERATE!**
2. **Countable & Semantic Precision Veto (Instant Path H Trigger):** Inspect every number (`1..9`), arrow, brand logo stroke, and label pixel-by-pixel. If diffusion miscounted, duplicated, warped, or blurred ANY semantic element -> **REJECT pure diffusion and rebuild immediately via `Path H`!**
3. **Series Material Cohesion Veto:** Look at ALL plates together (`plate-01`, `plate-02`, `plate-03`...). Do they belong to ONE unmistakable physical universe (matching dark ground, warm light ground, shared material edges/accent finish, consistent 2K crispness)? Never ship a flat pale Canvas schematic next to rich 35mm photographic plates when `Path H` is available!
4. **Zero Clip-Art / Zero Wax-Skin / Zero Faux-3D:** Real natural skin texture, exact 5 natural fingers, believable light physics, zero cold neon/cyberpunk bleed unless researched.
5. **Zero-Addition Pass 2 Refinement + Embedded Provenance:** Fix label clearances (`>= 18px`), seam fades, shadow softness, kerning, and tonal hierarchy WITHOUT piling on new clutter, then run `scripts/embed-provenance.mjs --sidecar` so both PNG `tEXt` chunks and `.prompt.json` are verified on every shipping plate!
