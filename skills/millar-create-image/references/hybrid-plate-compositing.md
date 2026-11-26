# Hybrid Tactile Photo + 2K Precision Vector Compositing Playbook (`Path H`)

Consult this playbook whenever an editorial plate, system diagram, brand architecture graphic, or campaign visual requires **BOTH** rich photographic materiality (real paper grain, hand-torn deckle edges, studio wood/espresso boards, tilted physical cards, directional studio shadows) **AND** mathematically exact semantic elements (countable steps `1..9`, exact brand SVG emblems, crisp arrows, data loops, or clean typography).

**Why Path H Exists (Lesson Learned From Blind Benchmarks):**
- **Pure AI Diffusion (`Path A`)** creates gorgeous real-world surfaces, textures, and shadows, **but miscounts nodes (`1, 2, 4, 6, 6`), warps brand SVG logos, and garbles small diagram labels.**
- **Pure Procedural Code (`Path B`)** renders mathematically exact diagrams, **but looks flat, pale, and visually disconnected when placed next to 35mm photographic hero and CTA plates.**
- **Hybrid Photo Stage + 2K Precision Vector (`Path H`)** unites photographic materiality (`10/10`) with mathematical vector accuracy (`10/10`) AND keeps an entire multi-plate series inside ONE unified physical world (`Series Cohesion >= 9.5/10`).

---

## 1. Medium Routing Matrix (Pick the Right Path Before Prompting)

| Subject Type | Image Generator Online? | Mandatory Path | Why |
|---|---|---|---|
| **Human editorial, classroom, portrait, tactile hand/object still-life** (zero countable steps/logos) | Yes | **`Path A`** (Pure Photography, `85-145` word Subject-First prompt, `2048px` master) | Pure photography captures genuine skin, light, linen, ceramic, and human emotion best. |
| **System architecture, numbered loop (`1..9`), brand mark diagram, split state transformation (`Fragmented -> Unified`)** | Yes | **`Path H`** (Hybrid Photo Material Stage + 2K Playwright SVG Composite) | Real studio paper/torn-edge/shadow materiality + 100% mathematically accurate nodes, logos, and text. |
| **Pure typographic / cartographic poster OR Image Generator returns `503`/offline** | No / Code-only | **`Path B`** (4-Layer Procedural Gallery Craft + Honest Medium Pivot Law) | Never fake 3D perspective rooms in Canvas 2D; pivot honestly to museum orthographic/intaglio/guilloche craft. |

---

## 2. The 3-Step Path H Production Pipeline (`2048x1152` Native 2K)

### Step 1: Generate the Pure Photographic Material Stage (ZERO Text / ZERO Numbers / ZERO Diagrams)
Prompt the image generator ONLY for the **physical studio backdrop and tangible textures**, reserving clean uncluttered open areas where semantic vectors will sit:
- **Left-to-Right Split Stage Example (Adapt Dynamically From Brand Research):**
  - Specify exact physical surfaces from the researched Brand DNA (e.g., matte dark espresso archival board on the left third, 3-4 tilted blank physical card slips casting soft directional shadows at the outer left corners, a real jagged hand-torn cream cotton paper edge vertically splitting the frame around `46-50%` width, and clean sunlit heavyweight archival cream cotton paper on the right half with gentle studio light falloff).
  - **CRITICAL EXCLUSION:** Explicitly state *"completely blank paper and board surfaces, zero text, zero numbers, zero icons, zero logos, zero drawn diagrams"* so the diffusion stage stays 100% pure tactile canvas!
- **Inspect Stage 1 via Vision BEFORE Compositing:** Verify the torn paper edge / surface split sits at the exact horizontal coordinate needed (e.g., `x ~ 47%`), lighting direction matches the rest of the series (e.g., warm upper-left studio light), and the right/left diagram zones have clean unobstructed breathing room.

### Step 2: Composite Precision 2K Vector Graphics via Headless Chromium (Playwright)
Render an exact `2048x1152` HTML/SVG composition at `deviceScaleFactor: 1` (or `1024x576` at `deviceScaleFactor: 2`) using Playwright Chromium with the real Stage 1 photo as a full-bleed `<img src="stage.png" />` layer underneath an inline `<svg viewBox="0 0 2048 1152">`:
- **Read Real Coordinates From Stage 1:** Measure the actual pixel X/Y contour of the photographed tear/seam (e.g., `x = 960..1015`) so semantic lines **enter and transform right across the physical seam** instead of floating arbitrarily on top!
- **Mask Left-Side & Right-Side Polarity Cleanly:**
  - Clip or fade dark-side tension arcs (e.g., fragmented dashed crimson curves strictly `< 1.5%` area) cleanly behind the real torn-paper edge using a soft SVG `<mask>` or feathered gradient alpha along the exact measured seam contour!
  - Let warm unifying metallic filaments emerge right from beneath the torn paper seam into the exact mathematically spaced right-side orbital loop (`cx, cy, r`, `theta = -90deg + (i * 360 / N)`).
- **Physical Metal & Ink Shading (NEVER Flat Clip-Art Circles!):**
  - Render numbered medallions, foundation bars, and brand emblems with multi-stop satin metallic SVG `<linearGradient>` / `<radialGradient>` specular highlights (`#7A4E16 -> #C08A4A -> #E5C79E`), crisp `1px` inner bevel highlights, and **directional `feDropShadow` matching Stage 1's real studio light angle** (`dx`, `dy`, warm tinted espresso shadow opacity `0.24-0.34`, NEVER raw black `#000`!).
  - **SVG Axis-Aligned Gradient Trap:** Never apply a default `gradientUnits="objectBoundingBox"` `<linearGradient>` to a purely vertical or purely horizontal `<line>` (its zero-width/zero-height bounding box renders the line completely invisible); always set `gradientUnits="userSpaceOnUse"` or a solid calibrated stroke color on axis-aligned connectors.
  - Embed the brand's **exact canonical vector SVG emblem** (e.g., from `public/brand/` or Millar MCP `millar://brand/identity`) rather than letting diffusion hallucinate it.

### Step 3: Atmospheric Integration & Pass 2 Vision Polish
Make the composited vectors feel **physically printed, embossed, or inlaid onto the real cotton paper**:
- Apply subtle paper-fiber micro-integration (`mix-blend-mode: multiply` on dark-ink lines/typography over light paper; `0.94-0.97` opacity with warm ambient drop shadows on raised metallic nodes/bars).
- Check EVERY label's clearance against adjacent nodes, filaments, and the torn-paper edge (`>= 18px` gap on `2048px` canvas; zero labels colliding with connecting lines!).
- Open the rendered `2048x1152` PNG directly via vision, verify every count (`1..9`), spelling, seam alignment, and series cohesion side-by-side with Plate 01 & Plate 03, run Zero-Addition Pass 2 polish if ANY clearance or shadow looks off, and embed provenance via `scripts/embed-provenance.mjs`!
