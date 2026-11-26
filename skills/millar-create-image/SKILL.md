---
name: millar-create-image
description: "Gallery-grade visual art direction, Subject-First English prompting (80-135 words), Context-Appropriate Natural Daylight (zero gloomy classrooms), Kinetic Mid-Action Storytelling, Natural Hand-Drawn Editorial Illustration, Brand Motif Elevation, Organic Path H Hybrid Photo+2K Print-on-Paper Vector Compositing, and 503/offline 4-layer procedural craft (v0.5.0)."
version: 0.5.0-draft.1
license: MIT
---

# Millar Create Image v0.5: Natural Craft, Kinetic Storytelling & Quad-Path Art Direction

Produce alive, genuinely natural, brand-unmistakable visual series across sunlit human documentary photography (`Path A-Photo`), expressive hand-drawn editorial illustration (`Path A-Illustration`), organic printed-on-paper hybrid photo+2K SVG composites (`Path H`), and 503/offline museum procedural plates (`Path B`). Never produce dark gloomy classrooms, stiff frozen poses, unnatural CAD/sticker linework, timid substitutions that dodge brand motifs, or bloated boilerplate prompts.

## Non-Negotiable Laws

1. **Context-Appropriate Illumination Law (BAN Dark Gloomy Teaching & Daytime Scenes!):**
   - Education, classrooms, youth, health, community, and daytime craft **DEFAULT TO BRIGHT, AIRY NATURAL DAYLIGHT** with open, breathable shadows and genuine warmth. NEVER plunge a classroom into pitch-black darkness (`#1A130D` cave + stage spotlight) just because a website has a dark hero! Achieve narrative focus naturally via shallow depth of field (`f/2.0`), warm window sunlight, and eye-level human engagement.
   - Reserve dark chiaroscuro/low-key drama strictly for scenes genuinely set at night, on dark stages, or dark hardware/nocturnal themes.
2. **Kinetic Micro-Action Law (Specific Concrete Actions, NEVER Frozen Poses!):**
   - Ban vague statue verbs (`"pointing softly"`, `"leaning gently"`, `"quiet stillness"`, `"hovering fingertips in mid-air"`).
   - Every human or collaborative plate MUST direct **ONE unmistakable physical action mid-motion** with real lived-in props and mutual human reaction (e.g., teacher crouching at eye-level sketching a geometry arc in the notebook margin while the teenager leans forward smiling in sudden understanding; educator sketching a lesson diagram while the warm ceramic-and-bronze companion hand naturally steadies the open notebook corner).
3. **Naturalness in Linework & Materiality (Organic Hand Craft, NEVER Sterile Stickers!):**
   - For illustrated artwork, follow [references/natural-editorial-illustration.md](references/natural-editorial-illustration.md): expressive variable-weight fountain-pen/graphite linework + loose translucent watercolor/gouache washes + 30-45% breathing paper reserve.
   - For hybrid photo+vector diagrams (`Path H`), follow [references/hybrid-plate-compositing.md](references/hybrid-plate-compositing.md): ink-soak `mix-blend-mode: multiply`, subtle letterpress edge tooth (`feDisplacementMap`), matte foil/debossed medallions, and clean editorial labels (ZERO pasted web-UI pill boxes or shiny plastic 3D bevel balls!).
   - **No Raw `#HEX` in Natural Photo/Illustration Prompts:** Describe colors as real light and artist pigments in `Path A` prompts so skin tones and washes stay 100% natural; use exact `#HEX` strictly for CSS/SVG tokens and `Path H`/`Path B` vector layers.
4. **100% English Subject-First Prompting (`65/35`, `80-135` Words) & Brand Motif Elevation:**
   - Research the brand first (`DESIGN.md`, Brand MCP, or web research; zero hardcoded foreign palettes) and list its **Iconic Brand Motifs**. Elevate every motif into tactile craft: NEVER replace an explicit motif with a timid abstract placeholder (like an anonymous ceramic orb dodging a warm AI-hand motif).
   - Spend **65-75%** of the prompt on concrete mid-action choreography, daylight, and elevated motifs, and **25-35%** on compact film/media finish + max `4-6` exclusions.

## Structured 4-Role Studio Pipeline (Mandatory Passes)

### Pass 1: Visual Storyteller (Brand Motif Checklist, Natural Light & Kinetic Action Plan)

