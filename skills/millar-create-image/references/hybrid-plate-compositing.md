# Hybrid Tactile Photo + 2K Precision Vector Compositing Playbook (`Path H`, v0.5)

Consult this playbook whenever an editorial plate, system diagram, brand architecture graphic, or campaign visual requires **BOTH** rich physical materiality (real cotton paper grain, hand-torn deckle edges, studio wood/espresso boards, tilted paper cards, soft natural shadows) **AND** mathematically exact semantic elements (countable steps `1..9`, exact brand SVG emblems, crisp transitions, or clean typography).

**Critical v0.5 Rule: Printed-on-Paper Organic Integration (NEVER Photoshop Stickers!):**
Early hybrid plates failed naturalness by pasting sterile web-UI pill boxes and shiny plastic 3D bevel balls on top of real paper. Every composited vector layer in `Path H` MUST feel **physically letterpress-printed, hand-inked, or softly hot-foiled INTO the real cotton paper fibers**, NEVER floating like website buttons!

---

## 1. Medium Routing Matrix (Pick the Right Path Before Prompting)

| Subject Type | Image Generator Online? | Mandatory Path | Why |
|---|---|---|---|
| **Teaching, human scenes, hands-in-action photography** | Yes | **`Path A` Photo** (`human-editorial-photography.md`) | Bright open natural daylight + concrete kinetic mid-action + authentic film grain. |
| **Warm hand-drawn editorial illustration, ink & watercolor storytelling** | Yes | **`Path A` Illustration** (`natural-editorial-illustration.md`) | Organic tapered linework + translucent watercolor/gouache washes + breathing paper tooth. |
| **System architecture, numbered loop (`1..9`), exact brand SVG emblem, split transformation** | Yes | **`Path H` Hybrid** (Tactile Photo Stage + Organic Letterpress 2K SVG Composite) | Real paper/deckle materiality + 100% mathematical accuracy + organic ink-soak integration. |
| **503/Offline OR Pure Code-Native Monograph** | No / Code-only | **`Path B` Procedural** (`procedural-gallery-craft.md`) | Honest Medium Pivot Law (orthographic elevations, intaglio stipple, organic engraving). |

---

## 2. The 3-Step Organic Path H Pipeline (`2048x1152` Native 2K)

### Step 1: Generate the Pure Photographic Material Stage (ZERO Text / ZERO Numbers / ZERO Diagrams)
Prompt the image generator ONLY for the **physical studio backdrop and tangible paper/wood surfaces**, reserving clean uncluttered open areas where printed vectors will sit:
- Describe real studio surfaces and natural daylight without raw `#HEX` filter distortion (e.g., matte dark roasted-espresso archival matboard on the left, 3-4 small blank warm-sand paper slips lightly tilted near outer left corners, a real heavyweight hand-torn cream cotton paper sheet with organic deckle fibers splitting the frame vertically near `44%`, bathed in warm natural upper-left daylight casting soft real paper relief shadows).
- **CRITICAL EXCLUSION:** Explicitly state *"completely blank paper and board surfaces, zero text, zero numbers, zero icons, zero logos, zero drawn diagrams"*.
- **Inspect Stage 1 via Vision BEFORE Compositing:** Verify exact seam contour (`x ~ 44-48%`), warm natural lighting consistency, and clean unobstructed margins.

### Step 2: Composite Organic Print-on-Paper 2K Vector Layer (`Playwright Chromium` at `2048x1152`)
Load Stage 1 photo as full-bleed `<img>` underneath an inline `<svg viewBox="0 0 2048 1152">`, measuring exact pixel coordinates along the real photographed torn-paper edge:
- **BAN Floating Web-UI Pill Capsules on Paper:** Never wrap dark-side or light-side diagram labels (`Teachers`, `Data Silos`, `Manual Workflows`) inside rounded CSS button pills with uniform `1px` borders! Render clean editorial typography paired with small tactile registration dots, callout ticks, or subtle ink underlines so they read like an **editorial print folio**, not a web dashboard!
- **BAN Shiny Plastic 3D Specular Marbles:** Never use harsh glossy white-highlight `radialGradient` spheres for numbered steps! Render numbered nodes (`1..9`) and foundation bars as **matte warm-bronze letterpress medallions / softly debossed foil rings** (subtle tonal shift `#8F5B1E -> #B8803B`, crisp hairline inner ring, soft low-opacity warm paper shadow `opacity 0.16-0.22`)!
- **Ink-Soak Blend & Subtle Letterpress Edge (`feDisplacementMap`):**
  - Set `mix-blend-mode: multiply` on dark inks, bronze hairlines, and light-ground typography so the real cotton paper fibers visibly breathe right through every stroke!
  - Apply an ultra-subtle organic print filter (`<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2"/><feDisplacementMap scale="0.7"/>`) on drawn arcs, dashed lines, and thin decorative rings so linework carries warm human print tooth instead of sterile laser-cut CAD stiffness!
  - **SVG Axis-Aligned Gradient Trap:** Never apply a default `gradientUnits="objectBoundingBox"` `<linearGradient>` to a purely vertical or horizontal `<line>` (its zero-width/zero-height bounding box renders invisible); always use `gradientUnits="userSpaceOnUse"` or a solid calibrated stroke color on axis-aligned connectors.
- **Canonical Brand Emblem & Exact Math:** Embed the exact brand vector SVG (e.g., `hahlex-mark-color.svg`) and mathematically exact clockwise angles (`theta = -90deg + i * 360 / N`), fading left-side tension curves (`< 1.5%` accent area) cleanly behind the pixel-measured torn edge mask!

### Step 3: Pass 2 Organic Cohesion & Provenance Polish
Open the rendered `2048x1152` PNG via vision and check:
- Does EVERY vector stroke look printed/foiled INTO the paper rather than pasted like a shiny sticker?
- Are all `1..9` counts, spelling, arrows, and label clearances (`>= 18px` from nodes/seams) 100% spotless?
- Run `node <skill-dir>/scripts/embed-provenance.mjs <plate.png> --prompt="..." --brand="..." --method="path-h-organic-hybrid-2k" --aspect="16:9" --sidecar`.
