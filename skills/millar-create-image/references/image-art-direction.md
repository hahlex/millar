# Image Art Direction & Subject-First English Prompt Engineering (v0.5)

Always author image-generation prompts in **crisp, idiomatic English**, regardless of the user's conversation language. Never hardcode another brand's colors: derive every palette, material, and **Iconic Brand Motif** dynamically from `.millar/research-dossier.md`, `.millar/style-dna.md`, local `DESIGN.md`, or live Brand MCP tokens.

---

## 1. The `65/35` Subject-First Prompt Architecture (`80-135` Words Total)

Modern image models (`Gemini Image`, `Imagen`, `Flux`) divide attention across every word you write. Old `80% boilerplate / 20% subject` prompts (`230+` words) starve the focal story and yield stiff, posed rooms. Use this crisp structure:

```text
[65-75% CONCRETE MID-ACTION SUBJECT, CONTEXT-RIGHT LIGHT & ICONIC BRAND MOTIFS]
  1. Honest context-appropriate lighting (bright airy daylight for teaching/schools/community; low-key ONLY for genuine night/dark stages).
  2. Specific kinetic mid-action verb + real lived-in props + genuine mutual human reaction (NEVER frozen "pointing softly" or awkward hovering hands).
  3. Elevated Iconic Brand Motifs rendered in living tactile materials (NO raw #HEX strings in natural photo/illustration prompts!).

+ [25-35% COMPACT LOCKED WORLD TAIL]
  4. Shared optical/illustration medium (35mm film grain OR hand-held sepia fountain-pen & translucent watercolor wash) bridging the series.
  5. Max 4-6 surgical exclusions (zero dark gloom, zero stiff poses, zero text clutter, zero cold neon).
```

---

## 2. Brand Motif Elevation Without Artificial Gloom or Stiffness

During Pass 1, list EVERY signature motif discovered in `DESIGN.md` / brand deck / live site, then elevate each one naturally:

| Brand Motif Discovered in Research | Failure Modes to REJECT | Millar v0.5 Natural Kinetic Craft Execution |
|---|---|---|
| **"Every learner seen" (classroom focus & mentorship)** | Pitch-black gloomy cave classroom with theatrical spotlight OR empty desks with a stern standing proctor | **Bright, sunlit morning classroom**: teacher crouched at eye-level actively sketching a geometry step in a student's open notebook margin while the teenager leans in smiling in real discovery; classmates work softly out-of-focus in bright open window daylight behind them (`f/2.0` optical focus, zero gloom!) |
| **Human + Warm AI collaboration** | Anonymous ceramic orb on a napkin OR two stiff hands hovering awkwardly touching fingertips in mid-air | **Concrete mid-action collaboration**: teacher's hand actively drawing/circling a diagram with a brass pen in a sunlit open sketchbook while the warm matte-ivory ceramic & satin-bronze companion hand naturally steadies the paper corner or slides a cream index slip beside the sketch |
| **Warm hand-drawn brand storytelling** | Uniform `1px` CAD vector outlines or flat corporate Memphis cartoons | **`Path A-Illustration` (`natural-editorial-illustration.md`)**: expressive variable-weight sepia fountain-pen/graphite linework + loose translucent watercolor/gouache washes + 30-45% breathing warm cotton paper reserve |
| **Fragmented chaos -> exact numbered loop (`1..9`) + brand emblem** | Pure AI diffusion (miscounts `1,2,4,6,6`) OR sterile web-UI pill buttons & shiny plastic 3D bevel marbles pasted on paper | **`Path H` Organic Hybrid (`hybrid-plate-compositing.md`)**: pure blank photographic paper/board/torn-edge stage + 2K Playwright letterpress SVG (`mix-blend-mode: multiply`, subtle edge tooth, matte foil medallions, bare editorial labels, canonical brand SVG mark) |

---

## 3. Natural Pigment & Material Translation (Drop `#HEX` From Natural Art Prompts!)

Raw `#HEX` strings inside natural photography or watercolor illustration prompts push models toward artificial flat digital color-grading. Reserve exact `#HEX` strictly for CSS/SVG tokens (`Path H` Stage 2 & `Path B`); translate them into living light and artist pigments for `Path A`:

| Brand Token Role (From Research / MCP / DESIGN.md) | Natural Material / Pigment Language for `Path A` Prompts |
|---|---|
| **Light Primary Ground** | `unbleached warm cream cotton paper`, `sunlit pale plaster wall`, `cold-press archival rag paper`, `pale raw linen` |
| **Alternating Secondary Surface** | `warm oat linen shirt`, `pale travertine stone`, `weathered honey teak desk`, `raw sand paper slip` |
| **Dark Structural Anchor** | `oiled dark walnut tabletop`, `matte roasted-espresso matboard`, `deep walnut-sepia ink`, `dark slate chalkboard` |
| **Primary Positive Accent** | `burnished brass fountain pen`, `satin honey-bronze wash`, `raw sienna watercolor`, `warm ochre daylight` |
| **High-Tension Focal Accent** | `single touch of warm vermilion pencil`, `delicate carmine red marking ink` (kept strictly within researched accent ratio) |

---

## 4. Dual Provenance: Embedded PNG `tEXt` + `.prompt.json` Sidecar

Embed provenance directly into every shipping `2048px` PNG AND write a human-readable sidecar using the bundled zero-dependency Node script:

```bash
node <skill-dir>/scripts/embed-provenance.mjs path/to/plate-01.png \
  --prompt="<exact English prompt>" \
  --brand="DESIGN.md (Researched Brand DNA)" \
  --method="path-a-daylight-editorial-photography" \
  --aspect="16:9" \
  --sidecar

# Verify embedded chunks anytime:
node <skill-dir>/scripts/embed-provenance.mjs --read path/to/plate-01.png
```

---

## 5. Routing to Specialist Craft Playbooks

- **Bright Sunlit Classrooms, Teaching & Concrete Kinetic Human Photography:** Read [human-editorial-photography.md](human-editorial-photography.md).
- **Natural Hand-Drawn Editorial Illustration & Organic Linework:** Read [natural-editorial-illustration.md](natural-editorial-illustration.md).
- **Organic Printed-on-Paper Hybrid Photo + 2K Vector Diagrams (`Path H`):** Read [hybrid-plate-compositing.md](hybrid-plate-compositing.md).
- **503/Offline Fallback OR Pure Code-Native Monograph Plates (`Path B`):** Read [procedural-gallery-craft.md](procedural-gallery-craft.md).
