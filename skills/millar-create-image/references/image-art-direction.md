# Image Art Direction & Subject-First English Prompt Engineering (v0.4)

Always author image-generation prompts in **crisp, idiomatic English**, regardless of the user's conversation language. Never hardcode another brand's colors: derive every palette, material, and **Iconic Brand Motif** dynamically from `.millar/research-dossier.md`, `.millar/style-dna.md`, local `DESIGN.md`, or live Brand MCP tokens.

---

## 1. The `65/35` Subject-First Prompt Architecture (`85-145` Words Total)

Modern image models (`Gemini Image`, `Imagen`, `Flux`) divide attention across every word you write. Old `80% boilerplate / 20% subject` prompts (`230+` words) starve the focal story and yield stiff, generic rooms. Flip the ratio:

```text
[65-75% CONCRETE SUBJECT, SPATIAL CHOREOGRAPHY & ICONIC BRAND MOTIFS]
  1. Exact frame geometry (Left third -> Center-right -> Far edge) and lens/angle.
  2. Visible narrative contrast (BOTH State A and State B in frame, never an empty backdrop).
  3. Elevated Iconic Brand Motifs rendered in tactile physical materials anchored to researched #HEX tones.

+ [25-35% COMPACT LOCKED WORLD TAIL]
  4. Shared lighting direction, optical grain/film finish, and physical surface bridge linking the series.
  5. Max 4-6 surgical exclusions (zero text, zero UI cards, zero cold neon, zero wax skin).
```

### Why `85-145` Words Beats `240` Words
- **Keep What Only You Know:** Exact spatial layout, who is in shadow vs. light, exact brand motif (e.g., torn cotton-paper margin, matte ivory ceramic & brushed-bronze companion hand), genuine emotional gesture, and researched `#HEX` color anchors paired with physical materials.
- **Cut Repetitive Filler:** Never list 12 wall/desk/fabric patina adjectives or 15 redundant negative bans; excessive background micro-details pull diffusion attention away from the emotional focal center!

### Generic `65/35` Pattern Template (Fill Dynamically From Brand Research)

```text
A museum-grade 16:9 <editorial photograph / overhead medium-format studio photograph> (<lens>, <f-stop>) capturing <1-second emotional/brand transformation>.
Left third: <State A in researched dark/muted polarity (#HEX) with concrete human/environmental presence>.
Center-right: <single directional warm/calibrated light (#HEX to #HEX) illuminating State B focal subject with genuine natural expression and elevated Iconic Brand Motif>.
Far edge / tactile frame anchor: <researched signature physical edge or surface material bridging the series>.
Natural 35mm/medium-format film grain, authentic tactile textures, zero text, zero UI chrome, zero <unwanted clichés>.
```

---

## 2. Brand Motif Elevation Law (Never Substitute Iconic Motifs!)

During Pass 1, list EVERY signature motif discovered in `DESIGN.md` / brand deck / live site. When prompting, **elevate** each motif into high-craft physical reality instead of dodging it:

| Brand Motif Discovered in Research | Amateur / Timid Substitution (REJECT!) | Millar v0.4 Elevated Craft Execution (SHIP!) |
|---|---|---|
| **Shadowed unseen crowd -> illuminated focal subject** | Empty desks in shadow + 1 person in daylight (loses narrative tension) | Visible desaturated shallow-focus figures in deep shadow on left contrasting warm directional spotlight bringing focal subjects into crisp natural color on right |
| **Human hand + AI/robotic hand collaboration** | Anonymous smooth ceramic egg/sphere on a napkin (dodges the motif!) | Warm matte-ivory porcelain-ceramic & satin brushed-bronze articulated hand reaching gently to meet a real human hand over a handmade sketchbook & brass pen (zero cold chrome/cyan!) |
| **Signature physical border/seam (e.g., torn paper, wax seal, stitched folio)** | Dropping the signature edge completely in photo plates | Integrating a subtle real hand-torn cotton-paper margin or deckle seam naturally along the edge or split plane across multiple plates to unify the series |
| **Fragmented chaos -> exact numbered loop (`1..9`) + brand emblem** | Pure AI diffusion (miscounts `1,2,4,6,6`) OR flat bare Canvas 2D (breaks photo cohesion) | **`Path H` Hybrid:** Photorealistic tactile studio stage (espresso board, tilted physical slips, real torn paper seam) + 2K Playwright precision SVG overlay |

