# Style DNA Contract (`.millar/style-dna.md` · 12 Binding Axes)

Write this contract in crisp English before coding multi-page sites or extending an existing design. When a user names a brand or supplies existing hero images/animations, ground every axis in verified research and observed artifacts so secondary pages stay indistinguishable in craft caliber.

## Template (All 12 Axes)

```markdown
# Style DNA Contract: <Project Name>

## 1. Aesthetic Movement & Visual Philosophy
- **Movement Name:** <1-2 evocative words derived from researched brand or greenfield world>
- **Brand Research Source:** <local DESIGN.md / live MCP / web research URLs / greenfield divergence>
- **Visual Philosophy (4 concise paragraphs):**
  - *Space & Form:* Negative space, margins, and structural grid discipline.
  - *Color & Material:* Chromatic temperature, tactile surface feel, and light behavior.
  - *Scale & Rhythm:* Typographic jumps, section breathing cadence, and visual resting points.
  - *Craft Bar:* Unmistakable micro-details proving every route was authored rather than templated.

## 2. Route & Visitor Mode Matrix
| Route | Visitor Mode | Primary Job | Focal Visual Anchor (Anti-Industrial Guarantee) |
|---|---|---|---|
| `/` | Persuade / Experience | Hook and prove value | Hero artwork, documentary photo, or interactive specimen |
| `/craft` or `/features` | Persuade / Read | Deep capability proof | Style-locked visual plate or interactive bench |
| `/objects` or `/pricing` | Operate / Persuade | Filter, compare, or commit | Dedicated single-subject plates or contrasting ledger |
| `/app/*` | Operate | High-clarity daily tasks | 1-glance density, zero-gradient surfaces, crisp tables |

## 3. Color Strategy, Polarity & Surface Proportion Budget
- **Color Strategy:** `Restrained` | `Committed` | `Full Palette` | `Drenched`
- **Physical Scene Polarity Rationale:** <1 sentence: who uses this, where, under what ambient light>
- **Primary Canvas (Light / Dark):** `<hex / token>` (~65-75% area)
- **Alternating Secondary Surface:** `<hex / token>` (~15-20% area)
- **Counter-Weight Stage:** `<hex / token>` (~10-15% area)
- **Primary Action Accent:** `<hex / token>` (verified `>= 4.5:1` text contrast)
- **Focal Tension Accent:** `<hex / token>` (strictly within researched brand ceiling, e.g. `< 1.5%`)
- **UI Control Border (`SC 1.4.11`):** `<hex / token>` (verified `>= 3.0:1` against its container surface)
- **Neutral Rule:** Tint secondary ink from the palette temperature; never drop uncalibrated pure gray onto tinted grounds.

## 4. Materiality & Single-Elevation Grammar
- **Surface Elevation:** 1px hairline border OR soft offset shadow; never both on one card.
- **Corner Radius Ladder:** Control `<px>` -> Card `<px>` -> Stage `<px>` -> Pill `9999px`.
- **Dividers & Hairlines:** Consistent structural hairlines, registration marks, or material transitions.
- **Surface vs. Artwork Boundary:** Product UI chrome = `zero CSS gradients` (where required); standalone artworks/plates = rich volumetric light, grain, and depth.

## 5. Typography Architecture
- **Display Voice:** `<Family>` (avoid unrequested training-data defaults on greenfield briefs), weights, tracking, balanced headings.
- **Body & UI Voice:** `<Family>`, `14-16px`, `65-75ch` reading measure, line-height `1.55-1.65`.
- **Data / Code Voice:** `<Mono Family>`, `font-variant-numeric: tabular-nums` on all counters, metrics, and tables.
- **Heading Hygiene:** Zero eyebrow/kicker chips above headings; headings carry their own weight.

## 6. Media, Illustration & Framing Signature
- **Master English Art Direction Prefix (80% Fixed):** `<150-250 word concise English medium, lighting, material palette, framing>`
- **Fallback Medium (If AI Image Gen 503):** `<Orthographic elevation / Intaglio hatching / Guilloche / Halftone monograph; ZERO faux-3D Canvas rooms>`
- **Aspect Ratios & Dedicated SKU Rule:** Hero `16:9`/`3:2`, Split `4:3`, Catalog items = dedicated single-subject plates (never cropped composites).
- **Provenance:** `<filename>.prompt.json` saved alongside every shipping raster.

## 7. Composition Pattern Rotation
- Assign non-repeating spatial patterns down each page (never two equal 3-column icon-card grids back-to-back or across adjacent routes):
  1. Spatial Product Stage / Live Interactive Bench
  2. Editorial Split
  3. Asymmetric Bento / Catalog Mosaic
  4. Architectural Coordinate Ledger
  5. Narrative Sequence
  6. Monumental Typographic Poster

## 8. Secondary-Page Richness Contract (Anti-Industrial Rule)
Every non-homepage route MUST include:
- Opening composition matching the flagship page's typographic scale and spacing generosity (except compact `PageHeader` in `Operate` mode).
- At least one bespoke focal visual matching the flagship visual world (style-locked plate, interactive specimen, or schematic).
- At least one surface polarity shift maintaining visual cadence.
- Identical header, footer, hairline, and interactive control finish.

## 9. Motion Physics & Cross-Page Continuity
- **4-Line Motion Thesis:** Focal moment, cross-page bridge (`@view-transition` / shared `view-transition-name`), tactile feedback (stationary hover hit-target), and reduced-motion budget.
- **Motion Register & Curves:** Productive (`120-260ms`) vs Expressive (`300-640ms`), shared CSS custom properties / spring constants.
- **Reduced Motion:** Strip spatial travel under `prefers-reduced-motion: reduce`; retain static-first `opacity: 1` visibility and crisp state feedback.

## 10. Browser Surface Theming
- Theme `::selection`, `caret-color`, `:focus-visible` (2px ring + offset), `text-underline-offset`, subtle custom scrollbars, and `tabular-nums` from the active palette.

## 11. Multi-Script & Vietnamese Typography Safety
- Verify target-locale glyph coverage BEFORE locking fonts.
- **Vietnamese (`:lang(vi)`) Pitfall Guard:** NEVER use Latin-only fonts (`Poppins`, `Bebas Neue`, `Montserrat` incomplete subsets) on Vietnamese accented words (`ệ, ư, ỗ, ắ, ồ, ử`). Pair Vietnamese-complete families (`Be Vietnam Pro`, `Archivo` Vietnamese subset, `Inter Variable`, `Geist`, `Bricolage Grotesque`, `IBM Plex Mono`). If using `Bebas Neue` for big KPI digits, isolate it strictly to numeric glyphs (`12`) and render Vietnamese unit words (`GIỜ`) in a Vietnamese-complete font!
- Raise display line-height (`>= 1.18-1.22`) on `:lang(vi)` so stacked diacritics never clip.

## 12. Operate Mode & Verification Readiness
- **5 Mandatory UI States:** `Default`, `Loading` (solid zero-gradient skeleton), `Empty` (recovery CTA), `Error` (`role="alert"` + retry + locked filters), `Disabled`.
- **DOM & Accessibility Guards:** `[hidden] { display: none !important; }` reset; `1 <main>`, `<footer>` outside `<main>`, Skip Link on first `Tab`, `inert` background on modal drawers + deterministic focus-restore fallback chain.
- **Verification Gate:** `scripts/millar-audit.mjs` (`0` errors), Playwright `1440`/`768`/`375` (`0px` overflow, `0` console/HTTP errors), `@axe-core/playwright` (`0` critical/serious), and Fresh-Context Independent Finish Reviewer (`ship`).
```
