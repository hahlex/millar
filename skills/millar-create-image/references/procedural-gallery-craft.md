# Procedural Gallery Craft Playbook (Museum-Grade Code-Native Artwork)

Consult this playbook whenever AI image generation returns `503`/offline OR when producing code-native editorial plates, posters, architectural schematics, or visual illustrations via HTML5 Canvas, Playwright-rendered HTML/SVG, or Python (Cairo / Pillow / Skia / ReportLab).

**Goal:** Reach **>= 9.0 / 10** museum-grade visual quality by uniting `canvas-design`'s dense engraving discipline and Zero-Addition Pass 2 polish with `Impeccable`'s 1-second chiaroscuro storytelling, rendered strictly in the **researched brand's palette and light/dark polarity** (never hardcoded!).

---

## 1. Absolute Bans (Instant Rejection Triggers)

Never render these amateur code-art failures:
- **Flat Clip-Art People:** Circle heads + trapezoid bodies + stick limbs. Replace with *rim-lit atmospheric silhouettes sculpted by directional light* OR *human presence evoked through illuminated objects and thresholds* (an open book catching lamplight, twin glowing study windows, chalk arcs lifting into light).
- **Boxy Clip-Art Buildings:** Triangle roof on flat rectangle with 4 identical square windows. Replace with *precision architectural elevation linework* (`0.5px-1px` drafted rooflines, recessed glowing multi-pane frames, receding parallax ridge/skyline layers).
- **PowerPoint Flowcharts & Slide Icons:** 4-6 rounded boxes connected by `->` arrows or circle-plus-line-icon bullets. Replace with *continuous parametric visual systems*: 18-32 strand harmonic guilloche loops, orbital vernier instruments, topographic contour fields, or optical drafting schematics where a single calibrated accent deflection signals tension or mastery.
- **Flat Vector Fills Under Thin Outlines (`Impeccable` print craft rule):** Flat solid shapes with a 1px stroke read instantly as clip-art. Render engraved/print subjects through *strokes, cross-hatching/stippling patterns clipped to form, and translucent tonal washes*.
- **Collision & Encoding Bugs:** Text touching lines, labels crowded against edges (`< 6%` margin), or broken/clipped locale diacritics (such as Vietnamese `ệ, ư, ỗ, ắ, ồ, ử`).

---

## 2. Pull Palette & Polarity Dynamically From Brand Research (Zero Hardcoding)

Before writing a single color constant in your renderer, read the active brand's verified tokens from `.millar/style-dna.md`, `.millar/research-dossier.md`, local `DESIGN.md`, or live Brand MCP (for example, `get_design_tokens` when building for Hahlex):
- `--plate-light-ground` & `--plate-light-vignette` (for light-polarity plates)
- `--plate-dark-ground` & `--plate-dark-focal` (for dark-polarity plates)
- `--plate-ink-strong`, `--plate-ink-mid`, `--plate-ink-whisper` (3-plane depth inks tinted from the brand temperature, NEVER raw uncalibrated gray)
- `--plate-accent-focal` + the brand's researched accent ceiling (e.g., `< 1.5%` if restrained, or brand-verified ratio if expressive)
- **Series Polarity Cadence:** Match the researched brand's light/dark identity across multi-plate series (e.g., `3 Light + 1 Dark` or `2 Light + 2 Dark` for light-canvas brands; never accidental `4/4` dark monochrome unless the brand is dark-first).

---

## 3. The 4-Layer Procedural Craft Stack (Required on Every Artwork)

Render at **2x HiDPI** (`>= 1920x1080` for `16:9` or `>= 1600x1200` for `4:3`) using explicitly loaded local/web font files:

### Layer 1: Tactile Material Ground (Never Flat Solid Color)
- **On Light-Polarity Plates:**
  - Subtle radial tonal warmth/coolness wash calibrated from `--plate-light-ground` to `--plate-light-vignette`.
  - Procedural paper fiber / mineral grain: `4,000-12,000` ultra-fine low-opacity (`2%-5%`) tinted micro-speckles OR calibrated SVG `<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3">` overlay.
  - Delicate inset archival hairline border (`0.75px` at `5%-6%` margin) with subtle corner registration ticks.
- **On Dark-Polarity Plates:**
  - Layered deep tonal ground (`--plate-dark-focal` softly radiating into `--plate-dark-ground` deep perimeter).
  - Fine luminous mineral/lacquer dust motes (`600-1,500` micro-particles sized `0.5px-1.8px`, opacity `0.06-0.35`, concentrated naturally inside light cones!).

