# Visual & Motion DNA Extraction Protocol

Use this protocol whenever the user supplies existing images, screenshots, Figma exports, videos, Lottie/Rive files, or an already-styled Hero/Homepage. Never skip straight to coding secondary pages using only the font family and accent color.

## 1. Image & Visual Artifact Inspection Checklist

Open every supplied image or rendered flagship page with your file/vision reader and record these 8 concrete observations:

1. **Medium & Materiality:** Editorial photography, matte 3D ceramic/clay, architectural line drawing, archival paper collage, warm studio photography, glossy glass/obsidian render, or clean product UI chrome?
2. **Lighting Paradigm:** Soft diffused north-window daylight, golden-hour warm side-light, deep espresso rim-glow, high-key studio softbox, or flat print matte? Record light direction (top-left, backlit horizon, overhead).
3. **Color Temperature & Gamut:** Warm sand/cream, cool slate/ice, high-contrast ink-on-paper, or muted earth pigments? Translate key hex values into descriptive art-direction phrases for image models (e.g. `#FAF3EA` -> "warm unbleached archival cream paper"; `#B3121B` -> "deep Venetian crimson accent used sparingly").
4. **Contrast & Shadow Character:** Soft wide offset shadows, razor-thin 1px borders with zero shadows, or deep dramatic stage contrast?
5. **Framing & Negative Space:** Full-bleed edge-to-edge, matted inside generous margins, asymmetric 60/40 crop, or centered isolated object with breathing room for typography?
6. **Surface Grain & Finish:** Crisp digital vector, subtle fine archival paper grain, matte ceramic finish, or brushed dark metal?
7. **Detail Density:** Minimal gallery stillness (low density, large focal object) vs technical instrument precision (hairline grids, tabular indices, tight annotations)?
8. **Recurring Motifs:** Geometric arches, coordinate crosshairs, hairline rules, pill badges, editorial pull-quotes, or organic tear/horizon dividers.

## 2. Existing Animation & Interaction Extraction Checklist

Inspect existing CSS, Tailwind, Framer Motion / Motion, GSAP, Lottie, or video references and record:

1. **Tempo Register:** Snappy productive (`120-240ms`) vs calm editorial expressive (`360-640ms`) vs physical spring feel.
2. **Curve Family:** Exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`), smooth cubic (`cubic-bezier(0.22, 1, 0.36, 1)`), or spring `{ stiffness, damping, mass }`.
3. **Motion Material:** Subtle `translateY(12-20px)` + opacity, clip-path mask wipe, gentle `scale(0.97 -> 1)`, blur-to-sharp settle, or shared-element layout morph.
4. **Trigger Discipline:** Only on direct user interaction (hover/click/tab switch), single focal entrance on first viewport, or scroll-linked progress?
5. **Stagger Cadence:** Sibling delay step (e.g. `40ms` per item, capped total delay `<= 280ms`).

## 3. Translation into Cross-Page Propagation Rules

Convert the extracted observations into concrete rules every secondary page MUST obey:

- **Surface Echo:** Secondary pages reuse the exact same ground/alternating/dark-stage surface rhythm (never reverting to default `#FFFFFF` + `#F3F4F6` Tailwind gray boxes).
- **Visual Anchor Rule:** If Page 1 has warm matte studio photography or refined geometric illustrations, Page 2 (`/features`, `/about`, `/pricing`) MUST pair its copy with style-locked assets from the exact same medium/lighting (via `millar-create-image`) or matching code-native plates.
- **Border & Radius Lock:** Reuse the exact radius ladder and border opacity across every card, input, image frame, and button on every route.
- **Motion Parity:** Export shared timing/easing CSS custom properties or spring constants so Page 2..N move with identical physical weight as Page 1.
