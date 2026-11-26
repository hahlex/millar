# Human Editorial & Documentary Photography Playbook (v0.4)

Consult this playbook whenever generating or art-directing **real human photography** (portraits, classrooms, mentorship scenes, hands at craft, founder/team portraits, color or black-and-white editorial series).

**Core Rule:** Author **100% of photographic prompts in crisp, `85-145` word English (`65%` Subject & Emotional Choreography / `35%` Film, Light & Material Lock)**. Never hardcode another brand's palette: derive wardrobe, room tone, and lighting strictly from the researched Brand DNA.

---

## 1. Authentic Human Warmth vs. Stock-Ad Clichés (CRITICAL DISTINCTION)

Never confuse **fake stock-photo smiles** with **genuine human warmth**:
- **BANNED (Stock-Ad Cliché):** Staring straight into the camera with blinding toothy grins, thumbs-up, high-fives, sterile white studios, plastic airbrushed "wax skin", or forced corporate pointing at laptops.
- **ENCOURAGED (Genuine Absorbed Human Warmth):** People deeply engaged **with each other or with their real work**, NEVER performing for the lens:
  - A teacher leaning close beside a student with a **gentle, genuine encouraging smile**, pointing softly at an open notebook while both look at the page (never stern, stiff, or standing like an exam proctor unless the brief calls for tension!).
  - An artisan's calm focused gaze on their hands shaping clay, pouring coffee, or sketching architectural lines.
  - A quiet moment of real recognition, curiosity, or relief captured mid-action.
- **Natural Skin & Hands Hygiene (Compact, Never Bloated):**
  - One crisp phrase is enough: *"natural 35mm film grain, authentic unretouched skin texture, lived-in matte fabrics, anatomically natural hands."*
  - Do NOT spend 60 words describing pores, stray hairs, creased collars, and wall plaster; that boilerplate steals diffusion focus from faces, light drama, and brand storytelling!

---

## 2. Spotlight & Contrast Choreography (Show BOTH Halves of the Story!)

Whenever a human scene represents a transformation (such as *unseen -> seen*, *isolated -> mentored*, *shadow -> clarity*):
- **Keep Background Architecture Subordinate:** Do NOT let a huge bright window or peeling lime-washed wall dominate 50% of the frame when the brief calls for dramatic directional spotlight contrast!
- **Show Real People in BOTH Zones:** Put shallow-focus, desaturated secondary figures naturally in the quiet shadowed third (e.g., left third in deep researched dark tone) so the single warm directional spotlight illuminating the foreground focal subjects on the right tells the entire brand story in **0.5 seconds**!
- **Integrate Brand Physical Signatures Naturally:** If the brand's visual system features a signature tactile motif (such as a subtle hand-torn cream cotton-paper margin on the far right edge, a signature color garment accent, or an iconic sketchbook/prop), weave it intentionally into the frame edge or foreground table so the photograph is unmistakably owned by THAT brand!

---

## 3. Cultural & Geographic Grounding (Research First)

Ground every setting in the real everyday world of the brand's audience (researched via `millar-deep-research`):
- **Vietnamese Context Example (When Brief Is Set in Vietnam):** Authentic Vietnamese faces, simple everyday school shirts / warm muted knit cardigans / natural linen, seasoned wooden desks, handwritten paper notebooks, warm natural late-afternoon light (zero US high-school lockers, zero Western corporate glass boxes, zero tourist clichés).
- **Other Regions & Cultures:** Apply the identical research discipline: verify local everyday clothing, furniture, light quality, and architectural scale before writing the prompt.

---

## 4. Concise `85-135` Word Prompt Patterns (Subject-First)

### A. Dramatic Editorial Spotlight / Narrative Contrast (`16:9`)
```text
A sweeping, museum-grade 16:9 editorial photograph capturing <1-second narrative contrast> in a <researched real-world setting>.
Left third in deep <researched dark ground (#HEX)> shadow with desaturated shallow-focus <background subjects> at <authentic furniture>;
center-right illuminated by a single warm directional <accent light (#HEX to #HEX)> bringing <focal primary subject absorbed in work> and <warm encouraging mentor/companion leaning gently beside them> into crisp natural color,
grounded by <researched brand signature tactile edge or foreground anchor>.
Natural 35mm film grain, authentic unretouched skin texture, zero text, zero UI cards, zero cold neon lighting.
```

### B. Intimate Hands & Brand-Motif Still-Life (`16:9` or `3:2`)
```text
An intimate three-quarter overhead medium-format photograph (80mm f/2.8) in warm golden-hour window light where <real human hand in researched natural fabric cuff> reaches gently from the left to meet <elevated brand companion object/hand crafted in researched matte tactile materials, never cold chrome/neon> entering from the right,
above <open heavyweight cotton notebook / craft surface (#HEX)> with delicate <accent-ink annotations> and <tactile tool> on a <researched dark wood/stone desk (#HEX)>.
Fine medium-format grain, authentic skin and material texture, zero text clutter, zero cold cyan glow, zero holograms.
```

### C. Matching Black-and-White Documentary Plate (`3:2` or `4:3`)
```text
Timeless silver-gelatin monochrome documentary photograph on 50mm f/2.4 matching the series daylight direction:
<quiet decisive human detail absorbed in real craft or study with calm uncluttered negative space>,
rich luminous midtones, open detailed shadows, authentic fine 400-ISO film grain, zero harsh HDR, zero posed camera smiles, zero text or watermarks.
```

---

## 5. Human-Photo Pass 4 Vision Audit (Instant Reject Triggers)

Inspect every generated human photo at full `2048px` resolution before accepting:
- [ ] **Brand Story in 0.5 Seconds:** Does the emotional contrast and every requested brand motif read immediately (no empty desks replacing shadowed peers, no stiff/stern faces where warmth belongs)?
- [ ] **Authentic Skin & Warmth:** Real pores and natural catchlights; genuine absorbed human warmth (zero wax-skin HDR and zero fake camera grins).
- [ ] **Anatomical Precision:** Exact 5 natural fingers per hand, plausible joints/wrists, clean pencils/notebooks (zero melted props).
- [ ] **Series Material Cohesion:** Matches the exact dark anchor, light ground, light direction, and tactile finish of all other plates in the series.
- [ ] **Dual Provenance Embedded:** PNG `tEXt` chunk + `.prompt.json` written via `scripts/embed-provenance.mjs --sidecar`.
