# Procedural Gallery Craft Playbook (Museum-Grade Code-Native Artwork)

Consult this playbook whenever AI image generation returns `503`/offline OR when producing code-native editorial plates, posters, architectural schematics, or visual illustrations via HTML5 Canvas, Playwright-rendered HTML/SVG, or Python (Cairo / Pillow / Skia / ReportLab).

**Goal:** Reach **>= 9.2 / 10** museum-grade graphic quality by uniting `canvas-design`'s dense engraving discipline and Zero-Addition Pass 2 polish with `Impeccable`'s 1-second chiaroscuro storytelling, rendered strictly in the **researched brand's palette and light/dark polarity** (never hardcoded!).

---

## 1. Absolute Bans (Instant Rejection Triggers)

Never render these amateur code-art failures:
- **Flat Clip-Art People:** Circle heads + trapezoid bodies + stick limbs. Replace with *rim-lit atmospheric silhouettes* OR *human presence evoked through architectural traces* (illuminated open pages, twin glowing study apertures, drafted courtyard plans).
- **Boxy Clip-Art Buildings:** Triangle roof on flat rectangle with 4 square windows. Replace with *precision orthographic architectural elevation linework* (`0.5px-1px` drafted elevations, cutaway cross-hatching, receding contour planes).
- **Faux-3D Perspective Canvas Rooms & Fake Photorealistic Tabletops (CRITICAL BAN):** NEVER try to paint 3D-projected perspective interiors, bookshelves, 3D-shaded mugs/vases/bottles, or vector tabletops using Canvas 2D filled polygons and linear gradients! They ALWAYS read as amateur 2005 Flash clip-art (`<= 7.5/10`).
- **PowerPoint Flowcharts & Slide Icons:** 4-6 rounded boxes connected by `->` arrows or circle-plus-line-icon bullets. Replace with *continuous parametric visual systems*: 20-36 strand harmonic guilloche loops, orbital vernier instruments, topographic contour fields, or drafting schematics where ONE focal accent deflection signals tension.
- **Flat Vector Fills Under Thin Outlines (`Impeccable` print craft rule):** Flat opaque shapes under a 1px stroke read instantly as clip-art. Render engraved/print subjects through *fine ink strokes, clipped cross-hatching or stippling patterns, and translucent tonal washes*.
- **Hard-Edged Light Triangles:** Never draw unfeathered straight-edged polygons for light beams; always feather directional light cones with `ctx.filter = "blur(18px-28px)"` or smooth multi-stop radial falloff so light melts organically into grain.
- **Collision & Encoding Bugs:** Text touching strokes, cramped margins (`< 6%`), or broken/clipped locale diacritics (such as Vietnamese `ệ, ư, ỗ, ắ, ồ, ử`).

---

## 2. The Honest Medium Pivot Law (When AI Image Gen Returns `503` on Photo/Human/Product Briefs)

When a brief asks for **real human photography, interior scenes, or studio product photos** AND AI image generation is unavailable (`503`/offline):
1. **DO NOT fake a photograph in Canvas 2D.** Never draw faux-3D rooms, faux-3D human portraits, or faux-3D tabletop cups.
2. **Pivot intentionally and honestly to Native Museum Printmaking & Orthographic Monograph Craft**, the 4 mediums where procedural code genuinely achieves `9.3-9.7 / 10`:
   - **Architectural Orthographic Elevation / Section Blueprints:** Pure 2D architectural front/section drawings (`0.5px-1.0px` ink linework, sun-angle rays, millimeter dimension ticks, fine cross-hatching, translucent sunlit tonal washes).
   - **Intaglio & Stipple Botanical / Material Monographs:** Fine ink contour engraving paired with variable-density stipple dots (`3,000-15,000` dots) or clipped diagonal pen hatching (`45 deg / 135 deg`), echoing Japanese woodblock prints or botanical folios.
   - **Parametric Optical & Harmonic Systems:** `24-36` strand guilloche ribbons, orbital vernier rings, thermal/acoustic wave plates, and feathered chiaroscuro glow pools.
   - **Halftone Topographic Cartography & Equal-Luminance Architectural Apertures:** Stipple elevation maps paired with finely hatched twin architectural window frames casting soft blurred daylight washes.
3. **Preserve Path A Photographic Readiness:** Always save the complete **100% English Path A Documentary Photography Prompt** inside `<asset>.prompt.json` (with `"renderMode": "path-b-archival-monograph"`, `"pathAReady": true`) so real photography can drop straight into the exact slots whenever an image model is online.

---

## 3. Pull Palette & Polarity Dynamically From Brand Research (Zero Hardcoding)

Read verified tokens dynamically from `.millar/style-dna.md`, `.millar/research-dossier.md`, local `DESIGN.md`, or live Brand MCP:
- `--plate-light-ground` & `--plate-light-vignette` (light-polarity plates)
- `--plate-dark-ground` & `--plate-dark-focal` (dark-polarity plates)
- `--plate-ink-strong`, `--plate-ink-mid`, `--plate-ink-whisper` (3-plane depth inks tinted from brand temperature, NEVER raw uncalibrated gray)
- `--plate-accent-focal` + researched accent ceiling (e.g., `< 1.5%` for restrained editorial brands)
- **Series Polarity Cadence:** Match the researched brand's light/dark identity across multi-plate sets (e.g., `2 Light + 2 Dark` or `3 Light + 1 Dark` for light-canvas brands; never accidental `4/4` dark monochrome unless dark-first).