Before prompting or coding, extract the brand's **Non-Negotiable Iconic Motifs** and save a concise English `.millar/visual-philosophy.md`:
- **Visual World & Honest Lighting Check:** Explicitly decide whether each plate belongs in **Bright Airy Daylight** (default for classrooms/teaching/community/daytime craft) or **Warm Low-Key Contrast** (only when brief genuinely requires dark/night polarity), keeping shared physical materials (warm cream cotton paper, oiled walnut, satin bronze, torn deckle edges) bridging the series.
- **Per-Asset Concept Card:** For each plate, lock:
  - *Exact Kinetic Mid-Action & Props:* Who is doing WHAT concrete mid-motion verb with WHICH real lived-in objects?
  - *Path Selection:* `Path A-Photo` (Human Documentary), `Path A-Illustration` (Natural Hand-Drawn Editorial), `Path H` (Organic Photo Stage + Letterpress 2K SVG Composite), or `Path B` (503/Code-Native Monograph).
  - *Target Resolution:* **`2048px` wide** (`2048x1152` for `16:9`, `2048x1536` for `4:3`).

### Pass 2: Brand Guardian (Specialist Playbook & `80-135` Word Subject-First Prompts)

Read the matching specialist playbook(s) BEFORE drafting prompts:
- **Real People, Bright Classrooms & Kinetic Mentorship:** Read [references/human-editorial-photography.md](references/human-editorial-photography.md).
- **Natural Hand-Drawn Editorial Illustration & Expressive Linework:** Read [references/natural-editorial-illustration.md](references/natural-editorial-illustration.md).
- **Subject-First `65/35` Prompting, Material Anchors & Series Cohesion:** Read [references/image-art-direction.md](references/image-art-direction.md) and [references/multi-page-asset-map.md](references/multi-page-asset-map.md).
- **Countable Loops (`1..9`), Brand Emblems & Organic Print-on-Paper Diagrams (`Path H`):** Read [references/hybrid-plate-compositing.md](references/hybrid-plate-compositing.md).

### Pass 3: Master Illustrator (Quad-Path Execution at 2K Master Resolution)

- **`Path A-Photo` (Bright Documentary Photography):** Crisp `80-135` word English prompt (zero raw `#HEX`, concrete mid-action, context-right natural daylight), export crisp `2048px` Lanczos PNG master.
- **`Path A-Illustration` (Natural Hand-Drawn Editorial Illustration):** Variable-weight ink/graphite + translucent watercolor/gouache washes + open cotton paper reserve, `2048px` master.
- **`Path H` (Organic Printed-on-Paper Hybrid 2K Composite):** Stage 1 pure blank photographic material backdrop (zero text/diagrams) -> Stage 2 `2048x1152` Playwright Chromium SVG using `mix-blend-mode: multiply`, subtle letterpress edge tooth, matte foil medallions, bare editorial labels (zero CSS pill buttons), and canonical brand vector emblem.
- **`Path B` (503/Offline OR Pure Code-Native Plate):** Read [references/procedural-gallery-craft.md](references/procedural-gallery-craft.md) and apply the Honest Medium Pivot Law (zero faux-3D Canvas rooms or flat clip-art).

### Pass 4: Harsh Art Critic, Naturalness & Action Veto + Provenance

**Never ship Pass 1 blindly.** Open EVERY rendered `2048px` PNG directly via vision (AND inspect ALL plates side by side) and apply these 5 strict vetoes:

1. **Context-Right Daylight Veto:** Is any classroom, teaching, or daytime scene overly dark, underexposed, or gloomy like a stage cavern? If YES -> **REJECT & RE-SHOOT IN BRIGHT AIRY DAYLIGHT!**
2. **Kinetic Concrete Action Veto:** Are people or hands frozen in generic poses (*vaguely pointing, hovering horizontally in mid-air, standing stiffly*) instead of doing ONE clear, natural physical action with real props? If YES -> **REJECT & REGENERATE!**
3. **Natural Linework & Organic Print Veto:** Do illustrations look like stiff uniform CAD/corporate vectors, OR do `Path H` overlays look like glossy 3D plastic balls / pasted CSS UI pill buttons on paper? If YES -> **REJECT & REBUILD WITH ORGANIC INK-SOAK & VARIABLE LINEWEIGHT!**
4. **Brand Motif & Countable Integrity Veto:** Every iconic brand motif elevated (no timid substitutions), every `1..9` count/emblem mathematically crisp, and exact 5 natural fingers per hand.
5. **Zero-Addition Pass 2 Polish + Dual Provenance:** Refine clearance, seam integration, and shadow warmth without adding clutter, then embed PNG `tEXt` + `.prompt.json` via `node <skill-dir>/scripts/embed-provenance.mjs <plate.png> --prompt="..." --brand="..." --method="..." --aspect="16:9" --sidecar`.
