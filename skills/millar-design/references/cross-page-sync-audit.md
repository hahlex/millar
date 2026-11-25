# Cross-Page Visual Continuity Audit Rubric

Run this audit whenever a project contains 2 or more pages (or when adding a new page to an existing site). Compare rendered screenshots of the **Flagship Reference Page** (typically Homepage or the page containing the user's supplied images/animations) side-by-side against **every secondary route**.

## The 6 Continuity Axes (Score 1 to 5 per Secondary Route)

| Axis | Score 1-2 (Industrial Drift: FAIL) | Score 4-5 (Cohesive World: PASS) |
|---|---|---|
| **1. Surface & Color Temperature Parity** | Secondary page falls back to plain white/gray blocks while Page 1 uses warm paper, dark stages, or tinted elevation. | Identical canvas temperature, alternating surface polarity cadence, border hairlines, and accent proportion budget. |
| **2. Visual Richness & Focal Anchor** | Secondary page is text-only or generic 3-column icon cards with zero bespoke imagery/diagrams/chrome. | Contains at least one bespoke focal visual matching Page 1's exact art direction (style-locked image, diagram plate, or stylized interactive chrome). |
| **3. Media & Graphic Framing** | Different aspect ratios, harsh unframed cutouts, mismatched lighting/saturation, or conflicting border radii. | Consistent aspect ratio discipline, lighting temperature, matte/hairline frame treatment, and corner radius ladder. |
| **4. Composition Variety & Pacing** | Repetitive card grid or cramped unpaced stack; feels auto-generated compared to Page 1's editorial rhythm. | Deliberate opening composition + varied spatial grammars matching Page 1's whitespace generosity and typographic scale. |
| **5. Motion & Interaction Grammar** | Page 1 has smooth spring/editorial motion while secondary pages snap abruptly or use generic bounce/fade-up defaults. | Same easing/spring physics, tactile hover/active responses, clean route transition continuity, and `prefers-reduced-motion` support. |
| **6. Micro-Detail & Craft Floor** | Default blue focus rings, unaligned numbers, inconsistent icon strokes, dead preview buttons, or overflow on mobile. | Consistent icon stroke weight, `tabular-nums`, themed `::selection`/focus rings, working interactive states, and 0px overflow at 375px/768px/1440px. |

## Mandatory Remediation Protocol

1. Capture full-viewport screenshots of Flagship Page AND each secondary route at `1440px` and `375px`.
2. Score every secondary route honestly against the 6 axes above.
3. **Gate Rule:** Any route with ANY axis `< 4` fails the Continuity Audit.
4. For each failing axis, apply targeted remediation before shipping:
   - Missing visual anchor -> invoke `millar-create-image` with the locked 80% Style DNA prefix (or compose a matching Millar code-native visual asset).
   - Flat/industrial layout -> recompose the opening and primary section using a distinct pattern from the Style DNA Contract (`Editorial Split`, `Spatial Stage`, `Asymmetric Bento`, `Architectural Grid`).
   - Mismatched motion -> invoke `millar-animation` to unify timing tokens, easing curves, and interactive feedback.
5. Re-capture and confirm all secondary routes achieve `>= 4/5` across all 6 axes AND pass Millar MCP `validate_design` with zero automated violations.
