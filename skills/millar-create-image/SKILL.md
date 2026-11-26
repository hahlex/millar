---
name: millar-create-image
description: "Gallery-grade visual art direction, English-only style-locked AI image generation, authentic human editorial photography, and museum-quality code-native illustration skill (v0.3.0). Synthesizes Anthropic canvas-design (2-phase Visual Philosophy, dense engraving craft, Zero-Addition Pass 2 polish), Impeccable (chiaroscuro 1-second storytelling, concise non-over-specified prompts, prompt provenance), and the Honest Medium Pivot Law on 503/offline fallback with zero hardcoded brand hexes."
version: 0.3.0-draft.1
license: MIT
---

# Millar Create Image v0.3: Gallery-Grade Art Direction & Dual-Soul Visual Craft

Produce museum-grade, emotionally resonant visual series across real human editorial photography, still-life/architectural imagery, and code-native procedural illustrations. Never produce AI wax-skin stock clichés, flat geometric clip-art humans/houses, or PowerPoint process slides, even when AI image APIs return `503` or run offline.

## Non-Negotiable Laws

1. **100% English Prompting Law:** Author EVERY image-generation prompt, Master Style Prefix, procedural art brief, and negative exclusion clause in **crisp, idiomatic English** (cinematography, lighting, printmaking, architectural vocabulary) regardless of the user's chat language. Only visible text rendered inside the artwork itself (signage, chalkboards, editorial titles) uses the user's target locale (e.g., Vietnamese UTF-8 with verified diacritics).
2. **Research the Brand First (Zero Hardcoded Colors):** NEVER hardcode Hahlex hex values or any fixed palette inside prompts. Pull the active brand's true palette, surface polarity cadence (light vs. dark balance), accent budget ceiling, and cultural home from `.millar/style-dna.md`, `.millar/research-dossier.md`, local `DESIGN.md`, connected Brand MCP (`get_design_tokens` / `get_design_guidelines`), or fresh web research before drafting Pass 1.
3. **Dual-Soul Visual Formula:** Unite two complementary qualities grounded in the researched brand's polarity:
   - **Soul A (Human Storytelling & Chiaroscuro Depth from `Impeccable`):** Communicate an unmistakable human or environmental truth within **1 second** through directional natural/volumetric light, glowing thresholds, candid life, and layered foreground/midground/background depth.
   - **Soul B (Systematic Master Craft from `canvas-design`):** Reward close inspection with patient, hours-long craftsmanship: dense engraving/guilloche linework, halftone topographies, authentic tactile grain, disciplined `90%` visual form / `10%` surgical typography, and a strict **Zero-Addition Pass 2 refinement**.
4. **Surface vs. Artwork Boundary:** Operational Product UI chrome may forbid CSS gradients under the brand's rules. **Standalone artworks, editorial plates, illustrations, and approved atmospheric canvases REQUIRE rich volumetric light, radial glow falloff, shadows, and tonal depth.** Never flatten artworks because of Product UI rules.

## Structured 4-Role Studio Pipeline (Mandatory Passes)

### Pass 1: Visual Storyteller (Philosophy Manifesto & 1-Second Metaphor)

Before prompting an image model or writing rendering code, write a concise **Visual Philosophy Manifesto** in English (saved inside `.millar/visual-philosophy.md` or `.millar/style-dna.md`):
- **Movement Name (1-2 evocative words):** Derived from the researched brand and audience culture (never recycled blindly).
- **4-6 Concise Paragraphs (`canvas-design` Phase 1):** Define Space & Form, Light & Materiality, Scale & Rhythm, Composition & Balance, and repeatedly anchor patient, museum-grade craftsmanship.
- **Per-Asset Concept Card:** For each visual in the series, define:
  - *1-Second Emotional Subject/Metaphor:* Concrete real human moment or physical architectural/light scene (never generic corporate buzzwords).
  - *Craft Medium:* Documentary Human Photography (`references/human-editorial-photography.md`), Editorial Still-Life / Architecture (`references/image-art-direction.md`), OR 4-Layer Procedural Gallery Plate (`references/procedural-gallery-craft.md`).
  - *Researched Polarity Assignment:* Honor the brand's actual light/dark balance across the series (for example, `3 Light + 1 Dark` or `2 Light + 2 Dark` for light-first editorial brands; never drifting accidentally into `4/4` dark monochrome unless the researched brand is strictly dark-first).

**Completion criterion:** English Visual Philosophy Manifesto, polarity cadence, medium selection, and per-asset 1-second concept locked from researched Brand DNA.

### Pass 2: Brand Guardian (Concise 80/20 English Style Prefix & Asset Map)

Read the matching specialist playbook(s) BEFORE drafting prompts:
- **Real People, Portraits, Classrooms, Documentary Scenes (Color or B&W):** Read [references/human-editorial-photography.md](references/human-editorial-photography.md).
- **Still-Life, Architecture, Brand Series & HEX-to-Material Translation:** Read [references/image-art-direction.md](references/image-art-direction.md) and [references/multi-page-asset-map.md](references/multi-page-asset-map.md).

Lock:
- **80% Fixed / 20% Variable English Master Style Prefix:** Translate researched brand hexes into physical materials, film science, lighting direction, and tactile finishes.
- **Concise Non-Over-Specified Prompts (`Impeccable` `visualize.md` rule):** Keep each prompt **150-250 words in English**, stating only what the model cannot infer (real subject truth, camera/lens, lighting direction, material palette, framing negative space) so the model preserves organic visual vitality instead of stiffening into a template.
- **Prompt Provenance Sidecar:** Record `<image-filename>.prompt.json` (or `.millar/asset-manifest.json`) storing the exact English prompt, aspect ratio, anchor reference, and brand research source for every shipping raster.

