# Style DNA Contract (`.millar/style-dna.md` Template)

Write this contract before coding multi-page sites or extending an existing design. When a user brings existing hero images, animations, or a finished flagship page, extract every field directly from those real artifacts so secondary pages stay visually indistinguishable in craft caliber.

## Template

```markdown
# Style DNA Contract: <Project Name>

## 1. Aesthetic Movement & Visual Philosophy
- **Movement Name:** <1-2 evocative words, e.g. Measured Warmth, Editorial Quartz, Tactile Ledger>
- **Visual Philosophy (4 concise paragraphs):**
  - *Space & Form:* How negative space, asymmetric margins, and structural grids behave.
  - *Color & Material:* Chromatic temperature, tactile surface feel (paper, lacquer, obsidian, matte glass), and light behavior.
  - *Scale & Rhythm:* Typographic jumps, section breathing cadence, and visual resting points.
  - *Craft Bar:* The unmistakable micro-details that prove every route was authored rather than templated.

## 2. Route & Visitor Mode Matrix
| Route | Visitor Mode | Primary Job | Focal Visual Anchor (Anti-Industrial Guarantee) |
|---|---|---|---|
| `/` | Persuade / Experience | Hook and prove value | User hero visual or Spatial Stage |
| `/features` | Persuade | Deep capability proof | Style-locked visual series or interactive product chrome |
| `/pricing` | Persuade | Clear commitment decision | Contrasting surface band + typographic comparison ledger |
| `/about` | Read / Experience | Credibility & craft story | Editorial split plate + custom architectural diagram/portrait |
| `/app/*` | Operate | High-clarity daily tasks | 1-glance density, solid surfaces, crisp hairline tables |

## 3. Color Temperature & Surface Proportion Budget
- **Primary Canvas (Light / Dark):** `<hex / token>` (~65-75% area)
- **Alternating Secondary Surface:** `<hex / token>` (~15-20% area)
- **Counter-Weight Stage (Contrasting Polarity):** `<hex / token>` (~10-15% area)
- **Brand Action Accent:** `<hex / token>` (~2-5% area, verified >= 4.5:1 text contrast)
- **Tension / Highlight Accent:** `<hex / token>` (< 1.5% area, semantic emphasis only)
- **Neutral Rule:** Tint secondary/muted ink from the palette temperature; never drop uncalibrated pure gray onto warm or tinted grounds.

## 4. Materiality & Single-Elevation Grammar
- **Surface Elevation:** 1px hairline border (`--border-default`) OR lifted soft shadow (`--shadow-card`); never both on one card.
- **Corner Radius Ladder:** Control `<px>` -> Card `<px>` -> Stage `<px>` -> Pill `9999px`.
- **Dividers & Hairlines:** Subtle structural rules, coordinate ticks, or paper transitions matching Page 1.
- **Gradient Boundary:** Product/App = `forbidden`. Marketing = `approved visual assets / brief-pinned atmosphere only`.

## 5. Typography Architecture
- **Display Voice:** `<Family>`, weights `<300-600>`, tracking `<em value>`, balanced headings.
- **Body & UI Voice:** `<Family>`, `14-16px`, `65-75ch` reading measure, line-height `1.55-1.65`.
- **Data / Code Voice:** `<Mono Family>`, `font-variant-numeric: tabular-nums` on all counters and tables.
- **Vietnamese Safety (`:lang(vi)`):** Increase display line-height (`>= 1.20`) and top headroom so stacked diacritics never clip.

## 6. Media, Illustration & Framing Signature
- **Master Art Direction Prefix (80% Fixed):** `<medium, lighting direction, lens/render style, surface texture, color language>`
- **Aspect Ratios:** Hero `<16:9 / 3:2>`, Split Editorial `<4:3>`, Feature Plates `<16:10>`, Avatars/Marks `<1:1>`.
- **Frame Treatment:** Consistent radius, 1px hairline or full-bleed matte crop, matching ambient tint.

## 7. Composition Pattern Rotation
- Assign non-repeating spatial patterns down each page:
  1. Spatial Product Stage
  2. Editorial Split
  3. Asymmetric Bento Mosaic
  4. Architectural Coordinate Grid
  5. Narrative Sequence
  6. Monumental Typographic Poster
- Rule: Never place two equal-width 3-column card grids back-to-back or across adjacent routes.

## 8. Secondary-Page Richness Contract (Anti-Industrial Rule)
Every non-homepage route MUST include:
- A deliberate opening composition matching the flagship page's typographic scale and spacing generosity (never a cramped default title bar unless `Operate` mode explicitly requires a compact `PageHeader`).
- At least one bespoke focal visual element matching the flagship visual world (style-locked image from `millar-create-image`, code-native SVG/Canvas diagram, or stylized live interactive specimen).
- At least one surface polarity shift (e.g., Warm Cream -> Warm Sand or Light Canvas -> Contrasting Dark Stage) to maintain visual cadence.
- Consistent header, footer, divider, and interactive control finish.

## 9. Motion Physics & Cross-Page Continuity
- **Motion Register:** Productive (`120-260ms`) vs Expressive (`300-640ms`).
- **Signature Easing / Spring:** e.g. `cubic-bezier(0.16, 1, 0.3, 1)` or spring `{ stiffness: 320, damping: 28, mass: 0.9 }`.
- **Cross-Page Bridge:** CSS View Transitions (`view-transition-name`) or shared persistent nav/header state.
- **Reduced Motion:** Strip spatial travel (`translate`, `scale`, `parallax`) under `prefers-reduced-motion: reduce`; retain instant opacity/color feedback.

## 10. Browser Surface Theming
- `::selection`, `caret-color`, `:focus-visible` 2px ring + offset, `text-underline-offset`, subtle themed scrollbars.
```

## Non-Negotiable Rule for Multi-Page Builds

Never treat `.millar/style-dna.md` as passive documentation. Before authoring any new page or component, re-read Sections 3, 4, 6, 8, and 9 and map them directly into CSS tokens and layout primitives.