---

## 4. The 4-Layer Procedural Craft Stack (Required on Every Artwork)

Render at **2x HiDPI** (`>= 1920x1080` for `16:9` or `>= 1600x1200` for `4:3`) with explicitly loaded local/web TTF/WOFF2 fonts:

### Layer 1: Tactile Material Ground (Never Flat Solid Color)
- **Light-Polarity Plates:** Soft radial paper/mineral wash + `4,000-12,000` ultra-fine low-opacity (`2%-5%`) tinted paper-fiber grain speckles (or SVG `feTurbulence`) + delicate `0.75px` archival registration border inset `5%-6%` with corner crop ticks.
- **Dark-Polarity Plates:** Layered deep tonal vignette + `600-1,500` luminous mineral dust motes (`0.5px-1.8px`, opacity `0.06-0.35`) concentrated organically along light cones.

### Layer 2: Feathered Volumetric Chiaroscuro Light & 3 Spatial Depth Planes
Build **Background -> Midground -> Foreground** depth on BOTH polarities:
- **Dark Plates:** Cast feathered volumetric light shafts (`ctx.filter = "blur(22px)"` or smooth multi-stop radial pools) illuminating one unmistakable focal aperture, manuscript, or parametric core.
- **Light Plates:** Cast soft blurred north-window diagonal shadow bands (`3%-6%` tinted shadow opacity) paired with warm/calibrated highlight washes across the focal center, delivering sunlit depth WITHOUT darkening the surface.

### Layer 3: High-Density Master Craft Motifs (Match the Brief's Subject)
- **Harmonic Guilloche (`20-36` phased strands, `0.5px-0.9px` stroke):** Encode friction or tension through ONE surgical `--plate-accent-focal` strand deflection that smoothly rejoins harmony.
- **Halftone & Stipple Cartography / Topography:** Variable-radius dot matrices (`0.8px-3.2px`) paired with razor-sharp optical sightlines and equal-aperture calibration reticles.
- **Orthographic Architectural Elevations & Hatched Window Apertures:** `0.5px-1px` precision elevations, multi-pane window frames with clipped diagonal hatching, fine book-page contours (`20+` fanned ink hairlines), or single-subject technical vessel blueprints with millimeter dimension lines.
- **Precision Optical & Vernier Instruments:** `360`-degree fine graduated scale ticks (`0.4px` minor, major ticks every `15` deg) and balanced negative space.

### Layer 4: Museum-Grade Integrated Typography (`90%` Visual / `10%` Text)
- **Explicit Locale-Safe Font Loading:** Load real TTF/WOFF2 fonts supporting full script glyphs (for Vietnamese: `Be Vietnam Pro`, `Archivo` Vietnamese subset, `Inter`, `Geist`, `IBM Plex Mono`; NEVER use Latin-only `Poppins` or `Bebas Neue` on Vietnamese accented words!).
- **Restraint:** Maximum 1 concise display title + 2-4 whisper-small mono coordinate/index captions (`11px-14px` on `1600px+` canvas). Zero paragraphs inside artwork.
- **Collision-Free Safe Zones:** Enforce `>= 6%` margins on all sides and inspect rendered PNGs directly to verify zero text-stroke overlaps.

### Canvas 2D & Vector Rendering Gotchas (Avoid Silent Fallbacks)
- **`ctx.font` Rejects Percentage Stretch:** HTML5 Canvas rejects percentage font-stretch values (such as `"800 125% 54px 'Archivo'"`) and silently falls back to `10px sans-serif`. Always use CSS stretch keywords (`"800 expanded 54px 'Archivo'"`) or standard weight + size syntax.
- **`ctx.restore()` Preserves the Active Path:** `ctx.restore()` resets the clipping region without clearing the active subpath. Always call `ctx.beginPath()` immediately before AND after clipped cross-hatching/stipple passes so hatching lines never bleed unclipped.
- **Responsive Organic SVG Dividers:** On deckle or torn-paper SVG dividers, set `preserveAspectRatio="xMidYMid slice"` (never `"none"`) so mobile viewports never compress gentle edge rhythms into jagged sawteeth.

---

## 5. `canvas-design` Zero-Addition Pass 2 Refinement Law (MANDATORY)

After Pass 1 renders, open EVERY actual PNG directly via vision and execute Pass 2:

1. **STOP Adding New Shapes:** If tempted to add another box, badge, icon, or label to "make it look richer", **STOP immediately**.
2. **Sharpen Only What Exists:** Soften any hard-edged light beam with Gaussian blur, refine stroke-weight hierarchy (`0.4px` whisper vs `1.2px` focal), enrich cross-hatching/stipple density, tune paper/lacquer grain subtlety, fix orphan line wraps, and widen cramped margins (`>= 6%`).
3. **Verify Technical Perfection:** Zero faux-3D clip-art, zero text-stroke collisions, razor-sharp unclipped locale diacritics (`ệ, ư, ỗ, ắ, ồ`), accurate researched brand polarity, and `.prompt.json` provenance saved.
4. **Re-render and Re-inspect:** Ship ONLY when Pass 2 visibly reads like hours of master museum printmaking (`>= 9.2 / 10`).