**Completion criterion:** Concise English Master Style Prefix, per-route aspect ratios, and provenance plan locked.

### Pass 3: Master Illustrator (Dual-Path Execution: AI Image Gen OR 4-Layer Procedural Craft)

Execute via the strongest capability available right now:

- **Path A (AI Image Generator Available & Healthy):** Antigravity `image-generator`, Codex/OpenAI image tool, Imagen/Flux MCP.
  - Generate the **Anchor Asset** first with the concise English prompt, inspect it via vision (checking subject truth, natural skin/hands, brand lighting, zero garbled text), then generate every secondary-page asset using the exact locked 80% English prefix (passing the Anchor Asset as style reference when supported) and write each `.prompt.json` sidecar.
- **Path B (AI Image Generator Returns `503`/Unavailable, Offline, OR Code-Native Editorial Plate Requested):**
  - **MANDATORY:** Read [references/procedural-gallery-craft.md](references/procedural-gallery-craft.md) BEFORE writing a single line of SVG, Canvas, or Python code!
  - **AUTOMATIC FAILURE BANS (NEVER DRAW THESE):**
    - Flat geometric clip-art humans (circle head + trapezoid torso + stick limbs) or boxy clip-art houses.
    - **Faux-3D perspective Canvas rooms, bookshelves, or fake photorealistic 3D tabletop mugs/vases/books** (when AI image gen returns `503` on photo/human/product briefs, follow the **Honest Medium Pivot Law** in `procedural-gallery-craft.md`: pivot cleanly to orthographic architectural elevations, intaglio hatching, stipple woodblock monographs, or parametric optical plates while preserving the Path A English photo prompt inside `.prompt.json`!).
    - PowerPoint workflow boxes, numbered pill chains, or circle-plus-line-icon slide diagrams.
    - Flat vector fills under thin outlines, hard-edged unblurred light polygons, or sparse `< 40` primitive SVGs lacking grain and depth.
  - **REQUIRED 4-LAYER PROCEDURAL STACK (`2x` HiDPI `>= 1600px` wide PNG/PDF/SVG):**
    1. *Layer 1 (Material Ground):* Procedural archival paper grain or textured dark surface noise + calibrated vignette using the **researched brand palette**.
    2. *Layer 2 (Volumetric Chiaroscuro Light & 3 Depth Planes):* Directional window beams on light grounds OR warm/calibrated rim-light cones + luminous dust motes on dark grounds, establishing clear foreground/midground/background depth.
    3. *Layer 3 (High-Density Master Craft):* Multi-strand harmonic guilloche curves (`18-32` strands), halftone/stipple cartography, `0.5px-1px` architectural elevation linework, illuminated thresholds/windows, or rim-lit atmospheric silhouettes.
    4. *Layer 4 (Integrated Museum Typography):* `90%` visual form / `10%` surgical text using explicitly loaded local/web TTF/WOFF2 font files (full UTF-8 locale diacritics verified; `>= 6%` margins; zero text-stroke collisions).
- **Path C (External Generator Requested):** Emit the complete **English** Master Prompt Packet (80% prefix + per-page 20% subjects + `--ar` + anchor ref instructions + subtle CSS grading).

**Completion criterion:** Every visual asset rendered at HiDPI (`>= 1600px` wide for flagship/editorial plates) with provenance metadata recorded.

### Pass 4: Harsh Art Critic & `canvas-design` Zero-Addition Second Pass

**Never ship Pass 1 blindly.** Open EVERY rendered PNG/SVG/screenshot directly via vision and score honestly (1-10) on five strict museum criteria:

1. **Zero Clip-Art / Zero Wax-Skin / Zero PowerPoint:** Does ANY figure, hand, house, or diagram look like AI plastic skin, Western stock cliché, flat clip-art, or a corporate slide? (If YES -> **REJECT & REGENERATE/REDRAW**!)
2. **Depth, Light & Materiality:** Is the lighting direction believable with genuine depth planes and tactile paper/film/surface grain (on BOTH light and dark polarities)?
3. **1-Second Story + Close-Up Mastery:** Does the image communicate its human/domain meaning in 1 second AND reward close inspection with intricate craft?
4. **Researched Brand Polarity & Accent Discipline:** Does the series faithfully match the researched brand's light/dark ratio and accent budget ceiling?
5. **Flawless Technical Craft:** Zero overlapping text, zero clipped diacritics (e.g., Vietnamese `ệ, ư, ỗ, ắ, ồ`), generous `>= 6%` margins, zero broken paths or garbled hands/letters.

**`canvas-design` Zero-Addition Refinement Law (Mandatory Pass 2):**
Assume Pass 1 is not museum-grade yet. Look closely at the rendered image. **If you feel tempted to add another shape, icon, badge, or label, STOP.** Do NOT pile more elements onto the canvas. Instead, return to the code or prompt and ONLY sharpen what already exists: refine stroke delicacy, hatching density, light falloff, shadow softness, kerning, alignment, margin breathing room, and tonal hierarchy until **every asset clears `>= 9.0 / 10`**.

**Completion criterion:** Every rendered image visually inspected after Pass 2 with zero defects, provenance saved, verified `>= 9.0/10` craft, and integrated into HTML/React with explicit `width`/`height` and meaningful `alt` text.