### Layer 2: Volumetric Chiaroscuro Light & 3 Spatial Depth Planes
Build **Background -> Midground -> Foreground** depth explicitly on BOTH polarities:
- **On Dark Plates:** Cast directional volumetric light cones (translucent layered polygons + soft Gaussian radial glow pools) illuminating one unmistakable focal aperture, manuscript, or instrument.
- **On Light Plates:** Cast sunlit north-window diagonal shadow stripes (`3%-6%` tinted shadow opacity) paired with warm/calibrated highlight washes across the focal center, delivering atmospheric depth WITHOUT darkening the surface!

### Layer 3: High-Density Master Craft Motifs (Choose by Narrative Role)
Match the motif organically to the brief's real subject (never recycle a motif unrelated to the story):
1. **Parametric Guilloche & Harmonic Ribbons (Loops, Workflows, Mastery, Systems):** `18-32` tightly phased parametric curves (`0.5px-0.9px` stroke, opacity gradation `0.14 -> 0.85`), encoding friction or focus through ONE surgical `--plate-accent-focal` strand deflection that resolves back into harmony.
2. **Halftone & Stipple Cartography (Geography, Reach, Equity, Networks):** Render regional silhouettes, elevation terrains, or architectural contours through variable-radius halftone dot matrices (`0.8px-3.2px`) paired with razor-sharp optical sightlines and equal-aperture calibration reticles.
3. **Illuminated Architectural Thresholds (Human Warmth & 1-Second Story):** Recessed multi-pane window frames casting angled trapezoid light carpets, layered parallax horizons vs. drafted urban elevations, or finely contoured open book pages (`20+` fanned ink hairlines) with rising light particles.
4. **Precision Optical & Vernier Instruments (Measurement, Governance, Clarity):** `360`-degree fine graduated scale ticks (`0.4px` minor, major ticks every `15` deg), subtle coordinate crosshairs, and generous calm negative space.

### Layer 4: Museum-Grade Integrated Typography (`90%` Visual / `10%` Text)
- **Explicit Font Loading:** Load real TTF/WOFF2/OTF fonts supporting the target locale's full character set (e.g., full Vietnamese diacritics via `@font-face` in Playwright/Chromium or `ImageFont.truetype` in Pillow). Never rely on headless Linux fallback fonts!
- **Restraint:** Maximum 1 concise display title + 2-4 whisper-small monospace index/coordinate captions (`11px-14px` on a `1600px` canvas). Zero paragraphs inside artwork!
- **Collision-Free Safe Zones:** Enforce `>= 6%` margins on all sides and verify visually that NO glyph touches ANY stroke, frame, or motif.

---

## 4. Recommended Rendering Engine by Agent Environment

| Environment | Best Engine for `>= 9.0/10` Crisp Output | Why |
|---|---|---|
| **Node + Playwright / Chromium** | **HTML5 `<canvas>` + Inline SVG + Loaded Webfonts -> Playwright `screenshot({ deviceScaleFactor: 2 })`** | Native sub-pixel antialiasing, SVG `feTurbulence` paper grain, radial chiaroscuro blending, flawless Vietnamese/Unicode font shaping, instant crisp PNG export. |
| **Python Environment** | **Cairo (`pycairo`) / Pillow + NumPy noise at `300 DPI` + `ImageFont.truetype`** | Exact Bezier guilloche curves, high-DPI alpha compositing, procedural paper grain, print-ready PDF + PNG export. |

---

## 5. `canvas-design` Zero-Addition Pass 2 Refinement Law (MANDATORY)

After Pass 1 renders, open the actual PNG directly with your vision reader and execute a brutal second pass:

1. **STOP Adding New Shapes:** If you feel tempted to add another box, badge, icon, or label to "make it look richer", **STOP immediately**. Adding elements degrades museum craft into clutter.
2. **Sharpen Only What Exists:** Adjust line-weight hierarchy (`0.4px` whisper vs. `1.2px` focal), light-beam falloff softness, paper/lacquer grain subtlety, curve harmonic spacing, typographic kerning, and margin breathing room (`>= 6%`).
3. **Verify Technical Perfection:** Confirm zero text-stroke overlaps, crisp unclipped locale diacritics (`ệ, ư, ỗ, ắ, ồ`), accurate researched brand polarity across the full series, and zero trace of clip-art or slides.
4. **Re-render and Re-inspect:** Ship ONLY when Pass 2 visibly reads like hours of painstaking studio craftsmanship (`>= 9.0 / 10`).
