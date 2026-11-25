# Visual & Motion DNA Extraction Protocol

Use this protocol whenever the user names a brand, supplies existing images/screenshots/animations, or provides an already-styled flagship page. Never skip directly to coding secondary pages using only a font family and accent hex, and never substitute hardcoded tokens from an unrelated brand.

## 1. Brand & Visual Artifact Inspection Checklist (Write Output in English)

Inspect every supplied image, rendered page, brand guideline, or token file directly and record these 8 concrete observations in crisp English:

1. **Medium & Materiality:** Editorial documentary photography, tactile matte 3D, architectural linework, fine engraving/halftone print, archival paper texture, dark lacquer/obsidian, or crisp solid product UI chrome?
2. **Lighting Paradigm:** Soft diffused north-window daylight, humid tropical louver daylight, golden-hour low side-light, warm chiaroscuro lamp cone, studio softbox, or clean flat print matte? Always specify exact light direction (e.g., top-left 35 deg, warm backlight, grazing horizon light).
3. **Color Temperature & Polarity Ratio:** Record the brand's ACTUAL light/dark surface balance (for example, predominantly light archival surfaces with one dark anchor band vs. dark-native instrument UI vs. saturated color-blocked editorial). Translate verified hex tokens into physical material language in English (for example: `<light-ground-hex>` -> "unbleached cotton archival paper", `<dark-stage-hex>` -> "matte roasted walnut lacquer", `<focal-accent-hex>` -> "sparingly applied carmine registration mark").
4. **Contrast & Shadow Character:** Wide soft offset shadow, razor-thin 1px structural hairline with zero shadow, or dramatic chiaroscuro depth?
5. **Framing & Negative Space:** Full-bleed edge-to-edge, matted inside >= 6% archival margins, asymmetric 60/40 crop leaving calm headline headroom, or tight macro focal crop?
6. **Surface Grain & Finish:** Fine 35mm photographic grain, subtle archival cotton-paper tooth, matte ceramic/stone texture, or clean high-DPI vector precision?
7. **Detail Density:** Quiet gallery stillness vs. intricate engraving/cartographic precision vs. dense operational data clarity?
8. **Cultural & Environmental Truth:** Real-world architecture, furniture, clothing, signage language, and regional daylight belonging authentically to the brand's audience (avoiding generic stock-photo clichés).

## 2. Existing Animation & Interaction Extraction Checklist

Inspect existing CSS, Tailwind, Motion/Framer, GSAP, Lottie, or video references and record:

1. **Tempo Register:** Snappy productive (`120-240ms`) vs. calm editorial expressive (`320-640ms`) vs. interruptible physical spring.
2. **Curve Family:** Exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`), smooth cubic (`cubic-bezier(0.22, 1, 0.36, 1)`), or spring `{ stiffness, damping, mass }`.
3. **Motion Material:** Subtle `translateY` + opacity settle, clip-path/mask reveal, tactile scale micro-feedback, or shared-element View Transition.
4. **Trigger Discipline:** Direct user action (hover/click/tab switch), single hero choreography, or scroll-linked progress without trapping content at `opacity: 0`.
5. **Stagger Cadence:** Sibling delay step (e.g., `40ms` per item, capped total delay `<= 280ms`).

## 3. Translation into Cross-Page Propagation Rules

Convert observed findings into binding rules for EVERY secondary page:

- **Surface Polarity Echo:** Secondary pages inherit the exact researched ground/alternating/counter-weight surface cadence (never reverting to generic white + uncalibrated gray Tailwind boxes).
- **Visual Anchor Rule:** If Page 1 features documentary photography, editorial still-life, or engraved visual plates, secondary pages (`/features`, `/pricing`, `/about`, `/docs`) MUST pair copy with matching style-locked assets produced via `millar-create-image` using the same English Master Style Prefix.
- **Border, Radius & Elevation Lock:** Reuse the identical corner-radius ladder, 1px hairline or soft shadow discipline, and image framing rules across every route.
- **Motion Parity:** Export shared CSS custom properties or spring constants so Page 2..N move with identical physical weight as Page 1.