---

## 3. Dynamic HEX-to-Physical-Material Anchoring

Pair researched hex codes directly with real physical materials so image models lock BOTH hue accuracy AND tactile realism:

| Brand Token Role (From Research / MCP / DESIGN.md) | How to Anchor in English Image Prompts |
|---|---|
| **Light Primary Ground** | `heavyweight unbleached cotton paper (<#hex>)`, `warm archival rag paper`, `sunlit chalk plaster`, or `pale raw linen` |
| **Alternating Secondary Surface** | `pale travertine stone (<#hex>)`, `oatmeal woven linen`, `deckle-edged cream notebook`, or `brushed birch` |
| **Contrasting Dark Stage** | `deep matte espresso archival board (<#hex>)`, `dark roasted walnut table`, `matte obsidian stone`, or `deep indigo slate` |
| **Primary Structural Accent** | `satin brushed bronze (<#hex> to <#hex>)`, `burnished brass fountain pen`, `anodized graphite`, or `cobalt enamel` |
| **High-Tension Focal Accent** | `matte editorial crimson (<#hex>)` strictly constrained to tension/fragmentation marks within the researched accent ceiling |

---

## 4. Unified Physical World Across Multi-Plate Series (`Series Cohesion >= 9.5/10`)

A multi-plate set reads as one iconic campaign ONLY when every plate shares the same physical world:
- **Carry at Least Two Shared Physical Anchors Across Every Plate:** For example, if the brand pairs *deep espresso wood/board*, *warm cream cotton paper*, *hand-torn deckle edge*, and *satin brushed bronze*, carry that physical materiality consistently across **Plate 01 (Photo)**, **Plate 02 (`Path H` Hybrid Photo + Vector)**, and **Plate 03 (Photo)**; never switch Plate 02 into a bare flat line drawing or drop the dark anchor completely on Plate 03!
- **Honor Researched Polarity Rhythm Without Losing Cohesion:** Alternate light/dark balance per `DESIGN.md` while keeping the **dark anchor** (e.g., espresso desk surface or left espresso split panel) and **light paper** (e.g., open cream sketchbook or torn right paper edge) echoing across plates.
- **2K Native Master Standard:** Export flagship 16:9 plates at **`2048x1152`** (via Lanczos resample or native 2K Playwright Chromium capture) so photographic and hybrid plates share identical pixel sharpness.

---

## 5. Dual Provenance: Embedded PNG `tEXt` + `.prompt.json` Sidecar

Embed provenance directly into every shipping PNG AND write a human-readable sidecar using the bundled zero-dependency Node script:

```bash
node <skill-dir>/scripts/embed-provenance.mjs path/to/plate-01.png \
  --prompt="<exact English prompt>" \
  --brand="DESIGN.md (Researched Brand DNA)" \
  --method="path-a-editorial-photography" \
  --aspect="16:9" \
  --sidecar

# Verify embedded chunks anytime:
node <skill-dir>/scripts/embed-provenance.mjs --read path/to/plate-01.png
```

---

## 6. Routing to Specialist Craft Playbooks

- **Real People / Classrooms / Warm Documentary Emotion:** Read [human-editorial-photography.md](human-editorial-photography.md).
- **Hybrid Tactile Photo Stage + 2K Precision Vector Diagrams (`Path H`):** Read [hybrid-plate-compositing.md](hybrid-plate-compositing.md).
- **503/Offline Fallback OR Pure Code-Native Monograph Plates (`Path B`):** Read [procedural-gallery-craft.md](procedural-gallery-craft.md).
